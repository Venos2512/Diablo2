// TSL implementations of the effects in src/effects/registry.js (mirrors ../webgl/effects.js).
// Surface effects convert a built-in material to its node-material twin and contribute to node slots
// through "node patches" (the TSL counterpart of the GLSL onBeforeCompile patches): every slot is
// rebuilt by folding the patches in order, so effects compose (wind + dissolve + status ...).
// VFX effects are node materials rendered in the VFX pass.
// The `#region` markers are read by the Shaders panel to show each effect's source.
import * as THREE from 'three/webgpu';
import {
	Fn, If, Discard, uniform, attribute, varying, vec2, vec3, vec4, float, uv, sin, cos, abs, mix, clamp, pow, dot, normalize,
	length, floor, exp, step, atan, min, max, fract, smoothstep, select, screenUV, screenCoordinate, positionLocal, positionGeometry, positionWorld,
	positionView, positionViewDirection, normalView, normalWorldGeometry, modelWorldMatrix, modelWorldMatrixInverse, cameraPosition,
	cameraViewMatrix, cameraProjectionMatrix, cameraNear, cameraFar, perspectiveDepthToViewZ, orthographicDepthToViewZ,
	materialColor, materialEmissive, materialRoughness, materialMetalness, materialNormal, materialAO, texture, cross, dFdx, dFdy, output, diffuseColor,
	sqrt, normalWorld, roughness as roughnessProperty,
} from 'three/tsl';
import { EFFECTS, defaultParams } from '../../effects/registry.js';
import { labNoise3, labFbm3, labHash12, labHash13, labHash22 } from './tsl/noise.js';
import { labLuma } from './tsl/common.js';
import { createBakedShadowGPU } from './bakedShadow.js';

const DEG = Math.PI / 180;

/** Shared animation clock (seconds) — driven from the app clock like the GLSL `labTime`. */
export const labTime = uniform(0);

function makeUniforms(name, overrides = {}) {
	const values = { ...defaultParams(name), ...overrides };
	const uniforms = {};
	for (const [key, value] of Object.entries(values)) uniforms[key] = uniform(value);
	return uniforms;
}

// -------------------------------------------------------------------------------------------------
// Node-material twins of built-in materials

const SKIP = new Set(['uuid', 'type', 'version', '_listeners', 'id', 'userData']);
const twinOf = new WeakMap(); // built-in material -> node twin
const sourceOf = new WeakMap(); // node twin -> built-in material

function copyProps(from, to) {
	for (const key in from) {
		if (SKIP.has(key) || typeof from[key] === 'function' || key.startsWith('is')) continue;
		to[key] = from[key];
	}
}

/** Node-material twin of a built-in material (keeps every map and setting; one twin per source). */
export function toNodeMaterial(renderer, material) {
	if (material.isNodeMaterial) return material;
	let twin = twinOf.get(material);
	if (!twin) {
		const NodeClass = renderer.library.getMaterialNodeClass(material.type) || THREE.MeshStandardNodeMaterial;
		twin = new NodeClass();
		twinOf.set(material, twin);
		sourceOf.set(twin, material);
	}
	copyProps(material, twin);
	twin.name = material.name;
	twin.userData = { ...material.userData };
	twin.needsUpdate = true;
	return twin;
}

/** Copy edits made on the twin back to its source and return the source (or null for authored node materials). */
function restoreSource(twin) {
	const source = sourceOf.get(twin);
	if (!source) return null;
	for (const key in source) {
		if (SKIP.has(key) || typeof source[key] === 'function' || key.startsWith('is') || !(key in twin)) continue;
		source[key] = twin[key];
	}
	source.needsUpdate = true;
	return source;
}

// -------------------------------------------------------------------------------------------------
// Node patches: { id, order, position?(n), color?(n), roughness?(n), metalness?(n), emissive?(n),
// normal?(n), ao?(n), output?(o), mask?() -> bool node, shadow?: true }. Each slot function receives the node built so far.
// `ao` scales the indirect light (the material's aoNode, like an aoMap). `output` is the final lit colour (vec4, the
// material's outputNode; the default reads the lit result).

const SLOTS = [
	['position', 'positionNode', positionLocal],
	['color', 'colorNode', materialColor],
	['roughness', 'roughnessNode', materialRoughness],
	['metalness', 'metalnessNode', materialMetalness],
	['emissive', 'emissiveNode', materialEmissive],
	['normal', 'normalNode', materialNormal],
	['ao', 'aoNode', (material) => (material.aoMap ? materialAO : float(1))],
	['output', 'outputNode', output],
];

const nodePatches = new WeakMap(); // node material -> [patch]
const authored = new WeakMap(); // node material -> its own slot nodes before any patch
const shadowMasks = new WeakMap(); // node material -> mask node used by the shadow pass

function rebuildSlots(material) {
	const list = nodePatches.get(material) || [];
	const base = authored.get(material);
	for (const [slot, prop, fallback] of SLOTS) {
		const users = list.filter((p) => p[slot]);
		const start = base[prop] || (typeof fallback === 'function' ? fallback(material) : fallback);
		material[prop] = users.length ? users.reduce((node, p) => p[slot](node), start) : base[prop];
	}
	const masks = list.filter((p) => p.mask);
	const combine = (items) => items.map((p) => p.mask()).reduce((a, b) => a.and(b));
	material.maskNode = masks.length ? (base.maskNode ? base.maskNode.and(combine(masks)) : combine(masks)) : base.maskNode;
	const shadow = masks.filter((p) => p.shadow);
	if (shadow.length) shadowMasks.set(material, combine(shadow));
	else shadowMasks.delete(material);
	material.needsUpdate = true;
}

