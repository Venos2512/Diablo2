// WebGPU / TSL frame pipeline — mirrors ../webgl/pipeline.js stage by stage:
//   scene pass (MRT: output + normal [+ velocity] [+ debug channels])  ->  GTAO + denoise  ->  height fog
//   ->  VFX pass (separate scene, premultiplied)  ->  [TRAA]  ->  bloom  ->  display transform
//   ->  FXAA / SMAA  ->  retro preview.
// Uniform-only changes are applied live; structural changes (AA type, AO/bloom on-off, debug channel,
// tone mapping operator, MSAA) rebuild the node graph.
import * as THREE from 'three/webgpu';
import { pass, mrt, output, normalView, normalWorld, diffuseColor, emissive, metalness, roughness, velocity, texture, vec2, vec3, vec4, mix, convertToTexture, nodeObject } from 'three/tsl';
import { ao } from 'three/addons/tsl/display/GTAONode.js';
import { denoise } from 'three/addons/tsl/display/DenoiseNode.js';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { fxaa } from 'three/addons/tsl/display/FXAANode.js';
import { smaa } from 'three/addons/tsl/display/SMAANode.js';
import { traa } from 'three/addons/tsl/display/TRAANode.js';
import { TONE_MAPPINGS, whiteBalance, exposureScale } from '../../core/grading.js';
import { createPostUniforms, heightFog, displayTransform, retroPreview } from './tsl/post.js';
import { labLinearToSRGB, labPbrValidate } from './tsl/common.js';

const _wb = new THREE.Vector3();
const _clear = new THREE.Color();

/**
 * Pass for the VFX scene that always clears to transparent black. A plain PassNode clears with the
 * renderer's current clear colour, and nodes such as SMAA reset that to opaque black while they
 * pull their inputs — which would make the premultiplied VFX layer cover the whole frame.
 */
class TransparentPassNode extends THREE.PassNode {
	updateBefore(frame) {
		const renderer = frame.renderer;
		renderer.getClearColor(_clear);
		const alpha = renderer.getClearAlpha();
		renderer.setClearColor(0x000000, 0);
		super.updateBefore(frame);
		renderer.setClearColor(_clear, alpha);
	}
}
const transparentPass = (scene, camera) => nodeObject(new TransparentPassNode(THREE.PassNode.COLOR, scene, camera));

// Exposed for console experiments: window.__LAB__.tsl
export const TSL_PLAYGROUND = { THREE, ao, denoise, bloom, fxaa, smaa, traa, pass, mrt, output, vec2, vec3, vec4, mix, convertToTexture, texture };

export class WebGPUPipeline {
	constructor(renderer) {
		this.renderer = renderer;
		this.post = new THREE.PostProcessing(renderer);
		this.post.outputColorTransform = false;
		this.u = createPostUniforms();
		this.settings = null;
		this.debugChannel = 0;
		this.world = null;
		this.key = '';
		this.nodes = {};
		// Shared with TSL VFX materials: always points at the current scene pass depth texture.
		this.sceneDepth = texture(new THREE.DepthTexture(1, 1));
		this.width = 1;
		this.height = 1;
		this.lut = null;
	}

	get sceneDepthTexture() {
		return this.sceneDepth.value;
	}

	setSize(width, height) {
		this.width = width;
		this.height = height;
		this.u.resolution.value.set(width, height);
	}

	configure(post) {
		this.settings = post;
		const u = this.u;
		u.exposure.value = exposureScale(post.exposure);
		const g = post.grade;
		u.whiteBalance.value.copy(whiteBalance(g.temperature, g.tint, _wb));
		u.saturation.value = g.saturation;
		u.contrast.value = g.contrast;
		u.lift.value = g.lift;
		u.gamma.value = g.gamma;
		u.gain.value = g.gain;
		u.vignette.value = g.vignette;
		u.grain.value = g.grain;
		u.chromatic.value = g.chromatic;
		u.aoIntensity.value = post.ao.intensity;
		const fog = post.fog;
		u.fogDensity.value = fog.density;
		u.fogFalloff.value = fog.falloff;
		u.fogHeight.value = fog.height;
		u.fogStart.value = fog.start;
		u.fogColor.value.set(fog.color);
		u.inscatter.value = fog.inscatter;
		u.retroHeight.value = post.retro.height;
		u.retroLevels.value = post.retro.levels;
		u.retroDither.value = post.retro.dither;
		u.lutIntensity.value = !this.lut ? 0 : this.lut.check ? 1 : post.lut?.look !== 'none' ? post.lut.intensity : 0; // check views (core/lut.js withCheck) are baked at full strength
		this.applyNodeParams();
	}

