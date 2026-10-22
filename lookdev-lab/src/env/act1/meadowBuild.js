// ASHLAR · Act I base maps — the MEADOW builder (THREE side of env/act1/meadow.js), run by env/act1/outdoorBuild.js for plans with `field`, `smoke` or
// `far.apron` (first: maps/poppyReach.js, the Poppy Reach). Builds:
//  · the land apron beyond the bounds — rings round the map carrying the terrain's border outward into the far land, with the terrain's own N-layer
//    material (the meadow simply goes on to the horizon); its border normals are shared with the terrain so the seam does not shade;
//  · the field — poppy clumps (A08.1 placeholder: vertex-coloured mini meshes, a stem ribbon and a cupped head each; red #B3262A rims round a dark
//    centre, buds; three variants, one InstancedMesh each, tinted per instance) and grey-green meadow tufts (the Dark Wood grass card atlas, the A03.1
//    stand-in), both swaying with the lab wind effect on the GPU (no per-frame CPU) and bent by the hero's feet; they follow the scene's "cards" toggle;
//  · the sleep smoke (LD proposal: smoke is terrain) — per zone a stack of soft-rimmed horizontal slices + a side curtain fading upward, tilted to the
//    ground under it: soft-edged but clearly bordered, evenly and slightly warm tinted; zones breathe along the wind (a few dozen instance matrices per
//    frame); scene settings `smoke` (show), `smokeSpeed` (× wind), `smokeInfo` (labels: "đứng trong: chậm dần → ngủ").
// Everything it creates is registered with the OutdoorBuild's `own` lists (disposed with it).
import * as THREE from 'three';
import { grassCardGeometry } from '../terrain.js';
import { labelAtlas } from './blockout.js';
import { fieldInstances, apronHeight, apronMesh, landNormal, smokeZones } from './meadow.js';
import { clamp, rng } from './outdoor.js';

const NO_PICK = (o) => {
	o.userData.labNoPick = o.userData.labNoCollide = true;
	return o;
};
const UP = new THREE.Vector3(0, 1, 0);
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _c = new THREE.Color();
const _n = new THREE.Vector3();
const _t = new THREE.Quaternion();

export class MeadowBuild {
	constructor(build) {
		this.b = build;
		this.W = build.world;
		this.plan = build.plan;
		this.stats = {};
		this.smokeT = 0;
	}

	build() {
		const t0 = performance.now();
		if (this.plan.far?.apron && this.b.terrain) this.buildApron();
		if (this.plan.field) this.buildField();
		if (this.plan.smoke) this.buildSmoke();
		this.stats.ms = performance.now() - t0;
		const st = this.stats;
		console.info(`[act1] meadow: ${st.ms.toFixed(0)} ms · poppy clumps ${st.poppies ?? 0} (beyond the bounds ${st.apronPoppies ?? 0}) · grass tufts ${st.grass ?? 0} · apron ${st.apronTris ?? 0} tris · smoke zones ${st.smokeZones ?? 0}`);
		return this;
	}

	// ---- the land beyond the bounds ---------------------------------------------------------------------------------------------------------------
	buildApron() {
		const W = this.W;
		this.apronY = apronHeight(W);
		const m = apronMesh(W, this.apronY);
		const g = this.b.ownGeo(new THREE.BufferGeometry());
		g.setAttribute('position', new THREE.BufferAttribute(m.position, 3));
		g.setAttribute('normal', new THREE.BufferAttribute(m.normal, 3));
		g.setAttribute('uv', new THREE.BufferAttribute(m.uv, 2));
		g.setIndex(new THREE.BufferAttribute(m.index, 1));
		g.computeBoundingBox();
		g.computeBoundingSphere();
		const mesh = NO_PICK(new THREE.Mesh(g, this.b.terrain.material));
		mesh.name = `Apron · the land beyond the bounds (${m.rings} rings × ${m.perRing})`;
		mesh.receiveShadow = true;
		this.b.group.add(mesh);
		this.apron = mesh;
		this.stats.apronTris = m.index.length / 3;
		// the terrain's border normals by the same central differences (one-sided at the border before): no shading seam at the bounds
		const nor = this.b.terrain.geometry.attributes.normal;
		const H = W.heights;
		const out = [0, 1, 0];
		for (const k of m.border) {
			const i = k % H.nx;
			const j = (k / H.nx) | 0;
			landNormal(W, this.apronY, H.x0 + i * H.cell, H.z0 + j * H.cell, out);
			nor.setXYZ(k, out[0], out[1], out[2]);
		}
		nor.needsUpdate = true;
	}

