// WebGPU half of the baked directional shadow (env/bakedShadow.js), mirrors ../webgl/bakedShadow.js. A ShadowNode
// subclass set as the light's shadowNode: when the light moved it renders the static casters once into a second target
// (the moving ones hidden), then every frame renders the live map with the static meshes hidden and the cover quad
// shown; the quad's depthNode loads the baked depth texel for texel. pcssFilter() is the TSL twin of labPcssShadow()
// (shaders/chunks/pcss.glsl), this node's filter on the WebGPU device (the renderer's WebGL2 fallback cannot load texels
// of a comparison depth texture and keeps three's filter; VSM keeps three's too).
import * as THREE from 'three/webgpu';
import { Fn, Loop, uniform, float, vec2, ivec2, textureLoad, reference, renderGroup, dFdx, dFdy, abs, clamp, floor, fract, dot, sqrt, cos, sin, select, step, max, mix, screenCoordinate } from 'three/tsl';
import { PCSS_SEARCH, PCSS_TAPS, PCSS_SEARCH_SCALE, PCSS_MAX_TEXELS, pcssScale, coverQuad, fitCoverQuad, castersIn, movingCasters, withHidden, bakeKey } from '../../env/bakedShadow.js';

/** ShadowNode filter (TSL twin of labPcssShadow): `scale` = penumbra texels per unit of shadow depth. */
export const pcssFilter = (scale) =>
	Fn(({ depthTexture, shadowCoord, shadow }) => {
		const size = reference('mapSize', 'vec2', shadow).setGroup(renderGroup);
		const coord = shadowCoord.toVar();
		// Depth slope of the receiver plane per unit of shadow uv.
		const ddx = dFdx(coord);
		const ddy = dFdy(coord);
		const det = ddx.x.mul(ddy.y).sub(ddx.y.mul(ddy.x));
		const plane = vec2(ddy.y.mul(ddx.z).sub(ddx.y.mul(ddy.z)), ddx.x.mul(ddy.z).sub(ddy.x.mul(ddx.z)));
		const slope = clamp(select(abs(det).greaterThan(1e-12), plane.div(det), vec2(0.0)), -4.0, 4.0).toVar();
		const texel = vec2(1.0).div(size);
		const spin = fract(fract(dot(floor(coord.xy.mul(size)), vec2(0.06711056, 0.00583715))).mul(52.9829189)).mul(6.2831853);
		const start = vec2(cos(spin), sin(spin)).toVar();
		const golden = vec2(-0.73736887, 0.67549029); // cos, sin of the golden angle: one spiral step
		const search = clamp(scale.mul(PCSS_SEARCH_SCALE), 1.0, PCSS_MAX_TEXELS).toVar();
		const depthAt = (uv) => textureLoad(depthTexture, ivec2(clamp(floor(uv.mul(size)), vec2(0.0), size.sub(1.0))));
		const turn = (dir) => dir.assign(vec2(dir.x.mul(golden.x).sub(dir.y.mul(golden.y)), dir.x.mul(golden.y).add(dir.y.mul(golden.x))));
		const blockers = float(0).toVar();
		const count = float(0).toVar();
		const dir = vec2(start).toVar();
		Loop(PCSS_SEARCH, ({ i }) => {
			const o = dir.mul(sqrt(float(i).add(0.5).div(PCSS_SEARCH))).mul(search).mul(texel);
			const depth = depthAt(coord.xy.add(o));
			const blocked = step(depth, coord.z.add(dot(slope, o)).sub(1e-7));
			blockers.addAssign(depth.mul(blocked));
			count.addAssign(blocked);
			turn(dir);
		});
		const radius = clamp(coord.z.sub(blockers.div(max(count, 1.0))).mul(scale), 1.0, search).toVar();
		const lit = float(0).toVar();
		dir.assign(start);
		Loop(PCSS_TAPS, ({ i }) => {
			const o = dir.mul(sqrt(float(i).add(0.5).div(PCSS_TAPS))).mul(radius).mul(texel);
			lit.addAssign(step(coord.z.add(dot(slope, o)), depthAt(coord.xy.add(o))));
			turn(dir);
		});
		return select(count.greaterThan(0.5), lit.div(PCSS_TAPS), float(1.0));
	});

