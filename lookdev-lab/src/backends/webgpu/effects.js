// TSL implementations of the effects in src/effects/registry.js (mirrors ../webgl/effects.js).
// Surface effects convert a built-in material to its node-material twin and contribute to node slots
// through "node patches" (the TSL counterpart of the GLSL onBeforeCompile patches): every slot is
// rebuilt by folding the patches in order, so effects compose (wind + dissolve + status ...).
// VFX effects are node materials rendered in the VFX pass.
// The `#region` markers are read by the Shaders panel to show each effect's source.
import * as THREE from 'three/webgpu';
import {
	Fn, If, Discard, uniform, attribute, varying, vec2, vec3, vec4, float, uv, sin, cos, abs, mix, clamp, pow, dot, normalize,
	length, floor, exp, step, atan, min, fract, smoothstep, select, screenUV, positionLocal, positionGeometry, positionWorld,
	positionView, positionViewDirection, normalView, normalWorldGeometry, modelWorldMatrix, modelWorldMatrixInverse, cameraPosition,
	cameraViewMatrix, cameraProjectionMatrix, cameraNear, cameraFar, perspectiveDepthToViewZ, orthographicDepthToViewZ,
	materialColor, materialEmissive, materialRoughness, materialMetalness, materialNormal,
} from 'three/tsl';
import { EFFECTS, defaultParams } from '../../effects/registry.js';
import { labNoise3, labFbm3, labHash12, labHash13, labHash22 } from './tsl/noise.js';
import { labLuma } from './tsl/common.js';

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
// normal?(n), mask?() -> bool node, shadow?: true }. Each slot function receives the node built so far.

const SLOTS = [
	['position', 'positionNode', positionLocal],
	['color', 'colorNode', materialColor],
	['roughness', 'roughnessNode', materialRoughness],
	['metalness', 'metalnessNode', materialMetalness],
	['emissive', 'emissiveNode', materialEmissive],
	['normal', 'normalNode', materialNormal],
];

const nodePatches = new WeakMap(); // node material -> [patch]
const authored = new WeakMap(); // node material -> its own slot nodes before any patch
const shadowMasks = new WeakMap(); // node material -> mask node used by the shadow pass

function rebuildSlots(material) {
	const list = nodePatches.get(material) || [];
	const base = authored.get(material);
	for (const [slot, prop, fallback] of SLOTS) {
		const users = list.filter((p) => p[slot]);
		material[prop] = users.length ? users.reduce((node, p) => p[slot](node), base[prop] || fallback) : base[prop];
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
			return surface({
				id: 'lab-liquid',
				order: 20,
				color: (c) => vec4(mix(c.rgb, mix(c.rgb.mul(0.25), u.tint, 0.7), puddle), c.a),
				roughness: (r) => mix(r, u.roughness, puddle),
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
	};
}