	// ---- the field: poppy clumps + meadow tufts --------------------------------------------------------------------------------------------------------
	buildField() {
		const W = this.W;
		const t0 = performance.now();
		const inst = fieldInstances(W, { density: this.b.settings.grassDensity ?? 1, apronY: this.apronY ?? null });
		this.stats.fieldMs = performance.now() - t0;
		this.stats.poppies = inst.poppyCount;
		this.stats.apronPoppies = inst.apronPoppies;
		this.stats.grass = inst.grassCount;
		const group = this.b.cardGroup ?? this.b.sub('Procedural (cards, sprigs, crows)');
		this.b.cardMeshes ??= [];
		const wind = (this.b.windGrass ??= this.b.app.backend.effects.create('wind', { strength: 0.22, height: 1, frequency: 1.7 }));
		// poppies: three clump variants (vertex colour), one InstancedMesh each
		const base = this.b.ownMat(new THREE.MeshStandardMaterial({ name: 'Poppy clumps (A08.1 placeholder, vertex colour)', vertexColors: true, roughness: 0.74, metalness: 0, side: THREE.DoubleSide }));
		const mat = this.b.ownMat(wind.apply(base));
		const P = inst.poppies;
		const lists = [[], [], []];
		for (let i = 0; i < inst.poppyCount; i++) lists[P[i * 7 + 6]].push(i);
		this.poppyMeshes = [];
		lists.forEach((ids, v) => {
			if (!ids.length) return;
			const mesh = new THREE.InstancedMesh(this.b.ownGeo(poppyClumpGeometry(911 + v * 37, v)), mat, ids.length);
			ids.forEach((i, n) => {
				const o = i * 7;
				const h = P[o + 4];
				mesh.setMatrixAt(n, _m.compose(_p.set(P[o], P[o + 1] - 0.02, P[o + 2]), _q.setFromAxisAngle(UP, P[o + 3]), _s.set(h, h, h)));
				const t = P[o + 5];
				mesh.setColorAt(n, _c.setRGB(0.84 + 0.3 * t, 0.86 + 0.16 * (1 - t), 0.88 + 0.14 * t));
			});
			mesh.instanceMatrix.needsUpdate = true;
			if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
			mesh.computeBoundingSphere();
			mesh.receiveShadow = true;
			mesh.castShadow = false;
			mesh.name = `Poppy clumps · A08.1 · variant ${v} (${ids.length})`;
			Object.assign(mesh.userData, { assetId: this.plan.field.poppy?.asset ?? 'A08.1', status: 'procedural' });
			group.add(NO_PICK(mesh));
			this.b.cardMeshes.push(mesh);
			this.poppyMeshes.push(mesh);
		});
		// meadow tufts: the grass card atlas, grey-green
		const tex = this.b.tex?.cards;
		if (!tex || !inst.grassCount) return;
		const gbase = this.b.ownMat(new THREE.MeshStandardMaterial({ name: 'Meadow tufts (grey-green; Dark Wood grass cards, A03.1 stand-in)', map: tex, alphaTest: 0.45, roughness: 0.9, metalness: 0, vertexColors: true, color: new THREE.Color(0.74, 0.8, 0.66) }));
		const gmat = this.b.ownMat(wind.apply(gbase));
		const G = inst.grass;
		const cells = [[], [], [], []];
		for (let i = 0; i < inst.grassCount; i++) cells[Math.floor(G[i * 7 + 6] / 10)].push(i);
		cells.forEach((ids, cell) => {
			if (!ids.length) return;
			const mesh = new THREE.InstancedMesh(this.b.ownGeo(rootShadedCard(cell)), gmat, ids.length);
			ids.forEach((i, n) => {
				const o = i * 7;
				const tone = G[o + 6] - cell * 10;
				mesh.setMatrixAt(n, _m.compose(_p.set(G[o], G[o + 1] - 0.03, G[o + 2]), _q.setFromAxisAngle(UP, G[o + 3]), _s.set(G[o + 5], G[o + 4], G[o + 5])));
				mesh.setColorAt(n, _c.setRGB(tone * 1.02, tone * 1.04, tone * 0.9));
			});
			mesh.instanceMatrix.needsUpdate = true;
			if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
			mesh.computeBoundingSphere();
			mesh.receiveShadow = true;
			mesh.name = `Meadow tufts · A03.1 · cell ${cell} (${ids.length})`;
			group.add(NO_PICK(mesh));
			this.b.cardMeshes.push(mesh);
		});
	}

