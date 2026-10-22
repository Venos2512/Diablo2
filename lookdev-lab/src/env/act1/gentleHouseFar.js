// ASHLAR · Act I base maps — the far Gentle House (N-GH) as real models, shared by the outdoor maps that see it across the fens (lychgate, fens).
// Def frame of the old 'compound' blockout ([46, 20, 30], front = +z): the A18.4 ward range at the back of the court, a run of A18.5 wall-with-niche sections
// round the court (6 m each, never stretched), and the A11.4 gate tower that has no model yet (kept as its blockout box + cone). The warm, still high window
// is the A18.4 model's own lit window (GLB frame (2.1, 5.8, 3.9), docs ACT1_EXTRAS_FIT.md): the far glow anchor sits just in front of its glass.
// outdoorBuild.buildFar draws `composite` when every part's GLB loaded; otherwise the def's full 'compound' blockout (with its own window anchor) stands in.

const RANGE = { x: 0, z: -10.5 }; // the A18.4 range (30 × 13.4 × 10.5 m), its long front to the court (+z)
const WALL = 'act1-a18-5-hospice-wall-niche';
const sections = (list, yaw) => list.map(([x, z]) => ({ model: WALL, x, z, yaw }));

export const GENTLE_HOUSE_FAR = Object.freeze({
	status: 'glb',
	model: 'act1-a18-4-hospice-range',
	composite: {
		label: 'A11.4 gate tower (no model yet)',
		parts: [
			{ model: 'act1-a18-4-hospice-range', x: RANGE.x, z: RANGE.z, yaw: 0 },
			...sections([-14, -8, -2, 4, 10, 16].map((x) => [x, 14.6]), 0), // the court's front wall, niches outward
			...sections([11.6, 5.6, -0.4].map((z) => [19.3, z]), 90), // east side (faces +x)
			...sections([3, -3].map((z) => [-20.3, z]), -90), // west side, from the gate tower back (faces −x)
		],
		shape: { kind: 'parts', parts: [['box', 6, 17, 6, { x: -20, z: 9, tone: 1.25 }], ['cone', 4.6, 3.2, { x: -20, z: 9, y: 16.95, tone: 0.8 }, 4]] },
	},
	anchors: [{ kind: 'window', p: [RANGE.x + 2.1, 5.8, RANGE.z + 4.2], n: [0, 0, 1], size: 2.0, still: true }],
});
