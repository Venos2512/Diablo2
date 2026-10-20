// Gameplay signal decals for the colour-rule lab (The Dying Gods · Act I rule sheet, sections I.2, I.4, I.5, VI).
//   Telegraph  an enemy attack area, readable from wind-up to hit. SHAPE first: a ring with inward ticks (circle) or
//              a frame with chevrons (line) in the danger colour; the fill that grows over the wind-up carries the
//              skill's function colour (blood, disease ...). Shape and timing still read without colour (red-green
//              colour blindness, a crowd of red Redbound, red fire light).
//   Ring       a plain band: interaction marker (fades in when the player is near) and the swatch discs.
//   Label      flat text on the ground.
// Everything is draped on the ground through a height function and uses vertex alpha / plain textures, so the
// WebGL2 and WebGPU renderers draw it unchanged. Colours are linear scene colours set by the owner (setColors):
// callers may pass display-matched colours so the rule-sheet hexes survive tone mapping.
import * as THREE from 'three';
import { FUNCTION } from './valdren.js';

const smooth = (e0, e1, x) => {
	const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
	return t * t * (3 - 2 * t);
};

let bandTextures = null;
/** Band textures (u along the band, v = 1 at the outer edge): 'ticks' (danger outline) and 'plain'. */
function bands() {
	if (bandTextures) return bandTextures;
	const make = (ticks) => {
		const c = document.createElement('canvas');
		c.width = 256;
		c.height = 64;
		const g = c.getContext('2d');
		g.clearRect(0, 0, 256, 64);
		const grad = g.createLinearGradient(0, 0, 0, 64);
		grad.addColorStop(0, 'rgba(255,255,255,1)');
		grad.addColorStop(ticks ? 0.22 : 0.3, 'rgba(255,255,255,1)');
		grad.addColorStop(ticks ? 0.3 : 0.5, 'rgba(255,255,255,0.18)');
		grad.addColorStop(1, 'rgba(255,255,255,0)');
		g.fillStyle = grad;
		g.fillRect(0, 0, 256, 64);
		if (ticks) {
			// Chevron pointing inward (toward v = 0): the "it lands here" mark, independent of hue.
			g.strokeStyle = 'rgba(255,255,255,1)';
			g.lineWidth = 9;
			g.lineCap = 'round';
			g.beginPath();
			g.moveTo(98, 18);
			g.lineTo(128, 50);
			g.lineTo(158, 18);
			g.stroke();
		}
		const tex = new THREE.CanvasTexture(c);
		tex.colorSpace = THREE.SRGBColorSpace;
		tex.wrapS = THREE.RepeatWrapping;
		tex.wrapT = THREE.ClampToEdgeWrapping;
		tex.anisotropy = 4;
		tex.name = ticks ? 'Telegraph band (ticks)' : 'Signal band (plain)';
		return tex;
	};
	bandTextures = { ticks: make(true), plain: make(false) };
	return bandTextures;
}

/**
 * Band mesh along a closed polyline (local xz points, counter-clockwise seen from above), `width` wide on the inner
 * side; u = distance / tile, v = 1 outer → 0 inner. Draped: y(x, z) in world space around `origin`.
 */
function bandGeometry(points, width, tile, origin, y) {
	const n = points.length;
	const pos = [];
	const uv = [];
	const index = [];
	let along = 0;
	for (let k = 0; k <= n; k++) {
		const p = points[k % n];
		const prev = points[(k - 1 + n) % n];
		const next = points[(k + 1) % n];
		if (k) along += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
		// Inward normal of a CCW polygon (y up, seen from above: x right, z down) = left of the direction of travel.
		const d0 = [p[0] - prev[0], p[1] - prev[1]];
		const d1 = [next[0] - p[0], next[1] - p[1]];
		const l0 = Math.hypot(...d0) || 1;
		const l1 = Math.hypot(...d1) || 1;
		let nx = d0[1] / l0 + d1[1] / l1;
		let nz = -d0[0] / l0 - d1[0] / l1;
		const nl = Math.hypot(nx, nz) || 1;
		nx /= nl;
		nz /= nl;
		const miter = 1 / Math.max(0.35, (nx * d1[1]) / l1 - (nz * d1[0]) / l1);
		for (const [t, v] of [[0, 1], [width * miter, 0]]) {
			const x = origin.x + p[0] + nx * t;
			const z = origin.z + p[1] + nz * t;
			pos.push(x - origin.x, y(x, z) - origin.y, z - origin.z);
			uv.push(along / tile, v);
		}
		if (k) {
			const a = (k - 1) * 2;
			index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
		}
	}
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
	g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
	g.setIndex(index);
	g.computeVertexNormals();
	return g;
}

