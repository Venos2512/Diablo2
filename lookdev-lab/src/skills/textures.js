// Procedural sprite textures for the skill VFX (canvas-drawn once, shared by every effect). Shapes follow the
// element language of art-direction/07: fire rolls (soft puffs, a flame flipbook), cold is sharp (shards),
// lightning is jagged (streaks), magic and holy are rings and runes, bone is a spike.
import * as THREE from 'three';

function canvasTexture(width, height, draw) {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	draw(canvas.getContext('2d'), width, height);
	const tex = new THREE.CanvasTexture(canvas);
	tex.colorSpace = THREE.SRGBColorSpace;
	return tex;
}

function rng(seed) {
	let s = seed;
	return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

function radial(g, x, y, r, stops) {
	const grad = g.createRadialGradient(x, y, 0, x, y, r);
	for (const [t, c] of stops) grad.addColorStop(t, c);
	g.fillStyle = grad;
	g.fillRect(x - r, y - r, r * 2, r * 2);
}

const glow = () => canvasTexture(64, 64, (g, s) => radial(g, s / 2, s / 2, s / 2, [[0, 'rgba(255,255,255,1)'], [0.2, 'rgba(255,255,255,0.7)'], [0.5, 'rgba(255,255,255,0.18)'], [1, 'rgba(255,255,255,0)']]));

/** Lumpy puff: overlapping soft blobs (smoke, flame body, poison cloud). */
const puff = () => canvasTexture(128, 128, (g, s) => {
	const r = rng(7);
	for (let i = 0; i < 16; i++) radial(g, s * (0.3 + r() * 0.4), s * (0.3 + r() * 0.4), s * (0.12 + r() * 0.2), [[0, 'rgba(255,255,255,0.32)'], [1, 'rgba(255,255,255,0)']]);
});

/** 4×4 flipbook of a licking flame tongue: a tapered body that sways, stretches upward and tears off at the tip. */
const flame = () => canvasTexture(256, 256, (g, size) => {
	const cell = size / 4;
	const ellipse = (x, y, rx, ry, a) => {
		g.save();
		g.translate(x, y);
		g.scale(1, ry / rx);
		const grad = g.createRadialGradient(0, 0, 0, 0, 0, rx);
		grad.addColorStop(0, `rgba(255,255,255,${a})`);
		grad.addColorStop(0.55, `rgba(255,255,255,${a * 0.55})`);
		grad.addColorStop(1, 'rgba(255,255,255,0)');
		g.fillStyle = grad;
		g.beginPath();
		g.arc(0, 0, rx, 0, Math.PI * 2);
		g.fill();
		g.restore();
	};
	for (let f = 0; f < 16; f++) {
		const ox = (f % 4) * cell;
		const oy = Math.floor(f / 4) * cell;
		const t = f / 15;
		g.save();
		g.beginPath();
		g.rect(ox, oy, cell, cell);
		g.clip();
		const steps = 14;
		for (let i = 0; i < steps; i++) {
			const k = i / (steps - 1); // 0 = base, 1 = tip
			const sway = Math.sin(k * 3.2 + t * 7) * 0.13 * k + Math.sin(k * 7 + t * 13) * 0.03;
			const x = ox + cell * (0.5 + sway);
			const y = oy + cell * (0.76 - k * (0.5 + t * 0.1));
			const rx = cell * 0.15 * (1 - k * 0.72) * (1 - t * 0.3);
			// The tip tears off into a separate tongue late in the cycle.
			const gap = t > 0.45 && k > 0.62 && k < 0.72 ? 0.15 : 1;
			const a = 0.5 * (1 - k * 0.5) * (1 - t * 0.55) * gap;
			ellipse(x, y, Math.max(1, rx), Math.max(1, rx * 1.5), a);
		}
		g.restore();
	}
});

const ring = () => canvasTexture(128, 128, (g, s) => {
	const grad = g.createRadialGradient(s / 2, s / 2, s * 0.28, s / 2, s / 2, s / 2);
	grad.addColorStop(0, 'rgba(255,255,255,0)');
	grad.addColorStop(0.72, 'rgba(255,255,255,1)');
	grad.addColorStop(0.82, 'rgba(255,255,255,0.6)');
	grad.addColorStop(1, 'rgba(255,255,255,0)');
	g.fillStyle = grad;
	g.fillRect(0, 0, s, s);
});

/** Rune circle for auras and casting circles: two rings, tick marks and angular glyphs. */
const runes = () => canvasTexture(256, 256, (g, s) => {
	const c = s / 2;
	g.strokeStyle = 'rgba(255,255,255,0.95)';
	g.lineCap = 'round';
	g.shadowColor = 'white';
	g.shadowBlur = 6;
	g.lineWidth = 3;
	for (const r of [0.47, 0.36]) {
		g.beginPath();
		g.arc(c, c, s * r, 0, Math.PI * 2);
		g.stroke();
	}
	const rand = rng(23);
	g.lineWidth = 2.2;
	const glyphs = 12;
	for (let i = 0; i < glyphs; i++) {
		const a = (i / glyphs) * Math.PI * 2;
		g.save();
		g.translate(c + Math.cos(a) * s * 0.415, c + Math.sin(a) * s * 0.415);
		g.rotate(a + Math.PI / 2);
		g.beginPath();
		const h = s * 0.04;
		const strokes = 2 + Math.floor(rand() * 3);
		for (let k = 0; k < strokes; k++) {
			const x0 = (rand() - 0.5) * h * 1.6;
			const y0 = (rand() - 0.5) * h * 2;
			g.moveTo(x0, y0);
			g.lineTo(x0 + (rand() - 0.5) * h * 1.6, y0 + (rand() - 0.5) * h * 2);
		}
		g.stroke();
		g.restore();
	}
	// Inner star.
	g.lineWidth = 1.6;
	g.beginPath();
	for (let i = 0; i <= 6; i++) {
		const a = (i * 2 * Math.PI * 2) / 6 - Math.PI / 2;
		const x = c + Math.cos(a) * s * 0.33;
		const y = c + Math.sin(a) * s * 0.33;
		if (i) g.lineTo(x, y);
		else g.moveTo(x, y);
	}
	g.stroke();
});

/** Streak for stretched billboards: quarks maps u = 0 to the particle (head) and u = 1 to the tail behind it. */
const streak = () => canvasTexture(64, 16, (g, w, h) => {
	const grad = g.createLinearGradient(0, 0, w, 0);
	grad.addColorStop(0, 'rgba(255,255,255,0)');
	grad.addColorStop(0.12, 'rgba(255,255,255,1)');
	grad.addColorStop(0.35, 'rgba(255,255,255,0.9)');
	grad.addColorStop(1, 'rgba(255,255,255,0)');
	g.fillStyle = grad;
	g.fillRect(0, 0, w, h);
	g.globalCompositeOperation = 'destination-in';
	const v = g.createLinearGradient(0, 0, 0, h);
	v.addColorStop(0, 'rgba(0,0,0,0)');
	v.addColorStop(0.5, 'rgba(0,0,0,1)');
	v.addColorStop(1, 'rgba(0,0,0,0)');
	g.fillStyle = v;
	g.fillRect(0, 0, w, h);
});

/** Ice shard: a hard-edged elongated diamond with a bright spine (cold reads as sharp, not soft). Long axis on u, so it also works stretched. */
const shard = () => canvasTexture(64, 64, (g, s) => {
	g.translate(s / 2, s / 2);
	g.rotate(Math.PI / 2);
	g.beginPath();
	g.moveTo(0, -s * 0.48);
	g.lineTo(s * 0.12, 0);
	g.lineTo(0, s * 0.48);
	g.lineTo(-s * 0.12, 0);
	g.closePath();
	g.fillStyle = 'rgba(255,255,255,0.55)';
	g.fill();
	g.strokeStyle = 'rgba(255,255,255,1)';
	g.lineWidth = 1.5;
	g.stroke();
	g.beginPath();
	g.moveTo(0, -s * 0.45);
	g.lineTo(0, s * 0.45);
	g.stroke();
});

/** Ivory spike for bone skills. */
const bone = () => canvasTexture(64, 64, (g, s) => {
	g.translate(s / 2, s / 2);
	const grad = g.createLinearGradient(-s * 0.1, 0, s * 0.1, 0);
	grad.addColorStop(0, 'rgba(255,255,255,0.35)');
	grad.addColorStop(0.5, 'rgba(255,255,255,1)');
	grad.addColorStop(1, 'rgba(255,255,255,0.35)');
	g.fillStyle = grad;
	g.beginPath();
	g.moveTo(0, -s * 0.48);
	g.quadraticCurveTo(s * 0.11, -s * 0.05, s * 0.07, s * 0.42);
	g.lineTo(-s * 0.07, s * 0.42);
	g.quadraticCurveTo(-s * 0.11, -s * 0.05, 0, -s * 0.48);
	g.fill();
});

/** Beam cross-section: constant along u, a hot core fading out across v (lightning ribbons). */
const beam = () => canvasTexture(8, 64, (g, w, h) => {
	const grad = g.createLinearGradient(0, 0, 0, h);
	grad.addColorStop(0, 'rgba(255,255,255,0)');
	grad.addColorStop(0.35, 'rgba(255,255,255,0.25)');
	grad.addColorStop(0.5, 'rgba(255,255,255,1)');
	grad.addColorStop(0.65, 'rgba(255,255,255,0.25)');
	grad.addColorStop(1, 'rgba(255,255,255,0)');
	g.fillStyle = grad;
	g.fillRect(0, 0, w, h);
});

let cache = null;

/** All skill textures, created on first use. */
export function skillTextures() {
	cache ??= { glow: glow(), puff: puff(), flame: flame(), ring: ring(), runes: runes(), streak: streak(), shard: shard(), bone: bone(), beam: beam() };
	return cache;
}
