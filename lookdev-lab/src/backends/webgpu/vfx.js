// TSL side of the VFX lab: the shared particle material (mirrors shaders/vfx/particle.*.glsl) and the
// WebGPU-only compute particle field (simulation in a compute shader, nothing read back to the CPU).
// The `#region` markers are read by the VFX panel to show the source.
import * as THREE from 'three/webgpu';
import {
	Fn, If, Discard, attribute, varying, uniform, instancedArray, instanceIndex, hash, vec2, vec3, vec4, float, uv, cos, sin, exp, abs,
	length, normalize, cross, clamp, smoothstep, select, max, sqrt, mix, positionGeometry, cameraViewMatrix, cameraProjectionMatrix,
	cameraPosition, positionView, uniformArray, textureLoad, ivec2, mod, fract, floor, step, distance, pow, atan, min, dot,
} from 'three/tsl';
import { labNoise3, labFbm3 } from './tsl/noise.js';
import { labTime, premultipliedAdditive } from './effects.js';

export function createTSLVfx(backend) {
	const { depthFade, output, shared } = { ...backend.effects.vfx, shared: backend.effects.shared };
	let particleMaterial = null;

	// #region particle
	function buildParticleMaterial() {
		const m = new THREE.MeshBasicNodeMaterial({ name: 'Particles (TSL)', side: THREE.DoubleSide, ...premultipliedAdditive });
		const iPosition = attribute('iPosition', 'vec3');
		const iVelocity = attribute('iVelocity', 'vec3');
		const iParams = attribute('iParams', 'vec4'); // size, rotation, stretch, seed
		const iStyle = attribute('iStyle', 'vec4'); // shape, align, additive, softness

		// Vertex: billboard (camera axes = view matrix rows), ground-aligned, or stretched along velocity.
		const size = iParams.x;
		const c = cos(iParams.y);
		const s = sin(iParams.y);
		const corner = vec2(c.mul(positionGeometry.x).sub(s.mul(positionGeometry.y)), s.mul(positionGeometry.x).add(c.mul(positionGeometry.y)));
		const right = vec3(cameraViewMatrix.element(0).x, cameraViewMatrix.element(1).x, cameraViewMatrix.element(2).x);
		const up = vec3(cameraViewMatrix.element(0).y, cameraViewMatrix.element(1).y, cameraViewMatrix.element(2).y);
		const billboard = iPosition.add(right.mul(corner.x).add(up.mul(corner.y)).mul(size));
		const ground = iPosition.add(vec3(corner.x, 0.0, corner.y).mul(size));
		const speed = length(iVelocity);
		const axis = select(speed.greaterThan(1e-4), iVelocity.div(max(speed, 1e-4)), vec3(0.0, 1.0, 0.0));
		const side = normalize(cross(axis, normalize(cameraPosition.sub(iPosition))).add(1e-5));
		const stretched = iPosition.add(axis.mul(positionGeometry.y.mul(size.add(speed.mul(iParams.z))))).add(side.mul(positionGeometry.x.mul(size)));
		const world = select(iStyle.y.lessThan(0.5), billboard, select(iStyle.y.lessThan(1.5), ground, stretched));
		const mvPosition = cameraViewMatrix.mul(vec4(world, 1.0));
		const viewZ = varying(mvPosition.z, 'vParticleViewZ');
		m.vertexNode = cameraProjectionMatrix.mul(mvPosition);

		// Fragment: 0 soft · 1 smoke · 2 spark · 3 ring · 4 flare · 5 splat · 6 shard.
		m.fragmentNode = Fn(() => {
			const style = vec4(iStyle).toVar('pStyle');
			const color = attribute('iColor', 'vec4').toVar('pColor');
			const seed = float(iParams.w).toVar('pSeed');
			const fade = depthFade(viewZ, style.w).toVar('pFade');
			If(fade.lessThanEqual(0.0), () => {
				Discard();
			});
			const p = uv().mul(2.0).sub(1.0).toVar('pUv');
			const r = length(p).toVar('pR');
			const mask = float(0.0).toVar('pMask');
			If(style.x.lessThan(0.5), () => {
				mask.assign(exp(r.mul(r).mul(-4.5)).mul(smoothstep(0.85, 1.0, r).oneMinus()));
			}).ElseIf(style.x.lessThan(1.5), () => {
				const n = labFbm3(vec3(p.mul(1.7).add(seed.mul(11.0)), seed.mul(3.0).add(labTime.mul(0.12)))).mul(0.5).add(0.5);
				mask.assign(clamp(n.mul(1.6).sub(0.4).mul(smoothstep(0.2, 1.0, r).oneMinus()), 0.0, 1.0));
			}).ElseIf(style.x.lessThan(2.5), () => {
				mask.assign(exp(p.x.mul(p.x).mul(-10.0)).mul(smoothstep(0.5, 1.0, abs(p.y)).oneMinus()));
			}).ElseIf(style.x.lessThan(3.5), () => {
				const d = r.sub(0.8).div(0.1);
				mask.assign(exp(d.mul(d).negate()).mul(smoothstep(0.96, 1.0, r).oneMinus()));
			}).ElseIf(style.x.lessThan(4.5), () => {
				mask.assign(exp(r.mul(r).mul(-10.0)).add(exp(abs(p.x.mul(p.y)).mul(-80.0)).mul(0.4).mul(smoothstep(0.0, 1.0, r).oneMinus())));
			}).ElseIf(style.x.lessThan(5.5), () => {
				const n = labNoise3(vec3(p.mul(2.2), seed.mul(7.0))).mul(0.5).add(labNoise3(vec3(p.mul(6.0), seed.mul(3.0))).mul(0.2));
				const edge = n.mul(0.3).add(0.6);
				mask.assign(smoothstep(edge.sub(0.1), edge, r).oneMinus());
			}).Else(() => {
				mask.assign(smoothstep(0.8, 1.0, abs(p.x).mul(3.0).add(abs(p.y))).oneMinus());
			});
			const alpha = color.a.mul(mask).mul(fade).toVar('pAlpha');
			If(alpha.lessThan(0.002), () => {
				Discard();
			});
			return output(color.rgb.mul(alpha), alpha.mul(style.z.oneMinus()));
		})();
		return m;
	}
	// #endregion

	// #region atmosphere
	/**
	 * One atmosphere layer (env/atmosphere.js), mirroring shaders/vfx/atmosphere.*.glsl: every instance is a seed, its place,
	 * motion, tumble, blink and light are computed here from time. values = { key: initial } → { material, uniforms } with
	 * uniforms[key].value settable; arrays of Vector4 become uniform arrays read from those same objects every frame.
	 */
	function atmosphereMaterial(values) {
		const TAU = Math.PI * 2;
		const u = {};
		for (const [key, value] of Object.entries(values)) {
			if (key !== 'ground') u[key] = Array.isArray(value) ? uniformArray(value, 'vec4') : uniform(value);
		}
		const m = new THREE.MeshBasicNodeMaterial({ name: 'Atmosphere (TSL)', side: THREE.DoubleSide, ...premultipliedAdditive });
		const s = attribute('aSeed', 'vec4');
		const t = labTime;
		const rate = s.w.mul(0.7).add(0.65);
		const ph = s.w.mul(TAU);

		// Ground height (m): bilinear from four texel loads (no sampler binding).
		const n = u.groundRect.w;
		const groundAt = (xz) => {
			const g = clamp(xz.sub(u.groundRect.xy).div(u.groundRect.z).mul(n).sub(0.5), vec2(0.0), vec2(n.sub(1.001)));
			const i = ivec2(floor(g));
			const f = g.sub(floor(g));
			const a = textureLoad(values.ground, i).r;
			const b = textureLoad(values.ground, i.add(ivec2(1, 0))).r;
			const c = textureLoad(values.ground, i.add(ivec2(0, 1))).r;
			const d = textureLoad(values.ground, i.add(ivec2(1, 1))).r;
			return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
		};

		// Moths: erratic loops round a light anchor, a little below the flame, with a fast jitter.
		const k = clamp(floor(s.x.mul(u.anchorCount)), 0.0, max(u.anchorCount.sub(1.0), 0.0)).toInt();
		const anchor = u.anchors.element(k);
		const q = s.z.mul(TAU);
		const loop = vec3(
			sin(t.mul(s.w.mul(1.9).add(1.7)).add(q)),
			sin(t.mul(s.y.mul(1.3).add(2.3)).add(q.mul(2.0))).mul(0.55).sub(0.25),
			cos(t.mul(s.z.mul(2.1).add(1.3)).add(q.mul(3.0))),
		).mul(anchor.w.mul(s.y.mul(0.65).add(0.35)));
		const jitter = vec3(sin(t.mul(13.0).add(q.mul(7.0))), sin(t.mul(11.0).add(q.mul(5.0))), cos(t.mul(12.0).add(q.mul(3.0)))).mul(0.03);
		const anchored = anchor.xyz.add(loop).add(jitter);

		// The box field: drift, fall, wander, wrapped round the focus on x / z, a band above the ground on y.
		const w = u.wander.y.mul(t);
		const gustPhase = w.mul(0.7).add(ph.mul(2.0));
		const gust = pow(cos(gustPhase).mul(0.5).add(0.5), 4.0);
		const surge = u.skim.mul(0.8).mul(sin(gustPhase)).div(max(u.wander.y.mul(0.7), 1e-3));
		const wander = vec3(
			sin(w.mul(1.1).add(ph.mul(3.0))).add(sin(w.mul(2.3).add(ph.mul(7.0))).mul(0.5)),
			sin(w.mul(0.9).add(ph.mul(5.0))).mul(0.6),
			cos(w.mul(0.95).add(ph.mul(4.0))).add(cos(w.mul(2.1).add(ph.mul(9.0))).mul(0.5)),
		).mul(u.wander.x);
		const p = s.xyz.mul(u.box).add(u.velocity.mul(rate).mul(t.add(surge))).sub(vec3(0.0, u.fall.mul(rate).mul(t), 0.0)).add(wander);
		const origin = u.focus.xz.sub(u.box.xz.mul(0.5));
		const lx = mod(p.x.sub(origin.x), u.box.x);
		const lz = mod(p.z.sub(origin.y), u.box.z);
		const ly = mix(mod(p.y, u.box.y), u.box.y.mul(gust).mul(s.y.mul(0.7).add(0.3)), u.skim);
		const bx = origin.x.add(lx);
		const bz = origin.y.add(lz);
		const boxed = vec3(bx, groundAt(vec2(bx, bz)).add(u.base).add(ly), bz);
		const e = vec3(lx, ly, lz).div(u.box);
		const edgeBox = smoothstep(0.0, 0.12, e.x).mul(smoothstep(0.88, 1.0, e.x).oneMinus()).mul(smoothstep(0.0, 0.12, e.z)).mul(smoothstep(0.88, 1.0, e.z).oneMinus())
			.mul(mix(smoothstep(0.0, 0.1, e.y).mul(smoothstep(0.8, 1.0, e.y).oneMinus()), 1.0, u.skim));
		const anchoredOn = u.anchorCount.greaterThan(0.5);
		const wp = select(anchoredOn, anchored, boxed).toVar('atmoWorld');
		const edge = select(anchoredOn, float(1.0), edgeBox);

		// Zones: inside any circle (soft rim), nowhere else.
		let inZones = float(0.0);
		for (let i = 0; i < 6; i++) {
			const z = u.zones.element(i);
			inZones = max(inZones, step(0.5, z.w).mul(smoothstep(z.z.mul(0.6), max(z.z, 1e-3), distance(wp.xz, z.xy)).oneMinus()));
		}
		const zone = select(u.zoned.greaterThan(0.5), inZones, float(1.0));

		// Flakes and leaves tumble in 3D about their own axis; the rest — and the glowing ones (embers) — face the camera.
		const glows = step(fract(s.x.mul(91.7).add(s.y.mul(13.3))), u.glow.w.sub(1e-4));
		const size = mix(u.size.x, u.size.y, fract(s.y.mul(7.31).add(s.z.mul(3.17))));
		const rotate = (v, axis, angle) => v.mul(cos(angle)).add(cross(axis, v).mul(sin(angle))).add(axis.mul(dot(axis, v)).mul(cos(angle).oneMinus()));
		const axis = normalize(s.zxy.sub(0.5).add(vec3(0.0, 0.001, 0.0)));
		const angle = s.x.mul(TAU).add(t.mul(u.tumble).mul(s.w.add(0.5)));
		const tumbled = rotate(vec3(positionGeometry.xy, 0.0), axis, angle).mul(size);
		const spin = s.x.mul(TAU).add(t.mul(u.tumble).mul(s.w.sub(0.5)));
		const cs = cos(spin);
		const sn = sin(spin);
		const beat = mix(1.0, abs(sin(t.mul(31.0).add(s.w.mul(50.0)))).mul(0.75).add(0.25), step(4.5, u.shape));
		const qx = cs.mul(positionGeometry.x).sub(sn.mul(positionGeometry.y)).mul(beat);
		const qy = sn.mul(positionGeometry.x).add(cs.mul(positionGeometry.y));
		const right = vec3(cameraViewMatrix.element(0).x, cameraViewMatrix.element(1).x, cameraViewMatrix.element(2).x);
		const up = vec3(cameraViewMatrix.element(0).y, cameraViewMatrix.element(1).y, cameraViewMatrix.element(2).y);
		const billboard = right.mul(qx).add(up.mul(qy)).mul(size);
		const tumbles = u.shape.greaterThan(0.5).and(u.shape.lessThan(2.5)).and(glows.lessThan(0.5));
		const corner = select(tumbles, tumbled, billboard);
		const glint = mix(1.0, pow(sin(t.mul(s.y.mul(1.6).add(0.6)).add(s.z.mul(TAU))).mul(0.5).add(0.5), 2.0).mul(0.75).add(0.25), step(u.shape, 0.5)); // motes glint as they turn
		const facing = select(tumbles, abs(rotate(vec3(0.0, 0.0, 1.0), axis, angle).y).mul(0.65).add(0.35), glint);

		// Light: the scene's nearest point / spot lights (three's distance falloff and range window) + ambient.
		let light = vec3(u.ambient);
		for (let i = 0; i < 8; i++) {
			const L = u.lights.element(i);
			const C = u.lightColors.element(i);
			const d = L.xyz.sub(wp);
			const d2 = max(dot(d, d), 0.09); // no closer than 0.3 m: moths at the flame stay a moth
			const x = d2.div(max(L.w.mul(L.w), 1e-4));
			const win = clamp(x.mul(x).oneMinus(), 0.0, 1.0);
			light = light.add(C.xyz.mul(win.mul(win).div(max(pow(d2, C.w.mul(0.5)), 0.01))));
		}
		const b = fract(t.div(max(u.blink.x, 1e-3)).add(s.w));
		const blink = select(u.blink.x.greaterThan(0.0), smoothstep(0.0, 0.08, b).mul(smoothstep(u.blink.y.mul(0.7), u.blink.y, b).oneMinus()), float(1.0));
		const albedo = mix(u.colorA, u.colorB, fract(s.z.mul(5.13).add(s.x.mul(1.7))));
		const rgb = albedo.mul(light).mul(u.lit.mul(facing).mul(0.31831)).add(u.glow.xyz.mul(glows.mul(blink)));
		const mvPosition = cameraViewMatrix.mul(vec4(wp.add(corner), 1.0));
		// Gone within 1.5–3.5 m of a perspective camera; the iso camera stands 60 m back.
		const alpha = u.alpha.mul(edge).mul(zone).mul(mix(1.0, blink, glows)).mul(smoothstep(1.5, 3.5, mvPosition.z.negate()));

		const vColor = varying(vec4(rgb, alpha), 'vAtmoColor');
		const vStyle = varying(vec3(u.shape, mix(u.additive, 1.0, glows), s.w), 'vAtmoStyle');
		const viewZ = varying(mvPosition.z, 'vAtmoViewZ');
		m.vertexNode = select(alpha.lessThan(0.002), vec4(0.0, 0.0, -2.0, 1.0), cameraProjectionMatrix.mul(mvPosition));

		// Fragment: 0 mote · 1 flake · 2 leaf · 3 wisp · 4 glow · 5 moth.
		m.fragmentNode = Fn(() => {
			const style = vec3(vStyle).toVar('aStyle');
			const color = vec4(vColor).toVar('aColor');
			const fade = depthFade(viewZ, max(u.softness, 1e-3)).toVar('aFade');
			If(fade.lessThanEqual(0.0), () => {
				Discard();
			});
			const pp = uv().mul(2.0).sub(1.0).toVar('aP');
			const r = length(pp).toVar('aR');
			const seed = style.z;
			const mask = float(0.0).toVar('aMask');
			If(style.x.lessThan(0.5), () => {
				mask.assign(exp(r.mul(r).mul(-6.0)).mul(smoothstep(0.75, 1.0, r).oneMinus()));
			}).ElseIf(style.x.lessThan(1.5), () => {
				const a = atan(pp.y, pp.x);
				const rim = sin(a.mul(3.0).add(seed.mul(40.0))).mul(0.2).add(sin(a.mul(7.0).add(seed.mul(90.0))).mul(0.1)).add(0.62);
				mask.assign(smoothstep(rim.sub(0.15), rim, r).oneMinus());
			}).ElseIf(style.x.lessThan(2.5), () => {
				const width = pp.y.mul(pp.y).oneMinus().mul(0.5);
				mask.assign(smoothstep(width.sub(0.1), width, abs(pp.x)).oneMinus().mul(smoothstep(0.03, 0.09, abs(pp.x)).mul(0.25).add(0.75)));
			}).ElseIf(style.x.lessThan(3.5), () => {
				const noise = labNoise3(vec3(pp.mul(1.4).add(seed.mul(17.0)), labTime.mul(0.05).add(seed.mul(5.0)))).mul(0.6).add(labNoise3(vec3(pp.mul(3.1).sub(seed.mul(9.0)), labTime.mul(0.08))).mul(0.25));
				mask.assign(clamp(smoothstep(0.1, 1.0, r).oneMinus().mul(noise.add(0.55)), 0.0, 1.0));
			}).ElseIf(style.x.lessThan(4.5), () => {
				mask.assign(exp(r.mul(r).mul(-28.0)).add(exp(r.mul(r).mul(-5.0)).mul(0.35).mul(smoothstep(0.7, 1.0, r).oneMinus())));
			}).Else(() => {
				const qq = vec2(abs(pp.x), pp.y);
				const wing = smoothstep(0.75, 0.95, length(qq.sub(vec2(0.45, 0.1)).mul(vec2(1.4, 1.8)))).oneMinus();
				const body = smoothstep(0.08, 0.14, qq.x).oneMinus().mul(smoothstep(0.5, 0.6, abs(pp.y)).oneMinus());
				mask.assign(max(wing, body));
			});
			const alphaOut = color.a.mul(mask).mul(fade).toVar('aAlpha');
			If(alphaOut.lessThan(0.002), () => {
				Discard();
			});
			return output(color.rgb.mul(alphaOut), alphaOut.mul(style.y.oneMinus()));
		})();
		return { material: m, uniforms: u };
	}
	// #endregion

	// #region compute
	/**
	 * Soul-storm particle field simulated entirely on the GPU: init + update compute shaders over storage
	 * buffers, drawn as one instanced sprite batch (the positions buffer is read as an instanced attribute).
	 */
	function createComputeField({ count = 50000 } = {}) {
		const renderer = backend.renderer;
		const positions = instancedArray(count, 'vec4'); // xyz + life (0..1)
		const velocities = instancedArray(count, 'vec4'); // xyz + seed
		const u = {
			center: uniform(new THREE.Vector3()),
			radius: uniform(1.6),
			height: uniform(2.6),
			delta: uniform(1 / 60),
			swirl: uniform(1),
			size: uniform(0.035),
			intensity: uniform(2.5),
			colorA: uniform(new THREE.Color('#7fd4ff')),
			colorB: uniform(new THREE.Color('#a046ff')),
		};

		const spawn = (index, life) => {
			const a = hash(index).mul(Math.PI * 2);
			const rad = sqrt(hash(index.add(17))).mul(u.radius);
			return vec4(u.center.x.add(cos(a).mul(rad)), u.center.y.add(hash(index.add(31)).mul(0.3)), u.center.z.add(sin(a).mul(rad)), life);
		};

		const init = Fn(() => {
			positions.element(instanceIndex).assign(spawn(instanceIndex, hash(instanceIndex.add(5))));
			velocities.element(instanceIndex).assign(vec4(0.0, 0.0, 0.0, hash(instanceIndex.add(3))));
		})().compute(count);

		const update = Fn(() => {
			const p = positions.element(instanceIndex);
			const v = velocities.element(instanceIndex);
			const pos = p.xyz.toVar();
			const vel = v.xyz.toVar();
			const seed = v.w;
			const rel = pos.sub(u.center).toVar();
			const tangent = normalize(vec3(rel.z.negate(), 0.0, rel.x).add(vec3(1e-4, 0.0, 0.0)));
			// Spring towards the axis + tangential push = a vortex column (orbit radius ≈ swirl speed / √spring).
			const pull = vec3(rel.x, 0.0, rel.z).mul(-1.6);
			const lift = vec3(0.0, seed.mul(0.9).add(0.5), 0.0);
			const wobble = vec3(sin(pos.y.mul(3.0).add(labTime.mul(2.0)).add(seed.mul(6.0))), cos(pos.x.mul(2.7).add(labTime.mul(1.7))), sin(pos.z.mul(3.1).sub(labTime.mul(2.3)))).mul(0.8);
			// Drag as exp(-k·dt) so the motion does not depend on the frame rate.
			vel.assign(vel.add(tangent.mul(u.swirl.mul(2.2)).add(pull).add(lift).add(wobble).mul(u.delta)).mul(exp(u.delta.mul(-1.2))));
			pos.addAssign(vel.mul(u.delta));
			const life = p.w.add(u.delta.mul(seed.mul(0.25).add(0.2))).toVar();
			const escaped = length(vec2(rel.x, rel.z)).greaterThan(u.radius.mul(2.5));
			If(life.greaterThan(1.0).or(pos.y.sub(u.center.y).greaterThan(u.height)).or(escaped), () => {
				const fresh = spawn(instanceIndex.add(labTime.mul(1000.0).toUint()), 0.0);
				pos.assign(fresh.xyz);
				vel.assign(vec3(0.0));
				life.assign(0.0);
			});
			p.assign(vec4(pos, life));
			v.assign(vec4(vel, seed));
		})().compute(count);

		const material = new THREE.SpriteNodeMaterial({ name: 'Compute field (TSL)', ...premultipliedAdditive });
		const particle = positions.toAttribute();
		material.positionNode = particle.xyz;
		const lifeFade = smoothstep(0.0, 0.1, particle.w).mul(smoothstep(0.75, 1.0, particle.w).oneMinus());
		material.scaleNode = u.size.mul(lifeFade.mul(0.6).add(0.4));
		// fragmentNode, not colorNode: the colorNode path discards alpha <= 0 on transparent materials
		// (three r180), and purely additive output is exactly alpha 0.
		material.fragmentNode = Fn(() => {
			const fade = depthFade(positionView.z, float(0.05)).toVar();
			If(fade.lessThanEqual(0.0), () => {
				Discard();
			});
			const d = length(uv().sub(0.5)).mul(2.0);
			const glow = exp(d.mul(d).mul(-5.0)).mul(lifeFade).mul(fade);
			return output(mix(u.colorA, u.colorB, particle.w).mul(u.intensity).mul(glow), 0.0);
		})();
		const mesh = new THREE.Sprite(material);
		mesh.count = count;
		mesh.frustumCulled = false;
		mesh.name = `Compute particles × ${count.toLocaleString()}`;
		mesh.userData.labNoView = true;

		let initialized = false;
		return {
			count,
			mesh,
			uniforms: u,
			debugPositions: positions,
			update(delta) {
				if (!initialized) {
					renderer.compute(init);
					initialized = true;
				}
				u.delta.value = Math.min(delta, 1 / 20);
				renderer.compute(update);
			},
			dispose() {
				material.dispose();
				mesh.removeFromParent();
			},
		};
	}
	// #endregion

	return {
		language: 'TSL',
		particleMaterial() {
			return (particleMaterial ??= buildParticleMaterial());
		},
		atmosphereMaterial,
		createComputeField: backend.isWebGPU ? createComputeField : null,
		setOverdraw(on) {
			shared.overdraw.value = on ? 1 : 0;
		},
	};
}