const circlePoints = (radius, segments = 72) => Array.from({ length: segments }, (_, i) => {
	const a = -(i / segments) * Math.PI * 2;
	return [Math.cos(a) * radius, Math.sin(a) * radius];
});

/** Polar (circle) or rectangular (line) grid with RGBA vertex colours; `coord` per vertex = 0..1 fill coordinate. */
function fillGeometry(kind, { radius, length, width }, origin, y) {
	const pos = [];
	const coord = [];
	const index = [];
	if (kind === 'circle') {
		const rings = 22;
		const segs = 64;
		pos.push(0, y(origin.x, origin.z) - origin.y, 0);
		coord.push(0);
		for (let i = 1; i <= rings; i++) {
			const rr = (i / rings) * radius;
			for (let s = 0; s < segs; s++) {
				const a = -(s / segs) * Math.PI * 2;
				const x = Math.cos(a) * rr;
				const z = Math.sin(a) * rr;
				pos.push(x, y(origin.x + x, origin.z + z) - origin.y, z);
				coord.push(i / rings);
			}
		}
		for (let s = 0; s < segs; s++) index.push(0, 1 + s, 1 + ((s + 1) % segs));
		for (let i = 1; i < rings; i++) {
			for (let s = 0; s < segs; s++) {
				const a = 1 + (i - 1) * segs + s;
				const b = 1 + (i - 1) * segs + ((s + 1) % segs);
				const c = a + segs;
				const d = b + segs;
				index.push(a, c, b, b, c, d);
			}
		}
	} else {
		const nl = 40;
		const nw = 6;
		for (let i = 0; i <= nl; i++) {
			for (let j = 0; j <= nw; j++) {
				const z = (i / nl) * length;
				const x = (j / nw - 0.5) * width;
				pos.push(x, z);
				coord.push(i / nl);
			}
		}
		// Local frame (yaw applied by the caller's group): drape after rotation, see Telegraph.
		const out = [];
		for (let k = 0; k < pos.length; k += 2) out.push(pos[k], 0, pos[k + 1]);
		pos.length = 0;
		pos.push(...out);
		for (let i = 0; i < nl; i++) {
			for (let j = 0; j < nw; j++) {
				const a = i * (nw + 1) + j;
				const b = a + 1;
				const c = a + nw + 1;
				const d = c + 1;
				index.push(a, b, c, b, d, c);
			}
		}
	}
	const g = new THREE.BufferGeometry();
	const n = pos.length / 3;
	g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
	g.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(n * 3).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
	g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2)); // unused; node materials expect it
	g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(n * 4), 4));
	g.setIndex(index);
	g.userData.coord = Float32Array.from(coord);
	return g;
}

const decalMaterial = (extra) => new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, ...extra });

/** Linear RGB of a palette hex. */
const lin = (hex) => new THREE.Color(hex);

/**
 * One telegraph. kind 'circle' (radius) or 'line' (length × width, along local +z turned by yaw).
 * fill = FUNCTION key of the skill (the area outline is always 'danger'). period / windup / offset in seconds.
 * update(time) animates it; `impact` is true on the frame the hit lands. The fill stays translucent so the
 * creatures inside the area stay readable (rule I.5: effects never hide players, enemies or the area edge).
 */