	// ---- sleep smoke ----------------------------------------------------------------------------------------------------------------------------------
	buildSmoke() {
		const s = this.plan.smoke;
		const group = NO_PICK(this.b.sub('Sleep smoke (terrain)'));
		const color = new THREE.Color(s.color ?? '#d6c8b2');
		const tex = sliceTexture();
		this.b.own.textures.push(tex);
		const sliceMat = this.b.ownMat(new THREE.MeshStandardMaterial({ name: 'Sleep smoke · slices', color, map: tex, transparent: true, opacity: s.opacity ?? 0.085, depthWrite: false, roughness: 1, metalness: 0, side: THREE.DoubleSide }));
		const wallMat = this.b.ownMat(new THREE.MeshStandardMaterial({ name: 'Sleep smoke · curtain', color, transparent: true, opacity: s.wallOpacity ?? 0.2, vertexColors: true, depthWrite: false, roughness: 1, metalness: 0, side: THREE.DoubleSide }));
		const SL = s.slices ?? [[0.05, 1], [0.27, 1], [0.49, 0.98], [0.71, 0.9], [0.9, 0.7]];
		const zones = s.zones;
		const slices = new THREE.InstancedMesh(this.b.ownGeo(new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2)), sliceMat, zones.length * SL.length);
		const walls = new THREE.InstancedMesh(this.b.ownGeo(curtainGeometry()), wallMat, zones.length);
		for (const m of [slices, walls]) {
			m.frustumCulled = false;
			m.renderOrder = 3;
			m.castShadow = m.receiveShadow = false;
			group.add(NO_PICK(m));
		}
		slices.name = `Sleep smoke · slices (${zones.length} zones × ${SL.length})`;
		walls.name = 'Sleep smoke · curtains';
		const labels = labelAtlas(zones.map((z) => ({ text: `${z.id} · Khói ngủ (địa hình)`, sub: 'đứng trong: chậm dần → ngủ thiếp', x: z.x, y: 0, z: z.z, color: '#d6c8b2', width: 6.5 })));
		labels.group.visible = false;
		group.add(labels.group);
		(this.b.labelSets ??= []).push(labels);
		this.smoke = { group, slices, walls, SL, labels };
		this.stats.smokeZones = zones.length;
		this.updateSmoke(0, null);
	}

	/** Place the smoke volumes for time t: each zone sits on the ground plane under it (tilted to the local slope), slices stacked, the curtain round it. */
	updateSmoke(t, camera) {
		const S = this.smoke;
		const W = this.W;
		const zones = smokeZones(this.plan, t);
		zones.forEach((zn, i) => {
			const { cx, cz, rx, rz } = zn;
			const rot = ((zn.rot ?? 0) * Math.PI) / 180;
			const y0 = W.height(cx, cz);
			// the ground plane under the zone (heights across its two axes)
			const gx = (W.height(cx + rx * 0.6, cz) - W.height(cx - rx * 0.6, cz)) / (rx * 1.2);
			const gz = (W.height(cx, cz + rz * 0.6) - W.height(cx, cz - rz * 0.6)) / (rz * 1.2);
			_n.set(-gx, 1, -gz).normalize();
			const tilt = _t.setFromUnitVectors(UP, _n).multiply(_q.setFromAxisAngle(UP, rot)); // the zone's own turn (THREE's rotation.y = the plan's ellipse rot), then the slope
			S.SL.forEach(([hf, rf], k) => {
				_p.set(cx, y0 - 0.25 + zn.height * hf, cz);
				S.slices.setMatrixAt(i * S.SL.length + k, _m.compose(_p, tilt, _s.set(rx * rf, 1, rz * rf)));
			});
			S.walls.setMatrixAt(i, _m.compose(_p.set(cx, y0 - 0.35, cz), tilt, _s.set(rx * 0.985, zn.height * 0.92, rz * 0.985)));
			const label = S.labels.group.children[i];
			if (label) label.position.set(cx, y0 + zn.height + 0.8, cz);
		});
		S.slices.instanceMatrix.needsUpdate = true;
		S.walls.instanceMatrix.needsUpdate = true;
		if (camera && S.labels.group.visible) S.labels.face(camera);
	}

	update(elapsed, delta, { camera } = {}) {
		const s = this.b.settings;
		if (this.smoke) {
			const on = s.smoke !== false;
			this.smoke.group.visible = on;
			this.smoke.labels.group.visible = on && !!s.smokeInfo;
			if (on) {
				this.smokeT += clamp(delta, 0, 0.25) * (s.smokeSpeed ?? 1);
				this.updateSmoke(this.smokeT, camera);
			}
		}
	}
}

