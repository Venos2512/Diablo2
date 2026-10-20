// Biome dressing policy, in world metres. Art direction 12 §4.6–4.12.
// Pure helpers shared by placement and its invariant checks; no renderer dependency.
export const BIOME_RULES = Object.freeze({
	roadClear: 1.7,
	trailClear: 0.65,
	creekClear: 1.15,
	maxWet: 0.72,
	maxBlood: 0.35,
	maxSlope: 0.65,
	rootSpacing: 0.18,
	propGap: 0.4,
	torchGap: 7,
});

const ramp = (a, b, x) => {
	const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
	return t * t * (3 - 2 * t);
};

export function segmentDistance(x, z, a, b) {
	const dx = b.x - a.x, dz = b.z - a.z;
	const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)));
	return Math.hypot(x - a.x - t * dx, z - a.z - t * dz);
}

/** Hard exclusions win even on a painted grass layer; quiet combat areas get short turf. */
export function grassHabitat({ grass, wet, blood, road, trail, creek, slope, blocked, access, quiet, patch }) {
	if (blocked || access || road < BIOME_RULES.roadClear || trail < BIOME_RULES.trailClear ||
		creek < BIOME_RULES.creekClear || wet >= BIOME_RULES.maxWet || blood >= BIOME_RULES.maxBlood || slope >= BIOME_RULES.maxSlope) {
		return { density: 0, height: 0, dry: 0 };
	}
	const shoulder = ramp(BIOME_RULES.roadClear, 3.2, road) * ramp(BIOME_RULES.trailClear, 1.5, trail);
	const density = ramp(0.25, 0.85, grass) * (1 - ramp(0.35, BIOME_RULES.maxWet, wet)) *
		(1 - ramp(0.15, BIOME_RULES.maxBlood, blood)) * (1 - ramp(0.3, BIOME_RULES.maxSlope, slope)) *
		(0.12 + 0.88 * ramp(0.32, 0.7, patch)) * (0.2 + 0.8 * shoulder) * (quiet ? 0.3 : 1);
	return { density, height: quiet ? 0.35 : 0.5 + 0.5 * shoulder, dry: (1 - wet) * (0.35 + 0.65 * patch) };
}

/** Minimum spacing without scanning every previously accepted tuft. */
export class PlacementGrid {
	constructor(spacing) { this.spacing = spacing; this.cells = new Map(); }
	accept(x, z) {
		const s = this.spacing, ix = Math.floor(x / s), iz = Math.floor(z / s);
		for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
			for (const p of this.cells.get(`${ix + dx},${iz + dz}`) ?? []) if (Math.hypot(x - p.x, z - p.z) < s) return false;
		}
		const key = `${ix},${iz}`;
		if (!this.cells.has(key)) this.cells.set(key, []);
		this.cells.get(key).push({ x, z });
		return true;
	}
}