export class Telegraph {
	constructor({ kind = 'circle', center, radius = 3, length = 8, width = 1.6, yaw = 0, fill = 'danger', windup = 1.1, period = 4.5, offset = 0, height, label = '' }) {
		Object.assign(this, { kind, radius, length, width, yaw, fill, windup, period, offset, label });
		this.group = new THREE.Group();
		this.group.name = `Telegraph · ${label || fill}`;
		this.group.position.set(center.x, height(center.x, center.z), center.z);
		this.group.userData.labNoPick = this.group.userData.labNoCollide = true;
		const origin = this.group.position;
		const tex = bands().ticks.clone();
		tex.needsUpdate = true;
		let outline;
		if (kind === 'circle') {
			outline = bandGeometry(circlePoints(radius), Math.max(0.22, radius * 0.11), (Math.PI * 2 * radius) / Math.max(8, Math.round(radius * 3.2)), origin, (x, z) => height(x, z) + 0.06);
			this.fillGeo = fillGeometry('circle', { radius: radius * 0.97 }, origin, (x, z) => height(x, z) + 0.05);
		} else {
			// Rectangle from the caster (local z = 0) to `length`, drawn CCW; draped after the yaw turn.
			const c = Math.cos(yaw);
			const s = Math.sin(yaw);
			const turn = ([x, z]) => [x * c + z * s, -x * s + z * c];
			const rect = [[-width / 2, 0], [-width / 2, length], [width / 2, length], [width / 2, 0]].map(turn);
			outline = bandGeometry(rect, Math.max(0.2, width * 0.16), 1.0, origin, (x, z) => height(x, z) + 0.06);
			this.fillGeo = fillGeometry('line', { length, width: width * 0.94 }, origin, () => 0);
			const p = this.fillGeo.attributes.position;
			for (let i = 0; i < p.count; i++) {
				const [x, z] = turn([p.getX(i), p.getZ(i)]);
				p.setXYZ(i, x, height(origin.x + x, origin.z + z) + 0.05 - origin.y, z);
			}
		}
		this.outlineMat = decalMaterial({ map: tex, color: lin(FUNCTION.danger.colors[1]), opacity: 0 });
		this.fillMat = decalMaterial({ vertexColors: true });
		this.outline = new THREE.Mesh(outline, this.outlineMat);
		this.fillMesh = new THREE.Mesh(this.fillGeo, this.fillMat);
		this.outline.renderOrder = 4;
		this.fillMesh.renderOrder = 3;
		for (const m of [this.outline, this.fillMesh]) {
			m.frustumCulled = false;
			m.userData.labNoPick = m.userData.labNoCollide = true;
			this.group.add(m);
		}
		this.base = lin(FUNCTION[fill].colors[0]);
		this.high = lin(FUNCTION[fill].colors[1]);
		this.phase = 'rest';
		this.impact = false;
		this.enabled = true;
		this.setFill(0, 0, false);
	}

	/** Linear colours: fill base (wind-up), fill highlight (impact), outline (the danger shape). */
	setColors(base, high, outline) {
		this.base.copy(base);
		this.high.copy(high);
		this.outlineMat.color.copy(outline);
	}

	/** progress 0..1 of the fill front, alpha scale, flash (impact colour). */
	setFill(progress, alpha, flash) {
		const colors = this.fillGeo.attributes.color;
		const coord = this.fillGeo.userData.coord;
		const c = flash ? this.high : this.base;
		const edge = 0.06;
		for (let i = 0; i < coord.length; i++) {
			const u = coord[i];
			const inside = 1 - smooth(progress - edge, progress, u);
			const lead = progress > 0 ? 0.35 + 0.65 * smooth(progress - 0.3, progress, u) : 0; // the front reads strongest
			const a = alpha * inside * (flash ? 0.45 : 0.42 * lead);
			colors.setXYZW(i, c.r, c.g, c.b, a);
		}
		colors.needsUpdate = true;
	}