	/** lut: { strip: DataTexture, size } from core/lut.js, or null (rebuilds the display graph). */
	setLut(lut) {
		this.lut = lut;
		if (this.settings) this.configure(this.settings);
	}

	applyNodeParams() {
		const s = this.settings;
		const { aoNode, bloomNode, vfxPass } = this.nodes;
		if (aoNode && s) {
			aoNode.radius.value = s.ao.radius;
			aoNode.distanceExponent.value = s.ao.distanceExponent;
			aoNode.thickness.value = s.ao.thickness;
			aoNode.scale.value = s.ao.scale;
			aoNode.resolutionScale = s.ao.resolution;
		}
		if (bloomNode && s) {
			bloomNode.strength.value = s.bloom.strength;
			bloomNode.radius.value = s.bloom.radius;
			bloomNode.threshold.value = s.bloom.threshold;
		}
		if (vfxPass && s) vfxPass.setResolution(s.vfxResolution);
	}

	setPassthrough(channel) {
		this.debugChannel = channel;
	}

	structureKey() {
		const s = this.settings;
		const w = this.world;
		return [
			w.scene.uuid, w.vfxScene.uuid, w.camera.uuid, s.aa, s.ao.enabled, s.bloom.enabled, s.fog.enabled,
			s.toneMapping, s.falseColor, s.retro.enabled, s.grade.chromatic > 0, this.debugChannel, this.lut?.strip.uuid || 'nolut',
		].join('|');
	}