// ---- geometry helpers ---------------------------------------------------------------------------------------------------------------------------------

/**
 * A poppy clump, unit height (the instance scale is its height in metres): 4–6 stems as thin ribbons from a common root to cupped heads (a hexagon fan:
 * a dark centre, poppy-red rims, the cup facing the sky with a random nod) and a closed bud on most variants. Vertex colours, explicit normals (heads face
 * their cup, stems face up like the grass cards, so the clump lights like the ground it grows from). Non-indexed.
 */
function poppyClumpGeometry(seed, variant) {
	const r = rng(seed);
	const pos = [];
	const nor = [];
	const col = [];
	const C = (hex) => new THREE.Color(hex);
	const reds = [C('#c22b2c'), C('#cf362f'), C('#b3262a')];
	const dark = C('#2a0c10');
	const inner = C('#5c1418');
	const stemLo = C('#4c5a3c');
	const stemHi = C('#6c7a52');
	const budC = C('#5f6c40');
	const v3 = (p, n, c) => {
		pos.push(p[0], p[1], p[2]);
		nor.push(n[0], n[1], n[2]);
		col.push(c.r, c.g, c.b);
	};
	const heads = [7, 6, 8][variant] ?? 7;
	for (let k = 0; k < heads; k++) {
		const a = r() * Math.PI * 2;
		const d = Math.sqrt(r()) * 0.5;
		const hx = Math.cos(a) * d;
		const hz = Math.sin(a) * d;
		const bud = k === heads - 1 && variant !== 2;
		const hy = bud ? 0.5 + r() * 0.2 : 0.62 + r() * 0.38;
		// the stem ribbon
		const sx = hx * 0.2;
		const sz = hz * 0.2;
		const ang = r() * Math.PI;
		const wx = Math.cos(ang) * 0.011;
		const wz = Math.sin(ang) * 0.011;
		const up = [0, 1, 0];
		const s0 = [sx - wx, 0, sz - wz];
		const s1 = [sx + wx, 0, sz + wz];
		const s2 = [hx + wx, hy, hz + wz];
		const s3 = [hx - wx, hy, hz - wz];
		for (const [p, c] of [[s0, stemLo], [s1, stemLo], [s2, stemHi], [s0, stemLo], [s2, stemHi], [s3, stemHi]]) v3(p, up, c);
		// the head: a cup of six petals round a dark centre, nodding a little
		const R = bud ? 0.05 + r() * 0.015 : 0.12 + r() * 0.05; // stylised big heads: they must read from the D2 camera
		const nx0 = (r() - 0.5) * 1.1;
		const nz0 = (r() - 0.5) * 1.1;
		const nl = Math.hypot(nx0, 1, nz0);
		const n = [nx0 / nl, 1 / nl, nz0 / nl];
		const u = normalize(cross(n, Math.abs(n[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]));
		const w = cross(n, u);
		const cup = bud ? 1.1 : 0.34;
		const c0 = [hx, hy, hz];
		const red = reds[k % reds.length];
		const rim = [];
		for (let i = 0; i < 6; i++) {
			const t = (i / 6) * Math.PI * 2 + r() * 0.2;
			const rr = R * (0.9 + 0.2 * r());
			rim.push([c0[0] + (u[0] * Math.cos(t) + w[0] * Math.sin(t)) * rr + n[0] * R * cup, c0[1] + (u[1] * Math.cos(t) + w[1] * Math.sin(t)) * rr + n[1] * R * cup, c0[2] + (u[2] * Math.cos(t) + w[2] * Math.sin(t)) * rr + n[2] * R * cup]);
		}
		for (let i = 0; i < 6; i++) {
			v3(c0, n, bud ? budC : dark);
			v3(rim[i], n, bud ? (i % 2 ? red : budC) : i % 2 ? red : inner.clone().lerp(red, 0.75));
			v3(rim[(i + 1) % 6], n, bud ? budC : red);
		}
	}
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
	g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
	g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
	g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
	g.computeBoundingBox();
	g.computeBoundingSphere();
	return g;
}

const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const normalize = (a) => {
	const l = Math.hypot(a[0], a[1], a[2]) || 1;
	return [a[0] / l, a[1] / l, a[2] / l];
};

/** A 2 × 2 atlas grass card (terrain.js grassCardGeometry), darker toward the root (vertex colour) — the same look as the build's own grass cards. */
function rootShadedCard(cell) {
	const g = grassCardGeometry(cell);
	const pos = g.attributes.position;
	const col = new Float32Array(pos.count * 3);
	for (let i = 0; i < pos.count; i++) col.fill(0.5 + 0.5 * clamp(pos.getY(i), 0, 1), i * 3, i * 3 + 3);
	g.setAttribute('color', new THREE.BufferAttribute(col, 3));
	return g;
}

/** The smoke slice: a white disc whose alpha holds even inside and falls off over the outer 14 % (soft edge, clear border). RGBA DataTexture, mipmapped. */
function sliceTexture() {
	const N = 128;
	const data = new Uint8Array(N * N * 4);
	for (let j = 0; j < N; j++) {
		for (let i = 0; i < N; i++) {
			const x = ((i + 0.5) / N) * 2 - 1;
			const y = ((j + 0.5) / N) * 2 - 1;
			const d = Math.hypot(x, y);
			const t = clamp((d - 0.86) / 0.14, 0, 1);
			const a = d >= 1 ? 0 : (1 - t * t * (3 - 2 * t)) * (0.9 + 0.1 * (1 - d));
			data.set([255, 255, 255, Math.round(a * 255)], (j * N + i) * 4);
		}
	}
	const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat, THREE.UnsignedByteType);
	Object.assign(tex, { name: 'Sleep smoke slice (soft rim)', generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, colorSpace: THREE.NoColorSpace, needsUpdate: true });
	return tex;
}

/** The smoke curtain: an open cylinder of radius 1, height 1 (base at 0), alpha in the vertex colour fading upward (the border reads, the top dissolves). */
function curtainGeometry() {
	const g = new THREE.CylinderGeometry(1, 1, 1, 56, 6, true).translate(0, 0.5, 0);
	const pos = g.attributes.position;
	const col = new Float32Array(pos.count * 4);
	for (let i = 0; i < pos.count; i++) {
		const y = clamp(pos.getY(i), 0, 1);
		col.set([1, 1, 1, (1 - y) ** 1.6], i * 4);
	}
	g.setAttribute('color', new THREE.BufferAttribute(col, 4));
	return g;
}