class BakedShadowNode extends THREE.ShadowNode {
	constructor(light, bake, pcss) {
		super(light);
		this.labBake = bake;
		this.labPcss = pcss;
	}

	getShadowFilterFn(type) {
		return this.labPcss && type !== THREE.VSMShadowMap ? this.labPcss : super.getShadowFilterFn(type);
	}

	updateShadow(frame) {
		const b = this.labBake;
		const baked = b.usable(frame.renderer);
		if (baked && b.stale()) b.render(this, () => super.updateShadow(frame));
		if (!baked) b.baked = false;
		// The quad is drawn either way: ShadowNode scales the shadow by the alpha of its colour target, which only casters
		// write, so without it a soft penumbra would stop where the casters' silhouettes end. Unbaked, it writes the far plane.
		b.copy.value = baked ? 1 : 0;
		this.shadow.updateMatrices(this.light);
		fitCoverQuad(b.quad, this.shadow.camera);
		b.quad.visible = true;
		withHidden(baked ? b.statics : [], () => super.updateShadow(frame));
		b.quad.visible = false;
	}

	dispose() {
		super.dispose();
		this._node = null; // set up again (with a new map) if the light casts shadows again
	}
}

/** Mirrors createBakedShadowGL() in ../webgl/bakedShadow.js (same options and methods). */
export function createBakedShadowGPU(backend, light, { scene, name = light.name }) {
	const size = light.shadow.mapSize;
	const target = new THREE.RenderTarget(size.x, size.y);
	target.texture.name = `${name} · baked shadow (static casters)`;
	target.depthTexture = new THREE.DepthTexture(size.x, size.y);
	target.depthTexture.name = `${name} · baked shadow depth`;
	const copy = uniform(0); // 1 = the baked depth, 0 = the far plane
	const material = new THREE.NodeMaterial();
	material.name = `${name} · baked shadow copy`;
	material.side = THREE.DoubleSide;
	material.depthNode = mix(float(1.0), textureLoad(target.depthTexture, ivec2(screenCoordinate.xy)), copy);
	const quad = coverQuad(`${name} · baked shadow`, material);
	quad.visible = false; // shown only while the light's live map renders
	scene.add(quad);
	const scale = uniform(0);
	const state = { enabled: true, softness: 0, key: '', ms: 0 };

	const bake = {
		quad,
		copy,
		statics: new Set(),
		baked: false,
		usable() {
			return state.enabled && this.statics.size > 0;
		},
		stale() {
			return !this.baked || bakeKey(light) !== state.key;
		},
		/** Static casters into `target`: the node's map is swapped for one render. */
		render(node, renderShadow) {
			const t0 = performance.now();
			const live = node.shadowMap;
			node.shadowMap = target;
			withHidden(movingCasters(scene, this.statics, quad), renderShadow);
			node.shadowMap = live;
			state.key = bakeKey(light);
			state.ms = performance.now() - t0;
			this.baked = true;
		},
	};
	light.shadow.shadowNode = new BakedShadowNode(light, bake, backend.isWebGPU ? pcssFilter(scale) : null);

	return {
		quad,
		setStatics(roots) {
			bake.statics = castersIn(roots);
			bake.baked = false;
		},
		setEnabled(on) {
			state.enabled = on;
		},
		setSoftness(degrees) {
			state.softness = degrees;
		},
		update() {
			scale.value = state.softness > 0 ? pcssScale(light.shadow, state.softness) : 0;
		},
		info() {
			return { baked: bake.baked, ms: state.ms, statics: bake.statics.size, softness: state.softness, scale: scale.value };
		},
		dispose() {
			scene.remove(quad);
			quad.geometry.dispose();
			material.dispose();
			target.dispose();
			bake.statics.clear();
		},
	};
}
