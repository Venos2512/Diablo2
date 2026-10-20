import assert from 'node:assert/strict';
import { test } from 'node:test';
import { grassHabitat, segmentDistance, PlacementGrid } from '../src/env/biomePlacement.js';

const meadow = { grass: 1, wet: 0.1, blood: 0, road: 10, trail: 10, creek: 10, slope: 0, blocked: false, access: false, quiet: false, patch: 0.8 };

test('painted grass cannot override paths, water, corruption, slopes or reserved approaches', () => {
	assert.ok(grassHabitat(meadow).density > 0);
	for (const exclusion of [{ road: 0 }, { trail: 0 }, { creek: 0 }, { wet: 1 }, { blood: 1 }, { slope: 1 }, { blocked: true }, { access: true }]) {
		for (const patch of [0, 0.5, 1]) assert.equal(grassHabitat({ ...meadow, ...exclusion, patch }).density, 0, JSON.stringify(exclusion));
	}
});

test('combat turf stays shorter and sparser; shoulders taper towards the path', () => {
	const open = grassHabitat(meadow), quiet = grassHabitat({ ...meadow, quiet: true });
	assert.ok(quiet.height < open.height && quiet.density < open.density);
	let previous = 0;
	for (const road of [1.7, 2, 2.5, 3, 4]) {
		const site = grassHabitat({ ...meadow, road });
		assert.ok(site.density >= previous);
		previous = site.density;
	}
});

test('habitat outputs stay bounded for the full paint range', () => {
	for (const grass of [0, 0.5, 1]) for (const wet of [0, 0.5, 1]) for (const blood of [0, 0.5, 1]) for (const patch of [0, 0.5, 1]) {
		for (const value of Object.values(grassHabitat({ ...meadow, grass, wet, blood, patch }))) assert.ok(Number.isFinite(value) && value >= 0 && value <= 1);
	}
});

test('spacing respects cell edges and negative world coordinates', () => {
	const grid = new PlacementGrid(0.2);
	assert.equal(grid.accept(-0.01, -0.01), true);
	assert.equal(grid.accept(0.01, 0.01), false);
	assert.equal(grid.accept(-0.2, -0.01), false);
	assert.equal(grid.accept(-0.22, -0.01), true);
	assert.equal(grid.accept(-0.22, -0.01), false);
});

test('approach distance clamps to segment ends, including a zero-length approach', () => {
	const a = { x: 0, z: 0 }, b = { x: 0, z: 4 };
	assert.equal(segmentDistance(3, 2, a, b), 3);
	assert.equal(segmentDistance(0, 5, a, b), 1);
	assert.equal(segmentDistance(3, 4, a, a), 5);
});
