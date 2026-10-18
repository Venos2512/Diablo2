// WebGL2 / GLSL frame pipeline.
//   AO (GTAO, own G-buffer)  ->  Scene (HDR, optional MSAA, depth texture)  ->  VFX layer (premultiplied,
//   soft particles against scene depth, optional half resolution)  ->  Composite (AO, height fog, VFX)
//   ->  Bloom (UnrealBloomPass)  ->  Final (grade, tone map, sRGB)  ->  FXAA / SMAA  ->  Retro preview.
// The WebGPU pipeline (../webgpu/pipeline.js) mirrors these stages in TSL.
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import vertEntry from '../../shaders/post/fullscreen.vert.glsl';
import compositeEntry from '../../shaders/post/composite.frag.glsl';
import finalEntry from '../../shaders/post/final.frag.glsl';
import retroEntry from '../../shaders/post/retro.frag.glsl';
import { hotMaterial } from './hot.js';
import { TONE_MAPPINGS, whiteBalance, exposureScale } from '../../core/grading.js';

function postMaterial(fragEntry, uniforms) {
	const material = new THREE.ShaderMaterial({
		name: fragEntry.path,
		vertexShader: vertEntry.code,
		fragmentShader: fragEntry.code,
		uniforms,
		depthTest: false,
		depthWrite: false,
		toneMapped: false,
	});
	return hotMaterial(material, vertEntry, fragEntry);
}

const _wb = new THREE.Vector3();