export function addNodePatch(material, patch) {
	if (!authored.has(material)) {
		const base = { maskNode: material.maskNode };
		for (const [, prop] of SLOTS) base[prop] = material[prop];
		authored.set(material, base);
	}
	const list = [...(nodePatches.get(material) || [])].filter((p) => p.id !== patch.id);
	list.push(patch);
	list.sort((a, b) => (a.order || 0) - (b.order || 0));
	nodePatches.set(material, list);
	rebuildSlots(material);
}

export function removeNodePatch(material, id) {
	const list = nodePatches.get(material);
	if (!list || !list.some((p) => p.id === id)) return false;
	nodePatches.set(material, list.filter((p) => p.id !== id));
	rebuildSlots(material);
	return true;
}

export function listNodePatches(material) {
	return nodePatches.get(material) || [];
}

/** Mask node the shadow pass must apply for this material (dissolve), if any. */
export function getShadowMask(material) {
	return shadowMasks.get(material) || null;
}

// -------------------------------------------------------------------------------------------------
// Shared nodes

/** Rest-pose object position in metres (mirrors vLabObjectPos in backends/webgl/patches.js). */
const modelScaleX = length(modelWorldMatrix.mul(vec4(1, 0, 0, 0)).xyz);
const objectPosition = varying(positionGeometry.mul(modelScaleX), 'vLabObjectPos');

export const premultipliedAdditive = {
	transparent: true,
	depthTest: false,
	depthWrite: false,
	blending: THREE.CustomBlending,
	blendEquation: THREE.AddEquation,
	blendSrc: THREE.OneFactor,
	blendDst: THREE.OneMinusSrcAlphaFactor,
	blendSrcAlpha: THREE.OneFactor,
	blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
};

const isLit = (m) => !!m && (m.isMeshStandardMaterial === true || m.isMeshStandardNodeMaterial === true);