	update(time) {
		this.impact = false;
		if (!this.enabled) {
			this.group.visible = false;
			return;
		}
		const t = (((time + this.offset) % this.period) + this.period) % this.period;
		const hit = 0.18;
		const fade = 0.45;
		let phase;
		if (t < this.windup) phase = 'windup';
		else if (t < this.windup + hit) phase = 'impact';
		else if (t < this.windup + hit + fade) phase = 'fade';
		else phase = 'rest';
		if (phase === 'impact' && this.phase === 'windup') this.impact = true;
		this.phase = phase;
		this.group.visible = phase !== 'rest';
		if (phase === 'rest') return;
		if (phase === 'windup') {
			const p = t / this.windup;
			const pulse = 0.85 + 0.15 * Math.sin(t * 18);
			this.outlineMat.opacity = smooth(0, 0.12, t) * pulse;
			this.setFill(p ** 0.85, 1, false);
		} else if (phase === 'impact') {
			this.outlineMat.opacity = 1;
			this.setFill(1.06, 1, true);
		} else {
			const f = 1 - (t - this.windup - hit) / fade;
			this.outlineMat.opacity = f;
			this.setFill(1.06, f * f, true);
		}
	}

	dispose() {
		this.outline.geometry.dispose();
		this.fillGeo.dispose();
		this.outlineMat.map.dispose();
		this.outlineMat.dispose();
		this.fillMat.dispose();
	}
}

/** Plain draped ring (interaction marker, swatch outline). setOpacity(a) fades it. */
export class Ring {
	constructor({ center, radius, width = 0.12, color, height, segments = 64 }) {
		this.group = new THREE.Group();
		this.group.position.set(center.x, height(center.x, center.z), center.z);
		this.group.userData.labNoPick = this.group.userData.labNoCollide = true;
		const tex = bands().plain.clone();
		tex.needsUpdate = true;
		this.material = decalMaterial({ map: tex, color: lin(color), opacity: 1 });
		const g = bandGeometry(circlePoints(radius, segments), width, (Math.PI * 2 * radius) / 8, this.group.position, (x, z) => height(x, z) + 0.06);
		this.mesh = new THREE.Mesh(g, this.material);
		this.mesh.renderOrder = 4;
		this.mesh.frustumCulled = false;
		this.mesh.userData.labNoPick = this.mesh.userData.labNoCollide = true;
		this.group.add(this.mesh);
	}

	setOpacity(a) {
		this.material.opacity = a;
		this.group.visible = a > 0.01;
	}

	setColor(color) {
		this.material.color.copy(color);
	}

	dispose() {
		this.mesh.geometry.dispose();
		this.material.map.dispose();
		this.material.dispose();
	}
}

/** Static filled disc (swatch on the terrain): fill colour at `alpha`, an opaque chip of `chip` × radius at the centre. */
export class Disc {
	constructor({ center, radius, color, alpha = 0.6, chip = 0, height, lift = 0.05 }) {
		this.group = new THREE.Group();
		this.group.position.set(center.x, height(center.x, center.z), center.z);
		this.group.userData.labNoPick = this.group.userData.labNoCollide = true;
		this.alpha = alpha;
		this.chip = chip;
		const g = fillGeometry('circle', { radius }, this.group.position, (x, z) => height(x, z) + lift);
		this.geometry = g;
		this.setColor(lin(color));
		this.material = decalMaterial({ vertexColors: true });
		this.mesh = new THREE.Mesh(g, this.material);
		this.mesh.renderOrder = 3;
		this.mesh.frustumCulled = false;
		this.mesh.userData.labNoPick = this.mesh.userData.labNoCollide = true;
		this.group.add(this.mesh);
	}

	setColor(c) {
		const colors = this.geometry.attributes.color;
		const coord = this.geometry.userData.coord;
		for (let i = 0; i < coord.length; i++) {
			const u = coord[i];
			const a = u <= this.chip + 1e-4 ? 1 : this.alpha * (1 - smooth(0.9, 1, u));
			colors.setXYZW(i, c.r, c.g, c.b, a);
		}
		colors.needsUpdate = true;
	}