export class WebGLPipeline {
	constructor(renderer, timer) {
		this.renderer = renderer;
		this.timer = timer;
		this.width = 1;
		this.height = 1;
		this.post = null;
		this.passthrough = false;
		this.showAO = false;

		const depthTexture = new THREE.DepthTexture(1, 1, THREE.FloatType);
		this.sceneRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthTexture, samples: 0 });
		this.vfxRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
		this.hdrRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
		this.ldrRT = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
		this.ldrRT2 = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });

		// GTAO reads the scene pass depth (normals reconstructed from depth) instead of rendering its own
		// MeshNormalMaterial G-buffer: one scene render less, and AO follows whatever the real materials
		// do to the surface (wind sway, dissolve holes), like the TSL pipeline that uses its MRT depth.
		this.gtao = new GTAOPass(new THREE.Scene(), new THREE.PerspectiveCamera(), 1, 1);
		this.gtao.setGBuffer(depthTexture);
		this.gtao.normalRenderTarget.dispose(); // r180 still resizes / reads it: keep a stub
		this.gtao.normalRenderTarget = { setSize() {}, dispose() {}, texture: null, depthTexture: null };
		this.gtao.output = GTAOPass.OUTPUT.Off;
		this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.35, 0.4, 1.0);
		this.smaa = new SMAAPass();
		this.fxaa = new THREE.ShaderMaterial({
			name: 'FXAA',
			vertexShader: FXAAShader.vertexShader,
			fragmentShader: FXAAShader.fragmentShader,
			uniforms: THREE.UniformsUtils.clone(FXAAShader.uniforms),
			depthTest: false,
			depthWrite: false,
		});

		this.composite = postMaterial(compositeEntry, {
			tScene: { value: null },
			tDepth: { value: depthTexture },
			tAO: { value: null },
			tVFX: { value: this.vfxRT.texture },
			uAOIntensity: { value: 0 },
			uShowAO: { value: 0 },
			uHasVFX: { value: 0 },
			uFog: { value: 0 },
			uFogDensity: { value: 0.03 },
			uFogFalloff: { value: 0.3 },
			uFogHeight: { value: 0 },
			uFogStart: { value: 2 },
			uFogMaxDist: { value: 250 },
			uFogColor: { value: new THREE.Color() },
			uSunDir: { value: new THREE.Vector3(0, 1, 0) },
			uSunColor: { value: new THREE.Color() },
			uInscatter: { value: 0.5 },
			uProjInv: { value: new THREE.Matrix4() },
			uCamWorld: { value: new THREE.Matrix4() },
			uCamPos: { value: new THREE.Vector3() },
		});

		this.final = postMaterial(finalEntry, {
			tColor: { value: this.hdrRT.texture },
			toneMappingExposure: { value: 1 },
			uMode: { value: 0 },
			uToneMapping: { value: 5 },
			uExposure: { value: 1 },
			uWhiteBalance: { value: new THREE.Vector3(1, 1, 1) },
			uSaturation: { value: 1 },
			uContrast: { value: 1 },
			uLift: { value: new THREE.Vector3() },
			uGamma: { value: new THREE.Vector3(1, 1, 1) },
			uGain: { value: new THREE.Vector3(1, 1, 1) },
			uVignette: { value: 0.2 },
			uGrain: { value: 0 },
			uChromatic: { value: 0 },
			uTime: { value: 0 },
			uResolution: { value: new THREE.Vector2(1, 1) },
			uLut: { value: null },
			uLutSize: { value: 2 },
			uLutIntensity: { value: 0 },
		});
		this.lut = null;

		this.retro = postMaterial(retroEntry, {
			tColor: { value: null },
			uResolution: { value: new THREE.Vector2(1, 1) },
			uTargetHeight: { value: 480 },
			uLevels: { value: 24 },
			uDither: { value: 0.6 },
		});

		this.quad = new FullScreenQuad(null);

		// Shared with GLSL VFX materials (soft particles, depth-tested against the opaque scene).
		this.vfxUniforms = {
			uSceneDepth: { value: depthTexture },
			uVfxSize: { value: new THREE.Vector2(1, 1) },
			uCameraNear: { value: 0.1 },
			uCameraFar: { value: 1000 },
			uOrtho: { value: 0 },
			uOverdraw: { value: 0 },
		};
	}

	get sceneDepthTexture() {
		return this.sceneRT.depthTexture;
	}

	setSize(width, height) {
		this.width = Math.max(1, Math.floor(width));
		this.height = Math.max(1, Math.floor(height));
		const { width: w, height: h } = this;
		this.sceneRT.setSize(w, h);
		this.hdrRT.setSize(w, h);
		this.ldrRT.setSize(w, h);
		this.ldrRT2.setSize(w, h);
		this.applyVfxSize();
		this.applyAoSize();
		this.bloom.setSize(w, h);
		this.smaa.setSize(w, h);
		this.fxaa.uniforms.resolution.value.set(1 / w, 1 / h);
		this.final.uniforms.uResolution.value.set(w, h);
		this.retro.uniforms.uResolution.value.set(w, h);
	}

	applyVfxSize() {
		const s = this.post?.vfxResolution ?? 1;
		this.vfxRT.setSize(Math.max(1, Math.round(this.width * s)), Math.max(1, Math.round(this.height * s)));
		this.vfxUniforms.uVfxSize.value.set(this.vfxRT.width, this.vfxRT.height);
	}

	applyAoSize() {
		const s = this.post?.ao.resolution ?? 0.5;
		this.gtao.setSize(Math.max(1, Math.round(this.width * s)), Math.max(1, Math.round(this.height * s)));
	}

	/** Apply the settings.post tree. Cheap: only uniforms change, except MSAA sample count. */
	configure(post) {
		const prev = this.post;
		this.post = post;
		const samples = post.aa === 'msaa' ? 4 : 0;
		if (this.sceneRT.samples !== samples) {
			this.sceneRT.samples = samples;
			this.sceneRT.dispose();
		}
		if (!prev || prev.vfxResolution !== post.vfxResolution) this.applyVfxSize();
		if (!prev || prev.ao.resolution !== post.ao.resolution) this.applyAoSize();

		const ao = post.ao;
		this.gtao.updateGtaoMaterial({ radius: ao.radius, distanceExponent: ao.distanceExponent, thickness: ao.thickness, scale: ao.scale, distanceFallOff: 1 });

		this.bloom.strength = post.bloom.strength;
		this.bloom.radius = post.bloom.radius;
		this.bloom.threshold = post.bloom.threshold;

		const f = this.final.uniforms;
		f.uLutIntensity.value = !this.lut ? 0 : this.lut.check ? 1 : post.lut?.look !== 'none' ? post.lut.intensity : 0; // check views (core/lut.js withCheck) are baked at full strength
		f.uToneMapping.value = TONE_MAPPINGS[post.toneMapping]?.index ?? 5;
		f.uExposure.value = exposureScale(post.exposure);
		const g = post.grade;
		f.uWhiteBalance.value.copy(whiteBalance(g.temperature, g.tint, _wb));
		f.uSaturation.value = g.saturation;
		f.uContrast.value = g.contrast;
		f.uLift.value.setScalar(g.lift);
		f.uGamma.value.setScalar(g.gamma);
		f.uGain.value.setScalar(g.gain);
		f.uVignette.value = g.vignette;
		f.uGrain.value = g.grain;
		f.uChromatic.value = g.chromatic;

		const fog = post.fog;
		const c = this.composite.uniforms;
		c.uFogDensity.value = fog.density;
		c.uFogFalloff.value = fog.falloff;
		c.uFogHeight.value = fog.height;
		c.uFogStart.value = fog.start;
		c.uFogColor.value.set(fog.color);
		c.uInscatter.value = fog.inscatter;

		const r = this.retro.uniforms;
		r.uTargetHeight.value = post.retro.height;
		r.uLevels.value = post.retro.levels;
		r.uDither.value = post.retro.dither;
	}

	/** lut: { texture: Data3DTexture, size } or null. */
	setLut(lut) {
		this.lut = lut;
		const f = this.final.uniforms;
		f.uLut.value = lut ? lut.texture : null;
		f.uLutSize.value = lut ? lut.size : 2;
		if (this.post) this.configure(this.post);
	}

	setPassthrough(on) {
		this.passthrough = on;
	}

	render(world, delta, elapsed) {
		const { renderer, timer, post } = this;
		const { scene, vfxScene, camera } = world;
		const passthrough = this.passthrough;
		timer.beginFrame();

		renderer.shadowMap.autoUpdate = false;
		const prevClearAlpha = renderer.getClearAlpha();

		// 1. Opaque + transparent scene into HDR target (its depth feeds AO, fog and the VFX layer).
		timer.begin('Scene');
		renderer.shadowMap.needsUpdate = true;
		renderer.setRenderTarget(this.sceneRT);
		renderer.render(scene, camera);

		// 2. Ambient occlusion from the scene depth: GTAO + Poisson denoise.
		const aoOn = (post.ao.enabled && !passthrough) || this.showAO;
		if (aoOn) {
			timer.begin('AO');
			this.gtao.scene = scene;
			this.gtao.camera = camera;
			this.gtao.render(renderer, null, null);
		}

		// 3. VFX layer.
		const hasVfx = !passthrough && vfxScene && vfxScene.children.length > 0;
		if (hasVfx) {
			timer.begin('VFX');
			const u = this.vfxUniforms;
			u.uCameraNear.value = camera.near;
			u.uCameraFar.value = camera.far;
			u.uOrtho.value = camera.isOrthographicCamera ? 1 : 0;
			renderer.setRenderTarget(this.vfxRT);
			renderer.setClearColor(0x000000, 0);
			renderer.clear(true, false, false);
			const autoClear = renderer.autoClear;
			renderer.autoClear = false;
			renderer.render(vfxScene, camera);
			renderer.autoClear = autoClear;
		}

		// 4. Composite (AO, height fog, VFX) into the HDR buffer.
		timer.begin('Composite');
		const c = this.composite.uniforms;
		c.tScene.value = this.sceneRT.texture;
		c.tAO.value = aoOn ? this.gtao.gtaoMap : null;
		c.uAOIntensity.value = aoOn ? post.ao.intensity : 0;
		c.uShowAO.value = this.showAO ? 1 : 0;
		c.uHasVFX.value = hasVfx ? 1 : 0;
		c.uFog.value = post.fog.enabled && !passthrough ? 1 : 0;
		if (c.uFog.value) {
			c.uProjInv.value.copy(camera.projectionMatrixInverse);
			c.uCamWorld.value.copy(camera.matrixWorld);
			c.uCamPos.value.setFromMatrixPosition(camera.matrixWorld);
			c.uFogMaxDist.value = Math.min(camera.far, 400);
			if (world.sun) {
				c.uSunDir.value.copy(world.sun.direction);
				c.uSunColor.value.copy(world.sun.color);
			} else {
				c.uSunColor.value.setRGB(0, 0, 0);
			}
		}
		this.blit(this.composite, this.hdrRT);

		// 5. Bloom adds onto the HDR buffer in place.
		if (post.bloom.enabled && !passthrough && post.bloom.strength > 0) {
			timer.begin('Bloom');
			this.bloom.render(renderer, null, this.hdrRT, delta, false);
		}

		// 6. Display transform, then optional AA and retro preview.
		const aa = passthrough ? 'none' : post.aa;
		const useAA = aa === 'fxaa' || aa === 'smaa';
		const retro = post.retro.enabled && !passthrough;
		timer.begin('Final');
		const f = this.final.uniforms;
		f.tColor.value = this.hdrRT.texture;
		f.uMode.value = passthrough ? 1 : post.falseColor ? 2 : 0;
		f.uTime.value = elapsed;
		let source = this.ldrRT;
		this.blit(this.final, useAA || retro ? this.ldrRT : null);

		if (useAA) {
			timer.begin(aa === 'smaa' ? 'SMAA' : 'FXAA');
			const target = retro ? this.ldrRT2 : null;
			if (aa === 'smaa') {
				this.smaa.renderToScreen = target === null;
				this.smaa.render(renderer, target, this.ldrRT);
			} else {
				this.fxaa.uniforms.tDiffuse.value = this.ldrRT.texture;
				this.blit(this.fxaa, target);
			}
			source = this.ldrRT2;
		}

		if (retro) {
			timer.begin('Retro');
			this.retro.uniforms.tColor.value = source.texture;
			this.blit(this.retro, null);
		}

		timer.endFrame();
		renderer.setClearColor(0x000000, prevClearAlpha);
	}

	blit(material, target) {
		this.quad.material = material;
		this.renderer.setRenderTarget(target);
		this.quad.render(this.renderer);
	}

	dispose() {
		for (const rt of [this.sceneRT, this.vfxRT, this.hdrRT, this.ldrRT, this.ldrRT2]) rt.dispose();
		this.gtao.dispose();
		this.bloom.dispose();
		this.smaa.dispose();
		for (const m of [this.composite, this.final, this.retro, this.fxaa]) m.dispose();
		this.quad.dispose();
	}
}