	rebuild() {
		const { scene, vfxScene, camera } = this.world;
		const s = this.settings;
		const u = this.u;
		const channel = this.debugChannel;
		const passthrough = channel > 0;
		const aoOn = s.ao.enabled && (!passthrough || channel === 8);
		const traaOn = s.aa === 'traa' && !passthrough;

		const scenePass = pass(scene, camera, { samples: s.aa === 'msaa' ? 4 : 0 });
		// WebGPU caps colour attachments at 32 bytes per sample (four RGBA16F targets), so the
		// debug channels are packed: albedo.rgb + metalness, normal.xyz + roughness, emissive.
		const outputs = { output };
		if (aoOn) outputs.normal = normalView;
		if (traaOn) outputs.velocity = velocity;
		if (passthrough && channel !== 8) {
			outputs.albedoMetal = vec4(diffuseColor.rgb, metalness);
			outputs.normalRough = vec4(normalWorld, roughness);
			outputs.emi = emissive;
		}
		if (Object.keys(outputs).length > 1) scenePass.setMRT(mrt(outputs));
		this.onLayoutChange?.(Object.keys(outputs).join(','), this.world);

		const color = scenePass.getTextureNode('output');
		const depth = scenePass.getTextureNode('depth');
		this.sceneDepth.value = scenePass.getTexture('depth');
		this.nodes = { scenePass };

		let aoTex = null;
		if (aoOn) {
			const normal = scenePass.getTextureNode('normal');
			const aoNode = ao(depth, normal, camera);
			this.nodes.aoNode = aoNode;
			aoTex = denoise(aoNode.getTextureNode(), depth, normal, camera);
		}

		let display;
		if (passthrough) {
			const views = {};
			if (channel !== 8) {
				const albedoMetal = scenePass.getTextureNode('albedoMetal');
				const normalRough = scenePass.getTextureNode('normalRough');
				Object.assign(views, {
					1: labLinearToSRGB(albedoMetal.rgb),
					2: normalRough.rgb.mul(0.5).add(0.5),
					3: vec3(normalRough.a),
					4: vec3(albedoMetal.a),
					5: vec3(1.0),
					6: labLinearToSRGB(scenePass.getTextureNode('emi').rgb),
					7: labLinearToSRGB(labPbrValidate(albedoMetal.rgb, albedoMetal.a)),
				});
			}
			views[8] = aoTex ? vec3(aoTex.r) : vec3(1.0);
			display = views[channel] || vec3(1, 0, 1);
			// Background pixels (depth = 1) carry undefined MRT data; show them as flat dark grey.
			if (channel !== 8) display = mix(display, vec3(0.04), depth.r.greaterThanEqual(0.999999));
		} else {
			let hdr = color.rgb;
			if (aoTex) hdr = hdr.mul(mix(1.0, aoTex.r, u.aoIntensity));
			this.nodes.aoTex = aoTex;
			this.nodes.afterAO = hdr;
			if (s.fog.enabled) hdr = heightFog(u)(hdr, depth.r);

			const vfxPass = transparentPass(vfxScene, camera);
			this.nodes.vfxPass = vfxPass;
			const vfx = vfxPass.getTextureNode();
			hdr = hdr.mul(vfx.a.oneMinus()).add(vfx.rgb);
			this.nodes.afterVfx = hdr;


			if (s.bloom.enabled) {
				const bloomNode = bloom(vec4(hdr, 1.0), s.bloom.strength, s.bloom.radius, s.bloom.threshold);
				this.nodes.bloomNode = bloomNode;
				hdr = hdr.add(bloomNode.rgb);
			}
			this.nodes.afterBloom = hdr;

			// TRAA resolves after bloom so the jittered bloom is stabilised with everything else.
			if (traaOn) {
				this.nodes.traaNode = traa(vec4(hdr, 1.0), depth, scenePass.getTextureNode('velocity'), camera);
				hdr = this.nodes.traaNode.rgb;
			}

			const chromatic = s.grade.chromatic > 0;
			let sampleHdr = () => hdr;
			if (chromatic) {
				const hdrTex = convertToTexture(vec4(hdr, 1.0));
				sampleHdr = (uv) => hdrTex.sample(uv).rgb;
			}
			display = displayTransform(u, {
				sampleHdr,
				chromatic,
				mode: s.falseColor ? 'falsecolor' : 'graded',
				toneMappingType: TONE_MAPPINGS[s.toneMapping]?.three ?? THREE.AgXToneMapping,
				lut: this.lut,
			});

			this.nodes.display = display;
			if (s.aa === 'fxaa') display = fxaa(vec4(display, 1.0)).rgb;
			else if (s.aa === 'smaa') display = smaa(vec4(display, 1.0)).rgb;
		}

		if (s.retro.enabled && !passthrough) display = retroPreview(u, convertToTexture(vec4(display, 1.0)));

		this.post.outputNode = vec4(display, 1.0);
		this.post.needsUpdate = true;
		this.applyNodeParams();
	}

	render(world) {
		this.world = world;
		const key = this.structureKey();
		if (key !== this.key) {
			this.key = key;
			this.rebuild();
		}
		const u = this.u;
		const camera = world.camera;
		if (this.settings.fog.enabled) {
			camera.updateMatrixWorld();
			u.projInv.value.copy(camera.projectionMatrixInverse);
			u.camWorld.value.copy(camera.matrixWorld);
			u.camPos.value.setFromMatrixPosition(camera.matrixWorld);
			u.fogMaxDist.value = Math.min(camera.far, 400);
			if (world.sun) {
				u.sunDir.value.copy(world.sun.direction);
				u.sunColor.value.copy(world.sun.color);
			} else {
				u.sunColor.value.setRGB(0, 0, 0);
			}
		}
		this.renderer.shadowMap.autoUpdate = true;
		this.post.render();
	}

	dispose() {
		this.post.dispose();
	}
}
