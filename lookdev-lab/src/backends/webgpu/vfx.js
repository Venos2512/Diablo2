// TSL side of the VFX lab: the shared particle material (mirrors shaders/vfx/particle.*.glsl) and the
// WebGPU-only compute particle field (simulation in a compute shader, nothing read back to the CPU).
// The `#region` markers are read by the VFX panel to show the source.
import * as THREE from 'three/webgpu';
import {
	Fn, If, Discard, attribute, varying, uniform, instancedArray, instanceIndex, hash, vec2, vec3, vec4, float, uv, cos, sin, exp, abs,
	length, normalize, cross, clamp, smoothstep, select, max, sqrt, mix, positionGeometry, cameraViewMatrix, cameraProjectionMatrix,
	cameraPosition, positionView,
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
		createComputeField: backend.isWebGPU ? createComputeField : null,
		setOverdraw(on) {
			shared.overdraw.value = on ? 1 : 0;
		},
	};
}