	dispose() {
		this.mesh.geometry.dispose();
		this.material.dispose();
	}
}

/** Text lying on the ground (two lines max), width in metres. */
export function groundLabel(text, { center, width = 2.6, height, yaw = 0, color = '#d9d2c2' }) {
	const lines = String(text).normalize('NFC').split('\n');
	const c = document.createElement('canvas');
	c.width = 512;
	c.height = 128 * lines.length;
	const g = c.getContext('2d');
	g.font = '600 60px "Segoe UI", "Noto Sans", Arial, sans-serif'; // a font with Vietnamese glyphs (Georgia stacks the marks)
	g.textAlign = 'center';
	g.textBaseline = 'middle';
	g.lineJoin = 'round';
	lines.forEach((line, i) => {
		g.lineWidth = 12;
		g.strokeStyle = 'rgba(10,9,8,0.85)';
		g.strokeText(line, 256, 64 + i * 128, 500);
		g.fillStyle = color;
		g.fillText(line, 256, 64 + i * 128, 500);
	});
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.anisotropy = 4;
	const h = (width * c.height) / c.width;
	const geo = new THREE.PlaneGeometry(width, h);
	geo.rotateX(-Math.PI / 2);
	geo.rotateY(yaw);
	const mesh = new THREE.Mesh(geo, decalMaterial({ map: tex }));
	mesh.position.set(center.x, height(center.x, center.z) + 0.08, center.z);
	mesh.renderOrder = 4;
	mesh.userData.labNoPick = mesh.userData.labNoCollide = true;
	mesh.name = `Label · ${lines[0]}`;
	return mesh;
}

/** Wall / wood decals (handprints, claw marks): a canvas texture shared by every placement. */
export function decalTexture(kind) {
	const c = document.createElement('canvas');
	c.width = c.height = 128;
	const g = c.getContext('2d');
	g.clearRect(0, 0, 128, 128);
	if (kind === 'hand') {
		// Smeared handprint (dark god-blood, not saturated: environment tier).
		g.fillStyle = 'rgba(255,255,255,0.92)';
		g.beginPath();
		g.ellipse(64, 80, 24, 28, 0, 0, Math.PI * 2);
		g.fill();
		for (const [x, y, len, a] of [[38, 62, 30, -0.5], [50, 46, 38, -0.15], [64, 42, 40, 0], [78, 46, 36, 0.15], [90, 64, 26, 0.7]]) {
			g.save();
			g.translate(x, y);
			g.rotate(a);
			g.beginPath();
			g.ellipse(0, -len / 2, 6.5, len / 2, 0, 0, Math.PI * 2);
			g.fill();
			g.restore();
		}
		g.globalCompositeOperation = 'destination-out';
		for (let i = 0; i < 40; i++) {
			g.fillStyle = `rgba(0,0,0,${0.2 + Math.random() * 0.5})`;
			g.beginPath();
			g.arc(30 + Math.random() * 70, 30 + Math.random() * 80, 2 + Math.random() * 5, 0, Math.PI * 2);
			g.fill();
		}
		g.globalCompositeOperation = 'source-over';
		g.fillStyle = 'rgba(255,255,255,0.5)';
		g.fillRect(58, 104, 8, 22); // a drip
	} else {
		// Claw marks: three ragged gouges showing lighter wood.
		g.strokeStyle = 'rgba(255,255,255,0.9)';
		g.lineCap = 'round';
		for (let k = 0; k < 3; k++) {
			g.lineWidth = 6 - k;
			g.beginPath();
			g.moveTo(34 + k * 22, 14);
			g.bezierCurveTo(44 + k * 22, 50, 38 + k * 22, 80, 50 + k * 22, 116);
			g.stroke();
		}
	}
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.name = `Decal · ${kind}`;
	return tex;
}
