// Small math helpers shared by the procedural characters (src/procedural, ported from the game's src/core/util.js).

export const TAU = Math.PI * 2;
export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;

// Seeded 2D / 3D simplex noise (Stefan Gustavson's reference implementation), output in about [-1, 1].
const GRAD3 = new Float32Array([1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1]);
const F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
const F3 = 1 / 3, G3 = 1 / 6;

export class Simplex {
	constructor(seed = 1) {
		// mulberry32 shuffle of 0..255
		let s = seed >>> 0 || 1;
		const rnd = () => {
			s = (s + 0x6d2b79f5) >>> 0;
			let t = s;
			t = Math.imul(t ^ (t >>> 15), t | 1);
			t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
		const p = new Uint8Array(256);
		for (let i = 0; i < 256; i++) p[i] = i;
		for (let i = 255; i > 0; i--) {
			const j = Math.floor(rnd() * (i + 1));
			const t = p[i];
			p[i] = p[j];
			p[j] = t;
		}
		this.perm = new Uint8Array(512);
		this.mod12 = new Uint8Array(512);
		for (let i = 0; i < 512; i++) {
			this.perm[i] = p[i & 255];
			this.mod12[i] = this.perm[i] % 12;
		}
	}

	noise2(x, y) {
		const { perm, mod12 } = this;
		const s = (x + y) * F2;
		const i = Math.floor(x + s), j = Math.floor(y + s);
		const t = (i + j) * G2;
		const x0 = x - (i - t), y0 = y - (j - t);
		const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
		const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
		const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
		const ii = i & 255, jj = j & 255;
		let n = 0;
		let t0 = 0.5 - x0 * x0 - y0 * y0;
		if (t0 > 0) {
			const g = mod12[ii + perm[jj]] * 3;
			t0 *= t0;
			n += t0 * t0 * (GRAD3[g] * x0 + GRAD3[g + 1] * y0);
		}
		let t1 = 0.5 - x1 * x1 - y1 * y1;
		if (t1 > 0) {
			const g = mod12[ii + i1 + perm[jj + j1]] * 3;
			t1 *= t1;
			n += t1 * t1 * (GRAD3[g] * x1 + GRAD3[g + 1] * y1);
		}
		let t2 = 0.5 - x2 * x2 - y2 * y2;
		if (t2 > 0) {
			const g = mod12[ii + 1 + perm[jj + 1]] * 3;
			t2 *= t2;
			n += t2 * t2 * (GRAD3[g] * x2 + GRAD3[g + 1] * y2);
		}
		return 70 * n;
	}

	noise3(x, y, z) {
		const { perm, mod12 } = this;
		const s = (x + y + z) * F3;
		const i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s);
		const t = (i + j + k) * G3;
		const x0 = x - (i - t), y0 = y - (j - t), z0 = z - (k - t);
		let i1, j1, k1, i2, j2, k2;
		if (x0 >= y0) {
			if (y0 >= z0) [i1, j1, k1, i2, j2, k2] = [1, 0, 0, 1, 1, 0];
			else if (x0 >= z0) [i1, j1, k1, i2, j2, k2] = [1, 0, 0, 1, 0, 1];
			else [i1, j1, k1, i2, j2, k2] = [0, 0, 1, 1, 0, 1];
		} else if (y0 < z0) [i1, j1, k1, i2, j2, k2] = [0, 0, 1, 0, 1, 1];
		else if (x0 < z0) [i1, j1, k1, i2, j2, k2] = [0, 1, 0, 0, 1, 1];
		else [i1, j1, k1, i2, j2, k2] = [0, 1, 0, 1, 1, 0];
		const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
		const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3;
		const x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3;
		const ii = i & 255, jj = j & 255, kk = k & 255;
		const corner = (tt, gi, cx, cy, cz) => {
			if (tt <= 0) return 0;
			const g = gi * 3;
			tt *= tt;
			return tt * tt * (GRAD3[g] * cx + GRAD3[g + 1] * cy + GRAD3[g + 2] * cz);
		};
		const n0 = corner(0.6 - x0 * x0 - y0 * y0 - z0 * z0, mod12[ii + perm[jj + perm[kk]]], x0, y0, z0);
		const n1 = corner(0.6 - x1 * x1 - y1 * y1 - z1 * z1, mod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]], x1, y1, z1);
		const n2 = corner(0.6 - x2 * x2 - y2 * y2 - z2 * z2, mod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]], x2, y2, z2);
		const n3 = corner(0.6 - x3 * x3 - y3 * y3 - z3 * z3, mod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]], x3, y3, z3);
		return 32 * (n0 + n1 + n2 + n3);
	}
}