export function createTSLEffects(backend) {
	const renderer = backend.renderer;
	const shared = {
		ortho: uniform(0),
		overdraw: uniform(0),
	};

	/** Mirrors labSceneViewZ / labVfxDepthFade / labVfxOutput in shaders/chunks/vfx.glsl. */
	const sceneViewZ = () => {
		const depth = backend.pipeline.sceneDepth.sample(screenUV).r;
		return select(shared.ortho.greaterThan(0.5), orthographicDepthToViewZ(depth, cameraNear, cameraFar), perspectiveDepthToViewZ(depth, cameraNear, cameraFar));
	};
	const vfxDepthFade = (fragViewZ, softness) => clamp(fragViewZ.sub(sceneViewZ()).div(softness), 0.0, 1.0);
	const vfxOutput = (rgb, alpha) => select(shared.overdraw.greaterThan(0.5), vec4(0.06, 0.025, 0.004, 0.0), vec4(rgb, alpha));

	/** Mirrors labViewDirection / labFresnelTerm in shaders/chunks/surface.glsl. */
	const viewDirection = select(shared.ortho.greaterThan(0.5), vec3(0, 0, 1), positionViewDirection);
	const fresnelTerm = (n) => clamp(dot(n, viewDirection), 0.0, 1.0).oneMinus();

	/** Surface effect = one node patch added to / removed from a material's twin. */
	function surface(patch, accepts = isLit) {
		return {
			patch,
			accepts,
			apply(material) {
				if (!accepts(material)) return material;
				const twin = toNodeMaterial(renderer, material);
				addNodePatch(twin, patch);
				return twin;
			},
			remove(material) {
				if (!material?.isNodeMaterial) return material;
				removeNodePatch(material, patch.id); // false when another mesh sharing the twin already removed it
				return listNodePatches(material).length ? material : restoreSource(material) || material;
			},
		};
	}

	const builders = {
		// #region wind
		wind(u) {
			const windOffset = Fn(([worldPos, mask]) => {
				const angle = u.direction.mul(DEG);
				const dir = vec2(cos(angle), sin(angle));
				const phase = dot(worldPos.xz, dir).mul(0.35).add(labTime.mul(u.frequency));
				const gust = labNoise3(vec3(worldPos.xz.mul(0.08).sub(dir.mul(labTime).mul(0.6)), labTime.mul(0.15))).mul(0.5).add(0.5);
				const sway = sin(phase).mul(0.65).add(sin(phase.mul(2.3).add(1.7)).mul(0.25));
				const amount = u.strength.mul(mix(1.0, gust.mul(2.0), u.gust)).mul(mask).mul(mask);
				return vec3(dir.x.mul(sway), abs(sway).negate().mul(0.2), dir.y.mul(sway)).mul(amount);
			});
			return surface({
				id: 'lab-wind',
				order: 10,
				// positionNode also drives the shadow pass (three copies it onto the shadow material).
				position: (local) => {
					const world = modelWorldMatrix.mul(vec4(local, 1.0)).xyz;
					const mask = clamp(positionGeometry.y.mul(modelScaleX).div(u.height), 0.0, 1.0);
					return local.add(modelWorldMatrixInverse.mul(vec4(windOffset(world, mask), 0.0)).xyz);
				},
			}, (m) => !!m && !m.isShaderMaterial);
		},
		// #endregion

		// #region dissolve
		dissolve(u) {
			const cut = Fn(() => {
				const n = clamp(labFbm3(objectPosition.mul(u.scale)).mul(0.75).add(0.5), 0.0, 1.0);
				return n.sub(u.progress.mul(1.2).sub(0.1));
			})().toVar('labDissolveCut');
			const started = step(0.001, u.progress);
			const glow = smoothstep(0.0, u.edgeWidth, cut).oneMinus().mul(started);
			const scorch = smoothstep(0.0, u.edgeWidth.mul(3.0), cut).oneMinus().mul(started);
			return surface({
				id: 'lab-dissolve',
				order: 50,
				shadow: true, // the shadow pass gets the same mask (see getShadowMask)
				mask: () => cut.greaterThanEqual(0.0),
				color: (c) => vec4(c.rgb.mul(scorch.mul(0.85).oneMinus()), c.a),
				emissive: (e) => e.add(u.edgeColor.mul(u.edgeIntensity).mul(glow)),
			});
		},
		// #endregion

		// #region status
		status(u) {
			// TSL caveat: a built-in value (normalView, the base colour sample...) first used inside an If
			// branch is only assigned in that branch. Everything shared is put in vars before branching.
			const albedo = Fn(([c]) => {
				const out = vec3(c).toVar('labStatusAlbedo');
				// Block bodies: an If callback that returns a node is treated as a `return` by TSL.
				If(u.mode.lessThan(1.5), () => {
					out.assign(mix(out, vec3(0.55, 0.75, 1.0).mul(labLuma(out)).mul(1.6).add(0.05), u.amount.mul(0.65)));
				}).ElseIf(u.mode.lessThan(2.5), () => {
					out.assign(mix(out, out.mul(vec3(0.25, 0.2, 0.18)), u.amount.mul(0.5)));
				}).ElseIf(u.mode.lessThan(3.5), () => {
					out.assign(mix(out, out.mul(vec3(0.55, 1.0, 0.45)), u.amount.mul(0.6)));
				});
				return out;
			});
			const emissive = Fn(([viewNormal]) => {
				const fresnel = fresnelTerm(viewNormal).toVar('labStatusFresnel');
				const t = labTime.mul(u.speed).toVar('labStatusTime');
				const p = objectPosition;
				const glow = vec3(1.0).toVar();
				If(u.mode.lessThan(1.5), () => {
					const sparkle = step(0.985, labHash13(floor(p.mul(90.0)).add(floor(t.mul(6.0)))));
					glow.assign(vec3(0.45, 0.75, 1.0).mul(pow(fresnel, 2.5)).add(vec3(0.8, 0.95, 1.0).mul(sparkle).mul(2.0)));
				}).ElseIf(u.mode.lessThan(2.5), () => {
					// Turbulent heat licking upwards, a fiery rim and rising ember sparks.
					const flames = labFbm3(vec3(p.x.mul(5.0), p.y.mul(4.0).sub(t.mul(2.2)), p.z.mul(5.0))).mul(0.5).add(0.5);
					const heat = smoothstep(0.5, 0.78, flames).mul(sin(t.mul(11.0).add(p.y.mul(7.0))).mul(0.25).add(0.75));
					const ember = step(0.993, labHash13(floor(vec3(p.x, p.y.sub(t.mul(0.35)), p.z).mul(45.0))));
					glow.assign(mix(vec3(1.0, 0.22, 0.03), vec3(1.0, 0.62, 0.18), heat).mul(heat).mul(1.6).add(vec3(1.0, 0.4, 0.08).mul(pow(fresnel, 2.0).mul(0.5).add(ember.mul(3.0)))));
				}).ElseIf(u.mode.lessThan(3.5), () => {
					// Pulsing veins (zero crossings of noise) and a sickly fresnel.
					const vein = smoothstep(0.0, 0.07, abs(labNoise3(p.mul(5.0).add(vec3(0.0, t.mul(0.2), 0.0))))).oneMinus();
					const pulse = sin(t.mul(3.0).sub(p.y.mul(6.0))).mul(0.45).add(0.55);
					glow.assign(vec3(0.35, 1.0, 0.2).mul(vein.mul(pulse).add(pow(fresnel, 3.0).mul(0.4))));
				});
				return glow.mul(u.intensity).mul(u.amount);
			});
			return surface({
				id: 'lab-status',
				order: 30,
				color: (c) => vec4(albedo(c.rgb), c.a),
				roughness: (r) => select(u.mode.lessThan(1.5), mix(r, 0.18, u.amount.mul(0.8)), r),
				emissive: (e) => e.add(emissive(normalView)),
			});
		},
		// #endregion

		// #region rim
		rim(u) {
			return surface({
				id: 'lab-rim',
				order: 40,
				emissive: (e) => e.add(u.color.mul(pow(fresnelTerm(normalView), u.power)).mul(u.intensity)),
			});
		},
		// #endregion

		// #region liquid
		liquid(u) {
			const rippleNormal = Fn(([xz]) => {
				const p = xz.mul(u.rippleScale).toVar();
				const cell = floor(p).toVar();
				const grad = vec2(0.0).toVar();
				for (let y = -1; y <= 1; y++) {
					for (let x = -1; x <= 1; x++) {
						const c = cell.add(vec2(x, y));
						const center = c.add(labHash22(c));
						const phase = fract(labTime.mul(u.rippleSpeed).mul(0.6).add(labHash12(c.add(7.7))));
						const d = p.sub(center);
						const dist = length(d).add(1e-4);
						const x0 = dist.sub(phase.mul(1.3));
						const envelope = exp(x0.mul(x0).mul(-40.0)).mul(phase.oneMinus());
						grad.addAssign(d.div(dist).mul(cos(x0.mul(28.0))).mul(envelope));
					}
				}
				return normalize(vec3(grad.x.mul(-0.35), 1.0, grad.y.mul(-0.35)));
			});
			// r180 builds normalNode in its own sub-build, so this var is evaluated once for the
			// colour/roughness slots and once more inside the normal slot (visible in the compiled WGSL).
			const puddle = Fn(() => {
				const up = smoothstep(0.55, 0.9, normalWorldGeometry.y);
				const n = labFbm3(vec3(positionWorld.xz.mul(0.45), 3.7)).mul(0.5).add(0.5);
				const threshold = u.coverage.oneMinus();
				return up.mul(smoothstep(threshold.sub(0.04), threshold.add(0.04), n));
			})().toVar('labPuddle');
			// Rain-soaked surface outside the puddles (tops wetter than walls).
			const wet = u.wetness.mul(clamp(normalWorldGeometry.y, 0.0, 1.0).mul(0.45).add(0.55));
			return surface({
				id: 'lab-liquid',
				order: 20,
				color: (c) => vec4(mix(c.rgb.mul(wet.mul(0.45).oneMinus()), mix(c.rgb.mul(0.25), u.tint, 0.7), puddle), c.a),
				roughness: (r) => mix(r.mul(wet.mul(0.55).oneMinus()), u.roughness, puddle),
				metalness: (m) => m.mul(puddle.oneMinus()),
				normal: (n) => normalize(mix(n, cameraViewMatrix.mul(vec4(rippleNormal(positionWorld.xz), 0.0)).xyz, puddle)),
			});
		},
		// #endregion

		// #region flame
		flame(u) {
			const m = new THREE.MeshBasicNodeMaterial({ name: 'Flame (TSL)', ...premultipliedAdditive });
			const aCenter = attribute('aCenter', 'vec3');
			const aSize = attribute('aSize', 'vec2');
			const center = modelWorldMatrix.mul(vec4(aCenter, 1.0)).xyz;
			const toCamera = cameraPosition.sub(center).mul(vec3(1, 0, 1));
			const forward = normalize(toCamera.add(vec3(1e-4, 0, 0)));
			const right = vec3(forward.z, 0, forward.x.negate());
			const world = center.add(right.mul(positionGeometry.x.mul(aSize.x))).add(vec3(0, positionGeometry.y.mul(aSize.y), 0));
			const mvPosition = cameraViewMatrix.mul(vec4(world, 1.0));
			const viewZ = varying(mvPosition.z, 'vFlameViewZ');
			m.vertexNode = cameraProjectionMatrix.mul(mvPosition);
			m.fragmentNode = Fn(() => {
				const fade = vfxDepthFade(viewZ, float(0.12));
				If(fade.lessThanEqual(0.0), () => {
					Discard();
				});
				const seed = attribute('aSeed', 'float');
				const p = uv();
				const t = labTime.mul(u.speed).add(seed.mul(17.0));
				const n = labFbm3(vec3(p.x.mul(3.0), p.y.mul(2.4).sub(t.mul(1.7)), t.mul(0.35).add(seed)));
				const n2 = labNoise3(vec3(p.x.mul(7.0), p.y.mul(6.0).sub(t.mul(3.1)), seed.mul(3.0)));
				const x = p.x.sub(0.5).add(n.mul(0.16).add(n2.mul(0.05)).mul(u.turbulence).mul(p.y));
				const width = pow(p.y.oneMinus(), 1.1).mul(0.34).add(0.02);
				const body = smoothstep(width.mul(0.45), width, abs(x)).oneMinus();
				const base = smoothstep(0.0, 0.12, p.y);
				const top = smoothstep(0.45, 0.95, p.y.add(n.mul(0.22))).oneMinus();
				const flame = body.mul(base).mul(top);
				const core = smoothstep(0.45, 1.0, flame).mul(smoothstep(0.05, 0.55, p.y).oneMinus());
				const color = mix(u.edgeColor, u.coreColor, core).mul(flame).mul(u.intensity).mul(attribute('aIntensity', 'float'));
				return vfxOutput(color.mul(fade), 0.0);
			})();
			return { material: m };
		},
		// #endregion

		// #region portal
		portal(u) {
			const m = new THREE.MeshBasicNodeMaterial({ name: 'Town portal (TSL)', side: THREE.DoubleSide, ...premultipliedAdditive });
			m.fragmentNode = Fn(() => {
				const fade = vfxDepthFade(positionView.z, float(0.2));
				If(fade.lessThanEqual(0.0), () => {
					Discard();
				});
				const p = uv().sub(0.5).mul(2.0); // ellipse inscribed in the quad
				const r = length(p);
				If(r.greaterThan(1.08), () => {
					Discard();
				});
				const t = labTime.mul(u.speed);
				const swirl = atan(p.y, p.x).add(r.mul(u.swirl)).sub(t.mul(1.3));
				const n = labFbm3(vec3(cos(swirl).mul(r).mul(2.0), sin(swirl).mul(r).mul(2.0), t.mul(0.4))).mul(0.5).add(0.5);
				const bands = sin(swirl.mul(3.0).add(n.mul(4.0))).mul(0.5).add(0.5);
				const rim = smoothstep(0.72, 0.96, r).mul(smoothstep(0.96, 1.08, r).oneMinus());
				const inner = smoothstep(0.75, 1.0, r).oneMinus();
				const glow = u.color.mul(rim.mul(2.0).add(inner.mul(bands.mul(n).mul(0.7).add(0.12)))).mul(u.intensity);
				const core = mix(u.color.mul(0.15), vec3(0.9, 0.97, 1.0), smoothstep(0.0, 0.35, r).oneMinus().mul(n)).mul(inner);
				return vfxOutput(glow.add(core).mul(fade), inner.mul(0.75).mul(fade));
			})();
			return { material: m };
		},
		// #endregion

		// #region runes
		runes(u) {
			const segment = Fn(([p, a, b]) => {
				const pa = p.sub(a);
				const ba = b.sub(a);
				const h = clamp(dot(pa, ba).div(dot(ba, ba)), 0.0, 1.0);
				return length(pa.sub(ba.mul(h)));
			}).setLayout({ name: 'labSegment', type: 'float', inputs: [{ name: 'p', type: 'vec2' }, { name: 'a', type: 'vec2' }, { name: 'b', type: 'vec2' }] });
			const m = new THREE.MeshBasicNodeMaterial({ name: 'Waypoint runes (TSL)', side: THREE.DoubleSide, ...premultipliedAdditive });
			m.fragmentNode = Fn(() => {
				const fade = vfxDepthFade(positionView.z, float(0.03));
				If(fade.lessThanEqual(0.0), () => {
					Discard();
				});
				const p = uv().sub(0.5).mul(2.0);
				const r = length(p);
				If(r.greaterThan(1.0), () => {
					Discard();
				});
				const angle = atan(p.y, p.x).add(Math.PI);
				const t = labTime.mul(u.speed);
				const ring = smoothstep(0.0, 0.025, abs(r.sub(0.92))).oneMinus().add(smoothstep(0.0, 0.02, abs(r.sub(0.64))).oneMinus().mul(0.8));
				const sectors = 16.0;
				const sector = floor(angle.div(Math.PI * 2).mul(sectors));
				const g = vec2(fract(angle.div(Math.PI * 2).mul(sectors)), r.sub(0.68).div(0.2));
				let stroke = float(1e3);
				for (let i = 0; i < 3; i++) {
					const a = labHash22(vec2(sector, i * 3.1));
					const b = labHash22(vec2(sector.add(7.0), i * 5.7));
					stroke = min(stroke, segment(g, vec2(a.x.mul(0.6).add(0.2), a.y.mul(0.8).add(0.1)), vec2(b.x.mul(0.6).add(0.2), b.y.mul(0.8).add(0.1))));
				}
				const glyphs = smoothstep(0.02, 0.07, stroke).oneMinus().mul(step(0.0, g.y)).mul(step(g.y, 1.0));
				const sweepAngle = u.activation.mul(Math.PI * 2 + 0.3);
				const sweep = smoothstep(sweepAngle.sub(0.3), sweepAngle, angle).oneMinus();
				const pulse = sin(t.mul(2.5).sub(r.mul(6.0))).mul(0.25).add(0.75);
				const halo = exp(abs(r.sub(0.92)).mul(-18.0)).mul(0.35).mul(u.activation);
				return vfxOutput(u.color.mul(ring.add(glyphs).mul(sweep).mul(pulse).add(halo)).mul(u.intensity).mul(fade), 0.0);
			})();
			return { material: m };
		},
		// #endregion
	};

	return {
		language: 'TSL',
		labTime,
		shared,
		/** VFX-layer helpers shared with backends/webgpu/vfx.js. */
		vfx: { depthFade: vfxDepthFade, output: vfxOutput, sceneViewZ },
		toNodeMaterial: (material) => toNodeMaterial(renderer, material),
		create(name, overrides) {
			if (!EFFECTS[name]) throw new Error(`Unknown effect ${name}`);
			const build = builders[name];
			if (!build) return null;
			const uniforms = makeUniforms(name, overrides);
			return { name, uniforms, ...build(uniforms) };
		},
		has(name) {
			return !!builders[name];
		},
		update(elapsed) {
			labTime.value = elapsed;
		},
		setCamera(camera) {
			shared.ortho.value = camera.isOrthographicCamera ? 1 : 0;
		},
		/** Mirrors createCutaway() in ../webgl/effects.js and shaders/effects/cutaway.glsl. */
		createCutaway() {
			const u = { center: uniform(new THREE.Vector3()), radius: uniform(0.3), feet: uniform(0), on: uniform(0) };
			const bayer2 = (a) => {
				const f = floor(a);
				return fract(f.x.mul(0.5).add(f.y.mul(f.y).mul(0.75)));
			};
			const depth = positionView.z.negate();
			const s = select(shared.ortho.greaterThan(0.5), positionView.xy, positionView.xy.div(max(depth, 1e-4)));
			const r = length(s.sub(u.center.xy)).div(u.radius);
			const dither = bayer2(screenCoordinate.xy.mul(0.5)).mul(0.25).add(bayer2(screenCoordinate.xy));
			const cut = u.on.greaterThan(0.5)
				.and(r.lessThan(1.0))
				.and(depth.lessThan(u.center.z.sub(0.4)))
				.and(positionWorld.y.greaterThan(u.feet.add(0.35)))
				.and(dither.greaterThanEqual(smoothstep(0.55, 1.0, r)));
			return {
				uniforms: u,
				...surface({ id: 'lab-cutaway', order: 5, mask: () => cut.not() }, (m) => !!m && (m.isMeshStandardMaterial === true || m.isMeshStandardNodeMaterial === true) && !m.transparent),
			};
		},
		/** Mirrors createHeroRim() in ../webgl/effects.js and shaders/effects/hero_rim.glsl. */
		createHeroRim() {
			const u = { color: uniform(new THREE.Color(0x8fb2ff)), intensity: uniform(0), power: uniform(3), bias: uniform(0.6) };
			const rim = Fn(([viewNormal]) => {
				const top = clamp(viewNormal.y.mul(0.5).add(0.5), 0.0, 1.0);
				return u.color.mul(pow(fresnelTerm(viewNormal), u.power).mul(mix(1.0, top, u.bias)).mul(u.intensity));
			});
			return {
				uniforms: u,
				...surface({ id: 'lab-hero-rim', order: 41, emissive: (e) => e.add(rim(normalView)) }),
			};
		},
		/** Mirrors createTerrain() in ../webgl/effects.js and shaders/effects/terrain.glsl. */
		createTerrain({ layers, splat, rect }) {
			const u = {
				tile: uniform(new THREE.Vector3(...layers.map((l) => 1 / l.recipe.tile))),
				softness: uniform(0.12),
				heightBlend: uniform(0.6),
				water: uniform(0.3),
				waterRough: uniform(0.05),
				damp: uniform(0.25),
				ao: uniform(0.6),
				variation: uniform(1),
				variationScale: uniform(0.09),
				rotate: uniform(0),
				macro: uniform(0.3),
				edgeNoise: uniform(0.5),
				debug: uniform(0),
				grassShadow: uniform(0),
				grassLift: uniform(0),
				grassShadowOffset: uniform(new THREE.Vector2()),
				blood: uniform(1),
				bloodColor: uniform(new THREE.Color(1, 0.55, 0.5)),
				veinColor: uniform(new THREE.Color('#5a1f21')),
				bakedAo: uniform(0),
				rect: uniform(rect),
			};
			const mask = (weight, delta) => {
				const x = weight.mul(u.heightBlend.mul(2.0).add(1.0)).sub(u.heightBlend).add(delta.mul(u.heightBlend));
				return smoothstep(float(0.5).sub(u.softness), u.softness.add(0.5), x);
			};
			const breakup = (weight, n) => clamp(weight.add(n.mul(u.edgeNoise).mul(4.0).mul(weight).mul(weight.oneMinus())), 0.0, 1.0);
			const st = vec2(positionWorld.x, positionWorld.z.negate());
			const k = labNoise3(vec3(st.mul(u.variationScale), 1.7)).mul(0.5).add(0.5).toVar('labTerK');
			const macro = labNoise3(vec3(st.mul(0.035), 4.2));
			const edge = labNoise3(vec3(st.mul(0.55), 9.1)).toVar('labTerEdge');
			// labTerrainSample(): two reads with per-area offsets, cross-faded; gradients from the plain UV.
			const l = k.mul(8.0);
			const ia = floor(l);
			const f = l.sub(ia);
			const offA = sin(vec2(3.0, 7.0).mul(ia)).mul(u.variation);
			const offB = sin(vec2(3.0, 7.0).mul(ia.add(1.0))).mul(u.variation);
			// Quarter turns per variant when u.rotate = 1 (labTerrainTurn in terrain.glsl); normals are turned back.
			const qA = ia.mul(3.0).mod(4.0).mul(u.rotate);
			const qB = ia.add(1.0).mul(3.0).mod(4.0).mul(u.rotate);
			const turn = (v, q) => {
				const c = cos(q.mul(Math.PI / 2));
				const s = sin(q.mul(Math.PI / 2));
				return vec2(c.mul(v.x).sub(s.mul(v.y)), s.mul(v.x).add(c.mul(v.y)));
			};
			const nodes = [];
			const layer = (i) => {
				const uv = st.mul(u.tile[['x', 'y', 'z'][i]]);
				const dx = dFdx(uv);
				const dy = dFdy(uv);
				const read = (key, off, q) => {
					const base = texture(layers[i][key], turn(uv, q).add(off));
					const node = base.grad(turn(dx, q), turn(dy, q));
					nodes.push({ nodes: [base, node], i, key });
					return node;
				};
				const readNormal = (off, q) => {
					const n = read('normalMap', off, q);
					return vec4(turn(n.xy.mul(2.0).sub(1.0), q.negate()).mul(0.5).add(0.5), n.z, n.w);
				};
				const aA = read('map', offA, qA);
				const aB = read('map', offB, qB);
				const w = smoothstep(0.2, 0.8, f.sub(dot(aA.rgb.sub(aB.rgb), vec3(1.0)).mul(0.1))).toVar(`labTerW${i}`);
				return { a: mix(aA, aB, w), n: mix(readNormal(offA, qA), readNormal(offB, qB), w), o: mix(read('ormMap', offA, qA), read('ormMap', offB, qB), w) };
			};
			const L0 = layer(0);
			const L1 = layer(1);
			const L2 = layer(2);
			const splatW = texture(splat, positionWorld.xz.sub(u.rect.xy).mul(u.rect.zw));
			const wetWeight = breakup(splatW.r, edge);
			const grassWeight = breakup(splatW.g, edge.negate());
			const halo = u.damp.mul(smoothstep(0.0, 0.7, wetWeight));
			const wet = mask(wetWeight, L1.n.a.sub(L0.n.a)).toVar('labTerWet');
			const water = wet.mul(smoothstep(u.water.sub(0.05), u.water, L1.n.a).oneMinus()).mul(step(0.001, u.water)).toVar('labTerWater');
			const h = mix(L0.n.a, L1.n.a, wet);
			const grass = mask(grassWeight, L2.n.a.sub(h).add(u.grassLift)).toVar('labTerGrass');
			// Contact shadow of the grass mat + darker roots at its edge (see terrain.glsl).
			const towardLight = texture(splat, positionWorld.xz.add(u.grassShadowOffset).sub(u.rect.xy).mul(u.rect.zw)).g;
			const under = max(smoothstep(0.08, 0.6, grassWeight), smoothstep(0.25, 0.8, towardLight).mul(0.85)).mul(grass.oneMinus());
			const roots = grass.mul(grass.oneMinus()).mul(4.0).mul(L2.n.a.oneMinus());
			// Same stacking as labTerrain(): dirt → wet dirt → standing water → grass.
			const stack = (base0, v1, waterValue, v2) => mix(mix(mix(base0, v1, wet), waterValue, water), v2, grass);
			const ao = stack(L0.o.r, L1.o.r, 1.0, L2.o.r);
			const wetAlbedo = mix(L0.a.rgb.mul(halo.oneMinus()), L1.a.rgb, wet);
			const layered = mix(mix(wetAlbedo, wetAlbedo.mul(0.4), water).mul(u.grassShadow.mul(under).oneMinus()), L2.a.rgb.mul(u.grassShadow.mul(roots).oneMinus()), grass);
			// Blood-soaked ground (splat B) over everything: tint, a little wetter, vein lines where soaked through (see terrain.glsl).
			const soak = smoothstep(0.15, 0.85, breakup(splatW.b, edge.mul(0.7))).mul(u.blood).toVar('labTerSoak');
			const vein = smoothstep(0.0, 0.06, abs(labNoise3(vec3(st.mul(0.9), 3.3)))).oneMinus().mul(smoothstep(0.45, 0.95, splatW.b));
			const soaked = mix(mix(layered, layered.mul(u.bloodColor), soak), u.veinColor, vein.mul(soak));
			const albedo = soaked.mul(mix(1.0, ao, u.ao)).mul(macro.mul(u.macro).add(1.0));
			const debugAlbedo = mix(mix(mix(vec3(0.45, 0.28, 0.15), vec3(0.08, 0.22, 0.6), wet), vec3(0.2, 0.55, 0.12), grass), vec3(0.6, 0.04, 0.05), soak);
			const rough = stack(L0.o.g.mul(halo.mul(0.3).oneMinus()), L1.o.g, u.waterRough, L2.o.g).mul(mix(1.0, 0.7, soak));
			const worldNormal = Fn(() => {
				const N = normalWorldGeometry;
				const T = normalize(vec3(1, 0, 0).sub(N.mul(N.x)));
				const B = cross(N, T);
				const tn = stack(L0.n.xyz, L1.n.xyz, vec3(0.5, 0.5, 1.0), L2.n.xyz).mul(2.0).sub(1.0);
				return normalize(T.mul(tn.x).add(B.mul(tn.y)).add(N.mul(tn.z)));
			});
			return {
				uniforms: u,
				setLayers: (sets) => nodes.forEach(({ nodes: pair, i, key }) => pair.forEach((n) => (n.value = sets[i][key]))),
				...surface({
					id: 'lab-terrain',
					order: 2,
					// mix, not select(): select() becomes an if/else and the toVar masks would only be assigned in the branch built first.
					color: (c) => vec4(c.rgb.mul(mix(albedo, debugAlbedo, step(0.5, u.debug))), c.a),
					roughness: (r) => r.mul(rough),
					normal: () => normalize(cameraViewMatrix.mul(vec4(worldNormal(), 0.0)).xyz),
					ao: (a) => a.mul(mix(float(1.0), splatW.a, u.bakedAo)), // baked sky visibility (splat A) on the indirect light
				}),
			};
		},
		/** Mirrors createShadowFill() in ../webgl/effects.js and shaders/effects/shadow_fill.glsl. */
		createShadowFill() {
			const u = { color: uniform(new THREE.Color(0x3c5248)), strength: uniform(0), threshold: uniform(0.05) };
			const fill = Fn(([lit, albedo]) => {
				const dark = smoothstep(0.0, u.threshold, dot(lit, vec3(0.2126, 0.7152, 0.0722))).oneMinus();
				const base = mix(albedo, vec3(dot(albedo, vec3(0.2126, 0.7152, 0.0722))), 0.5);
				return lit.add(base.mul(u.color).mul(u.strength).mul(dark));
			});
			return {
				uniforms: u,
				...surface({ id: 'lab-shadow-fill', order: 90, output: (o) => vec4(fill(o.rgb, diffuseColor.rgb), o.a) }),
			};
		},
		/** Mirrors createGroundBlend() in ../webgl/effects.js and shaders/effects/ground_blend.glsl. */
		createGroundBlend({ size = 2048 } = {}) {
			const u = {
				band: uniform(0.22),
				width: uniform(0.3),
				fraction: uniform(0.3),
				noise: uniform(0.6),
				strength: uniform(1),
				normal: uniform(0.85),
				top: uniform(0.35),
				contact: uniform(0.85),
				darken: uniform(0.3),
				unroll: uniform(1),
				contactHeight: uniform(1.2),
				softness: uniform(0.35),
				debug: uniform(0),
				rect: uniform(new THREE.Vector4(0, 0, 1, 1)),
			};
			// The texture nodes are built on the targets' own textures: TSL flips render-target reads at build time.
			const targets = {
				albedo: new THREE.RenderTarget(size, size, { type: THREE.UnsignedByteType }),
				normal: new THREE.RenderTarget(size, size, { type: THREE.HalfFloatType }),
			};
			targets.albedo.texture.name = 'Ground blend · capture (√albedo, roughness)';
			targets.normal.texture.name = 'Ground blend · capture (normal xz, height, coverage)';
			// labGroundUv(). A WebGPU device stores render targets top row first and three r180 does not flip their reads in
			// WGSL (WGSLNodeBuilder.isFlipY() is false), so there the image's v runs the other way; WebGL2 (and the WebGPU
			// renderer's WebGL2 backend) read them like the GLSL path.
			const groundUv = (xz) => {
				const v = xz.y.sub(u.rect.y).mul(u.rect.w);
				return vec2(xz.x.sub(u.rect.x).mul(u.rect.z), backend.isWebGPU ? v : v.oneMinus());
			};
			const data = attribute('labGround', 'vec2'); // x = contact with another asset, y = its local relief (env/contact.js)
			/** labGroundBlend() of ground_blend.glsl; `amount` = the profile's vec3 uniform (top cover ×, contact fill ×, band ×). */
			const blend = (albedo, amount) => {
				const wp = positionWorld;
				const n = normalize(normalWorldGeometry);
				const uv0 = groundUv(wp.xz);
				const below = texture(targets.normal.texture, uv0);
				const lift = wp.y.sub(below.z);
				const border = smoothstep(vec2(0.0), vec2(0.04), uv0).mul(smoothstep(vec2(0.0), vec2(0.04), uv0.oneMinus()));
				const inside = below.w.mul(border.x).mul(border.y);
				const wave = labNoise3(vec3(wp.xz.mul(1.9), wp.y.mul(0.7))).mul(0.65).add(labNoise3(wp.mul(7.3).add(5.1)).mul(0.35));
				const ny = clamp(n.y, 0.0, 1.0);
				const slope = select(n.y.lessThan(0.0), float(20.0), sqrt(max(ny.mul(ny).oneMinus(), 0.0)).div(max(ny, 0.05)));
				const band = min(min(u.band.mul(amount.z), data.y.mul(u.fraction)), u.width.mul(slope)).mul(max(wave.mul(u.noise).add(1.0), 0.0));
				const groove = smoothstep(0.01, 0.12, labLuma(albedo)).sub(0.5);
				const h = lift.add(groove.mul(band).mul(0.6).mul(u.noise));
				const soft = max(band.mul(u.softness), 0.004);
				const wBand = smoothstep(band.sub(soft), band.add(soft), h).oneMinus();
				const wTop = smoothstep(0.6, 0.9, n.y.add(wave.mul(0.2))).mul(smoothstep(0.1, 0.3, lift)).mul(smoothstep(-0.35, 0.25, wave)).mul(u.top).mul(amount.x);
				const touch = smoothstep(0.35, 1.0, data.x).mul(smoothstep(u.contactHeight.mul(0.5), u.contactHeight.add(0.01), lift).oneMinus()).mul(amount.y);
				const wContact = touch.mul(smoothstep(-0.6, 0.4, wave)).mul(u.contact);
				const strength = u.strength.mul(inside);
				const line = wBand.mul(wBand.oneMinus()).mul(4.0); // the soil line
				const at = wp.xz.add(n.xz.mul(clamp(lift, 0.0, u.band.mul(2.0)).mul(u.unroll))); // the ground unrolled up the face
				const A = texture(targets.albedo.texture, groundUv(at));
				const gn = texture(targets.normal.texture, groundUv(at)).xy.mul(2.0).sub(1.0);
				return {
					albedo: A.rgb.mul(A.rgb),
					rough: A.w,
					normal: normalize(vec3(gn.x, sqrt(max(dot(gn, gn).oneMinus(), 0.0)), gn.y)),
					weight: clamp(max(max(wBand, wTop), wContact), 0.0, 1.0).mul(strength),
					normalWeight: max(wBand.mul(wBand), wTop).mul(strength).mul(u.normal).mul(smoothstep(-0.5, 0.0, n.y)), // low in the band, not on faces looking down (ground_blend.glsl)
					shade: touch.mul(0.8).add(line.mul(0.6)).mul(u.darken).mul(strength).oneMinus(),
					debug: vec3(wBand, wTop, wContact).mul(inside),
				};
			};
			const accepts = (m) => !!m && (m.isMeshStandardMaterial === true || m.isMeshStandardNodeMaterial === true) && !m.transparent;
			const profiles = new Map();
			const profile = (top = 0, contactFill = 1, band = 1) => {
				const key = `${top}|${contactFill}|${band}`;
				if (!profiles.has(key)) {
					const g = blend(materialColor.rgb, uniform(new THREE.Vector3(top, contactFill, band)));
					profiles.set(key, surface({
						id: 'lab-ground-blend',
						order: 4,
						color: (c) => vec4(mix(mix(c.rgb, g.albedo, g.weight).mul(g.shade), vec3(0.03), step(0.5, u.debug)), c.a),
						emissive: (e) => e.add(g.debug.mul(0.6).mul(step(0.5, u.debug))), // debug view: the weights glow
						roughness: (r) => mix(r, g.rough, g.weight),
						metalness: (m) => m.mul(g.weight.oneMinus()),
						normal: (nv) => normalize(mix(nv, cameraViewMatrix.mul(vec4(g.normal, 0.0)).xyz, g.normalWeight)),
					}, accepts));
				}
				return profiles.get(key);
			};
			const captureMode = uniform(0);
			const capturePatch = {
				id: 'lab-ground-capture',
				order: 200,
				// mix, not select(): normalWorld would only be assigned in the branch built first.
				output: () => mix(vec4(sqrt(max(diffuseColor.rgb, vec3(0.0))), roughnessProperty), vec4(normalWorld.xz.mul(0.5).add(0.5), positionWorld.y, 1.0), step(0.5, captureMode)),
			};
			return {
				uniforms: u,
				targets,
				captureMode,
				profile,
				remove(material) {
					if (!material?.isNodeMaterial) return material;
					removeNodePatch(material, 'lab-ground-blend');
					return listNodePatches(material).length ? material : restoreSource(material) || material;
				},
				captureMaterial(terrain) {
					const material = terrain.apply(new THREE.MeshStandardMaterial({ name: 'Ground blend · capture', color: 0xffffff, roughness: 1, metalness: 0 }));
					addNodePatch(material, capturePatch);
					return material;
				},
			};
		},
		/** Mirrors createBakedShadow() in ../webgl/effects.js (./bakedShadow.js). */
		createBakedShadow: (light, options) => createBakedShadowGPU(backend, light, options),
		/** Built-in material a node twin was made from (or the material itself). */
		sourceOf: (material) => sourceOf.get(material) || material,
	};
}
