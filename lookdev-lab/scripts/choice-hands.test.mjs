// Class select (src/env/choiceHands.js, assets/choice-hands): the slot table against the canon, the arm geometry, the poses and the camera, the prepared GLBs. No browser.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import * as C from '../src/env/choiceHands.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} vs ${b}`);

test('six slots in the canon order PB FL OS BR EX PS with the canon lines', () => {
	assert.deepEqual(C.SLOTS.map((s) => s.id), ['PB', 'FL', 'OS', 'BR', 'EX', 'PS']);
	const quotes = {
		PB: 'Lift with the legs. And with the heart.',
		FL: 'Pain is the only prayer that never lies.',
		OS: "Only borrowing, love. We'll put them back.",
		BR: 'Salt keeps. Salt cleans. Salt kills. Mind which you ask for.',
		EX: 'Keep your light low. The things worth killing see better than you.',
		PS: "Sing, so they don't go frightened.",
	};
	for (const s of C.SLOTS) assert.equal(s.quote, quotes[s.id], s.id);
	assert.deepEqual(C.SLOTS.map((s) => s.name), ['Pallbearer', 'Flagellant', 'Ossuarist', 'Brinecaller', 'Exhumer', 'Pyre-Singer']);
});

test('PB OS BR show the back of the hand, FL EX PS the palm (Hero Concept §10); PB EX PS are stand-ins of a model with the same pose', () => {
	const pose = Object.fromEntries(C.SLOTS.map((s) => [s.id, s.pose]));
	assert.deepEqual(pose, { PB: 'back', FL: 'palm', OS: 'back', BR: 'back', EX: 'palm', PS: 'palm' });
	for (const s of C.SLOTS) {
		const model = C.HAND_MODELS[s.source];
		assert.ok(model, `${s.id}: model ${s.source}`);
		if (s.standIn) {
			assert.equal(s.file, null, `${s.id} stand-in has no file of its own`);
			assert.ok(s.tint, `${s.id} stand-in is tinted`);
			// the stand-in clones a hand drawn in the same pose
			const donor = C.SLOTS.find((d) => !d.standIn && d.source === s.source);
			assert.ok(donor, `${s.id}: a real ${s.source} hand exists`);
			assert.equal(donor.pose, s.pose, `${s.id} borrows the pose of ${donor.id}`);
		} else assert.equal(s.file, model.file, `${s.id} uses the model's file`);
	}
	assert.deepEqual(C.SLOTS.filter((s) => s.standIn).map((s) => s.id), ['PB', 'EX', 'PS']);
});

test('the six tips sit on an arc round the candle: outer hands high and far, middle hands low and near, left-right mirrored', () => {
	const tips = C.SLOTS.map((s) => s.tip);
	for (let i = 0; i < 3; i++) {
		near(tips[i][0], -tips[5 - i][0]);
		near(tips[i][1], tips[5 - i][1]);
		near(C.SLOTS[i].a, -C.SLOTS[5 - i].a);
	}
	assert.ok(tips[0][1] > tips[1][1] && tips[1][1] > tips[2][1], 'rising outward on the left');
	assert.ok(Math.abs(tips[0][0]) > Math.abs(tips[1][0]) && Math.abs(tips[1][0]) > Math.abs(tips[2][0]));
	assert.ok(tips[2][0] < C.CANDLE.x && tips[3][0] > C.CANDLE.x, 'the candle is between hands 3 and 4');
	for (const t of tips) assert.ok(Math.abs(t[0]) < C.WALL.width / 2 - 0.4 && t[1] > 0.2 && t[1] < C.WALL.cy + C.WALL.height / 2 - 0.4, 'inside the wall');
});

test('arm geometry: the arm axis crosses the wall plane at the hole, the visible length is ARM.visible, the sleeve end is behind the wall', () => {
	for (const s of C.SLOTS) {
		const g = C.armGeometry(s);
		near(g.entry.z, 0, 1e-9);
		near(g.dir.length(), 1);
		near(g.tip.distanceTo(g.entry), C.ARM.visible, 1e-9);
		assert.ok(g.dir.z > 0.52 && g.dir.z < 0.68, `${s.id} leans out of the wall by ${s.phi} deg (30-50 deg like the key art)`);
		assert.ok(s.phi >= 30 && s.phi <= 50);
		assert.ok(g.sleeveEnd.z < 0, `${s.id}: the sleeve end is behind the wall (${g.sleeveEnd.z.toFixed(3)})`);
		assert.ok(g.tip.z > 0.17 && g.tip.z < 0.24, `${s.id}: fingertips ${g.tip.z.toFixed(3)} m off the wall`);
		near(g.back, C.HAND_LENGTH - C.ARM.visible, 1e-9);
		assert.ok(g.wrist.distanceTo(g.entry) < C.ARM.visible, `${s.id}: the wrist is inside the visible part`);
	}
});

test('hand scale: the tips stay where the table puts them, the arm lengthens about the hole', () => {
	for (const s of C.SLOTS) {
		const a = C.armGeometry(s);
		const b = C.armGeometry(s, { scale: 1.2 });
		near(b.entry.z, 0, 1e-9);
		near(b.tip.x, a.tip.x, 1e-9);
		near(b.tip.y, a.tip.y, 1e-9);
		near(b.tip.distanceTo(b.entry), C.ARM.visible * 1.2, 1e-9);
		assert.ok(b.sleeveEnd.z < 0);
	}
});

test('orientation: local +z is the forearm, local +y the back of the hand; the offer turns the palm to the viewer (back hands) / up (palm hands)', () => {
	const view = new THREE.Vector3(0, 0.3, 1).normalize();
	for (const s of C.SLOTS) {
		const g = C.armGeometry(s);
		const z = new THREE.Vector3(0, 0, 1).applyQuaternion(g.qIdle);
		const y = new THREE.Vector3(0, 1, 0).applyQuaternion(g.qIdle);
		near(z.distanceTo(g.dir), 0, 1e-6);
		near(y.dot(g.dir), 0, 1e-6);
		if (s.pose === 'back') assert.ok(y.dot(view) > 0.5, `${s.id}: the back faces the viewer at rest`);
		else assert.ok(y.dot(view) < -0.3, `${s.id}: the palm faces the viewer at rest`);
		const zr = new THREE.Vector3(0, 0, 1).applyQuaternion(g.qReach);
		near(zr.distanceTo(g.dirReach), 0, 1e-6);
		assert.ok(g.palmReach.y > 0.8 && g.palmReach.z > 0.1, `${s.id}: palm up and a little toward the viewer when offered (a back-up hand turns over)`);
		assert.ok(Math.sign(g.palmReach.x) === -Math.sign(s.tip[0]), `${s.id}: ... and turned inward`);
		assert.ok(g.dirReach.z > 0.85 && g.dirReach.y < -0.2, `${s.id}: the offered arm points at the viewer, a little down`);
		// the reached arm swings toward the screen centre
		assert.ok(Math.sign(g.dirReach.x) === -Math.sign(s.tip[0]) || g.dirReach.x === 0);
	}
});

test('armPose: rest = identity pose, reached = slide ARM.slide with the reach orientation, retracted keeps the fingertips out', () => {
	for (const s of C.SLOTS) {
		const g = C.armGeometry(s);
		const rest = C.armPose(s, g, {});
		near(rest.slide, 0);
		assert.ok(rest.quat.angleTo(g.qIdle) < 1e-6);
		const out = C.armPose(s, g, { reach: 1 });
		near(out.slide, C.ARM.slide);
		assert.ok(out.quat.angleTo(g.qReach) < 1e-6);
		assert.ok(Math.abs(out.wrist) > 0.1 && Math.abs(out.wrist) < 0.3, 'a wrist bend of 9-13 deg');
		const sunk = C.armPose(s, g, { retract: 1 });
		assert.ok(sunk.slide < -0.15, `${s.id} slides back ${sunk.slide.toFixed(3)} m`);
		assert.ok(C.ARM.visible + sunk.slide >= 0.04 - 1e-9, `${s.id}: at least 4 cm of the hand stays out`);
		const hov = C.armPose(s, g, { hover: 1 });
		near(hov.slide, C.ARM.hoverSlide);
		const turned = hov.quat.angleTo(g.qIdle);
		assert.ok(turned > 0.02 && turned < g.qIdle.angleTo(g.qReach) * 0.2, `a hovered hand only turns a little (${turned.toFixed(3)} rad)`);
	}
});

test('easings: out-back settles on 1 after a small overshoot, in-out-cubic is monotone, damp is framerate independent', () => {
	near(C.easeOutBack(0), 0);
	near(C.easeOutBack(1), 1);
	let max = 0;
	for (let t = 0; t <= 1; t += 0.01) max = Math.max(max, C.easeOutBack(t));
	assert.ok(max > 1.02 && max < 1.07, `overshoot ${max}`);
	let prev = -1;
	for (let t = 0; t <= 1; t += 0.01) {
		const v = C.easeInOutCubic(t);
		assert.ok(v >= prev);
		prev = v;
	}
	let a = 0;
	let b = 0;
	for (let i = 0; i < 60; i++) a = C.damp(a, 1, 4, 1 / 60);
	for (let i = 0; i < 30; i++) b = C.damp(b, 1, 4, 1 / 30);
	near(a, b, 1e-9);
});

test('camera: home at p = 0, in front of the offered hand at p = 1 looking at it', () => {
	const g = C.armGeometry(C.SLOTS[3]);
	const home = C.cameraPose(g, 0);
	near(home.position.distanceTo(new THREE.Vector3(...C.FRAME.position)), 0, 1e-9);
	near(home.target.distanceTo(new THREE.Vector3(...C.FRAME.target)), 0, 1e-9);
	const offer = C.cameraPose(g, 1);
	assert.ok(offer.position.z > g.handReach.z + 0.7, 'the camera is in front of the hand');
	assert.ok(offer.position.distanceTo(g.handReach) > 1.0 && offer.position.distanceTo(g.handReach) < 1.8, `distance ${offer.position.distanceTo(g.handReach).toFixed(2)}`);
	assert.ok(offer.target.distanceTo(g.handReach) < 0.12);
	const light = C.reachLight(g);
	assert.ok(light.z > g.handReach.z && light.distanceTo(g.handReach) < 0.8, 'the candle light stands in front of the offered hand');
});

test('candle level stays near 1 and never goes dark', () => {
	let lo = 9;
	let hi = 0;
	for (let t = 0; t < 120; t += 0.05) {
		const v = C.candleLevel(t, 3.1);
		lo = Math.min(lo, v);
		hi = Math.max(hi, v);
	}
	assert.ok(lo > 0.55 && hi < 1.4, `${lo.toFixed(2)} .. ${hi.toFixed(2)}`);
});

test('captions: stand-ins say so', () => {
	assert.match(C.captionFor(C.SLOTS[0]).tag, /stand-in/);
	assert.equal(C.captionFor(C.SLOTS[1]).tag, '');
});


// ---- the optional finger rig -------------------------------------------------------------------------------------------------------
/** A fake hand: bones named like the table (some with other separators / case), each finger a chain of three, rest orientation = identity. */
function fakeHand(skip = []) {
	const root = new THREE.Group();
	const fix = (n) => n.replace('_', '.').replace(/^./, (c) => c.toUpperCase()); // Index.01 : must still match index_01
	for (const [finger, names] of Object.entries(C.FINGER_BONES.fingers)) {
		let parent = root;
		names.forEach((n) => {
			const b = new THREE.Bone();
			b.name = fix(n);
			if (skip.includes(n)) b.name = 'twist_' + n; // not the name we look for
			b.position.z = 0.03;
			parent.add(b);
			parent = b;
		});
	}
	const w = new THREE.Bone();
	w.name = 'WRIST';
	root.add(w);
	return root;
}

test('finger poses: the offered hand is flatter than relaxed, the grip closes more than relaxed, all monotone in the weights', () => {
	for (const f of Object.keys(C.FINGER_POSES)) {
		const relaxed = C.fingerAngles(f, 0, 0);
		const open = C.fingerAngles(f, 1, 0);
		const grip = C.fingerAngles(f, 0, 1);
		const both = C.fingerAngles(f, 1, 1);
		for (let k = 0; k < 3; k++) {
			assert.ok(open.curl[k] < relaxed.curl[k], `${f} segment ${k}: the offered hand is flatter (${open.curl[k]} < ${relaxed.curl[k]})`);
			assert.ok(grip.curl[k] > relaxed.curl[k] + 10, `${f} segment ${k}: the fist closes`);
			near(both.curl[k], grip.curl[k], 1e-9); // grip wins over offer
		}
		let prev = -1e9;
		for (let g = 0; g <= 1; g += 0.1) {
			const v = C.fingerAngles(f, 0.5, g).curl[1];
			assert.ok(v >= prev - 1e-9);
			prev = v;
		}
		assert.ok(C.fingerAngles(f, 1, 0).spread > C.fingerAngles(f, 0, 0).spread || f === 'pinky' || f === 'ring', `${f} fans out when offered`);
	}
	assert.ok(C.fingerAngles('pinky', 1, 0).spread < 0, 'the little finger fans away from the thumb');
});

test('finger rig: finds bones by lenient names, skips missing ones, never accumulates, a static hand has no rig', () => {
	const hand = fakeHand();
	const rig = C.createFingerRig(hand);
	assert.equal(rig.found.length, 15);
	assert.equal(rig.missing.length, 0);
	assert.ok(rig.hasFingers && rig.hasWrist && !rig.hasRoot);
	const idx2 = hand.getObjectByName('Index.02');
	rig.apply(0, 0);
	const a = C.fingerAngles('index', 0, 0);
	near(idx2.quaternion.angleTo(new THREE.Quaternion()), a.curl[1] * Math.PI / 180, 1e-6);
	rig.apply(0, 0);
	rig.apply(0, 0);
	near(idx2.quaternion.angleTo(new THREE.Quaternion()), a.curl[1] * Math.PI / 180, 1e-6); // idempotent
	// the curl axis is local +x: a bone rotated +x by a positive angle turns +z toward -y (the palm)
	const z = new THREE.Vector3(0, 0, 1).applyQuaternion(idx2.quaternion);
	assert.ok(z.y < 0 && Math.abs(z.x) < 1e-9, 'positive curl moves the fingertip toward the palm (-y)');
	rig.apply(0, 1);
	assert.ok(idx2.quaternion.angleTo(new THREE.Quaternion()) > 1.3, 'a fist: 88 deg');
	rig.apply(0, 0);
	// missing bones: three finger bones renamed away
	const part = C.createFingerRig(fakeHand(['index_01', 'index_02', 'pinky_03']));
	assert.equal(part.found.length, 12);
	assert.deepEqual(part.missing.sort(), ['index_01', 'index_02', 'pinky_03']);
	part.apply(1, 0); // does not throw
	// no bones at all
	const none = C.createFingerRig(new THREE.Group());
	assert.ok(!none.hasFingers);
	none.apply(1, 1);
});

test('finger rig keeps the rest orientation of each bone (a rest rotated 90 deg about z is respected)', () => {
	const hand = fakeHand();
	const bone = hand.getObjectByName('Middle.01');
	bone.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
	const rest = bone.quaternion.clone();
	const rig = C.createFingerRig(hand);
	rig.apply(0, 0);
	const a = C.fingerAngles('middle', 0, 0);
	const delta = rest.clone().invert().multiply(bone.quaternion); // the local delta applied on top of the rest
	assert.ok(delta.angleTo(new THREE.Quaternion()) > 0.2 && delta.angleTo(new THREE.Quaternion()) < 0.5, `delta ${delta.angleTo(new THREE.Quaternion())} rad ~ curl ${a.curl[0]} deg`);
});


/** A Blender-style hand: every bone's local +Y runs ALONG the bone (the glTF export of a Blender armature), with an arbitrary roll about it; chains nest parent -> child. */
function blenderHand(roll) {
	const root = new THREE.Group();
	const x0 = { thumb: -0.04, index: -0.025, middle: -0.005, ring: 0.015, pinky: 0.033 };
	const toZ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2); // local +Y -> hand +Z
	for (const [finger, names] of Object.entries(C.FINGER_BONES.fingers)) {
		let parent = root;
		names.forEach((n, k) => {
			const b = new THREE.Bone();
			b.name = n;
			if (k === 0) {
				b.position.set(x0[finger], 0.01, 0.2);
				b.quaternion.copy(toZ).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), roll));
			} else {
				b.position.set(0, 0.04, 0); // along the parent's local +Y
				b.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.1 * k);
			}
			parent.add(b);
			parent = b;
		});
	}
	return root;
}
const chainDir = (hand, finger, a, b) => {
	hand.updateMatrixWorld(true);
	const pa = new THREE.Vector3().setFromMatrixPosition(hand.getObjectByName(`${finger}_0${a}`).matrixWorld);
	const pb = new THREE.Vector3().setFromMatrixPosition(hand.getObjectByName(`${finger}_0${b}`).matrixWorld);
	return pb.sub(pa).normalize();
};

test('finger rig on a Blender-style skeleton (local +Y along the bone, any roll): curl goes toward the palm, spread across, identical in the world for every roll', () => {
	const results = [];
	for (const roll of [0, 0.65, Math.PI / 2, -2.1, 3.0]) {
		const hand = blenderHand(roll);
		const rig = C.createFingerRig(hand);
		assert.equal(rig.found.length, 15);
		// derived axes: curl in the hand frame is +x, spread +y, whatever the roll
		const ib = rig.bones.find((b) => b.finger === 'index' && b.seg === 0);
		assert.ok(ib.curlH.distanceTo(new THREE.Vector3(1, 0, 0)) < 1e-6, `curl axis in the hand frame (${ib.curlH.toArray()})`);
		assert.ok(ib.spreadH.distanceTo(new THREE.Vector3(0, 1, 0)) < 1e-6);
		rig.apply(0, 0);
		const rest = chainDir(hand, 'index', 1, 2);
		rig.apply(0, 1);
		const fist = chainDir(hand, 'index', 1, 2);
		assert.ok(fist.y < rest.y - 0.5, `the fist curls the finger toward the palm (-y): rest ${rest.y.toFixed(2)} -> ${fist.y.toFixed(2)}`);
		rig.apply(1, 0);
		const open = chainDir(hand, 'pinky', 1, 2);
		const openIndex = chainDir(hand, 'index', 1, 2);
		assert.ok(open.x < openIndex.x, 'the little finger fans toward -x, the index toward +x');
		rig.apply(0, 1);
		results.push([...chainDir(hand, 'middle', 2, 3).toArray(), ...fist.toArray()]);
	}
	for (const r of results) for (let i = 0; i < r.length; i++) assert.ok(Math.abs(r[i] - results[0][i]) < 1e-6, 'the same world pose for every roll');
});

test('finger rig sign check: a skeleton whose chain runs along -z (a hand built the other way round) still curls toward the palm', () => {
	const hand = fakeHand();
	hand.traverse((o) => o.isBone && o.name !== 'WRIST' && (o.position.z *= -1)); // chains run toward -z
	const rig = C.createFingerRig(hand);
	const i1 = rig.bones.find((b) => b.finger === 'index' && b.seg === 0);
	const turned = i1.along.clone().applyAxisAngle(i1.curlH, 5 * Math.PI / 180);
	assert.ok(turned.y < i1.along.y, 'a positive curl still moves the tip toward -y (the palm)');
});

// ---- the prepared assets ------------------------------------------------------------------------------------------------------------
function glbJson(file) {
	const buf = readFileSync(file);
	assert.equal(buf.readUInt32LE(0), 0x46546c67, 'glTF magic');
	const len = buf.readUInt32LE(12);
	return JSON.parse(buf.subarray(20, 20 + len).toString('utf8'));
}

test('the three hand GLBs: 0.45 m long, pivot at the sleeve end (z = 0), fingers +z, a sleeve extension behind, JPEG textures, registered', () => {
	const samples = JSON.parse(readFileSync(path.join(root, 'src/assets/samples.json'), 'utf8')).assets;
	for (const [key, m] of Object.entries(C.HAND_MODELS)) {
		const entry = samples.find((a) => a.id === m.file);
		assert.ok(entry, `${m.file} registered in samples.json`);
		assert.equal(entry.file, `choice-hands/${m.file}.glb`);
		const file = path.join(root, 'assets', entry.file);
		assert.ok(existsSync(file), file);
		const j = glbJson(file);
		const hand = j.meshes.find((x) => x.name === 'hand') ?? j.meshes[0];
		const ext = j.meshes.find((x) => x.name === 'sleeve_ext');
		assert.ok(ext, `${key}: sleeve extension mesh`);
		const box = (mesh) => j.accessors[mesh.primitives[0].attributes.POSITION];
		const hb = box(hand);
		near(hb.max[2], C.HAND_LENGTH, 0.002);
		assert.ok(hb.min[2] > -0.01 && hb.min[2] < 0.02, `${key}: the sleeve end is at z = ${hb.min[2]}`);
		assert.ok(Math.abs(hb.min[0]) < 0.2 && Math.abs(hb.max[0]) < 0.25, `${key}: width`);
		const eb = box(ext);
		assert.ok(eb.min[2] < -0.55 && eb.max[2] > 0.03 && eb.max[2] < 0.08, `${key}: extension z ${eb.min[2]}..${eb.max[2]}`);
		assert.ok(j.images.every((im) => im.mimeType === 'image/jpeg'), `${key}: JPEG textures`);
		assert.equal(j.skins, undefined, 'static, no skin');
		assert.equal(hand.primitives.length, 1);
		// the sleeve extension is wider than the sleeve is thick: its ring radius matches HAND_MODELS.sleeve to ~15 %
		const rx = (eb.max[0] - eb.min[0]) / 2;
		assert.ok(Math.abs(rx - m.sleeve[0]) < 0.2 * m.sleeve[0] + 0.006 || Math.abs((eb.max[1] - eb.min[1]) / 2 - m.sleeve[1]) < 0.2 * m.sleeve[1] + 0.006, `${key}: extension radii ${rx} vs ${m.sleeve}`);
	}
	for (const id of ['choice-wall-a', 'choice-wall-a-n', 'choice-wall-a-h']) {
		const e = samples.find((a) => a.id === id);
		assert.ok(e && e.kind === 'texture' && existsSync(path.join(root, 'assets', e.file)), id);
	}
	const lic = readFileSync(path.join(root, 'THIRD_PARTY_LICENSES.md'), 'utf8');
	assert.ok(lic.includes('choice-hands-v1:start'), 'credited in THIRD_PARTY_LICENSES.md');
});

test('wall: tile A in the lit middle, tile B in the dim ring, a smooth cross-fade between; the baked maps have the right values', () => {
	assert.equal(C.wallBlend(0, 0.5), 0);
	assert.equal(C.wallBlend(0.3, 0.3), 0);
	assert.equal(C.wallBlend(1.7, 1.9), 1);
	assert.equal(C.wallBlend(-1.8, 0.2), 1);
	// a path from the centre outward: never jumps by more than 0.12 between samples 2 cm apart (no border, a cross-fade)
	let prev = C.wallBlend(0, 0.55);
	for (let x = 0.02; x < 1.9; x += 0.02) {
		const w = C.wallBlend(x, 0.55);
		assert.ok(Math.abs(w - prev) < 0.12, `jump ${Math.abs(w - prev)} at x = ${x}`);
		prev = w;
	}
	const solid = (rgb, size = 8) => ({ data: Uint8ClampedArray.from({ length: size * size * 4 }, (_, i) => (i % 4 === 3 ? 255 : rgb[i % 4])), width: size, height: size });
	const tile = (albedo, normal, height) => ({ albedo: solid(albedo), normal: solid(normal), height: solid(height) });
	const tiles = { a: tile([200, 20, 20], [128, 128, 255], [50, 50, 50]), b: tile([20, 20, 200], [255, 128, 128], [240, 240, 240]) };
	const W = 64;
	const H = 40;
	const out = { albedo: new Uint8Array(W * H * 4), normal: new Uint8Array(W * H * 4), height: new Uint8Array(W * H * 4) };
	C.composeWallRows(out, tiles, W, H, 0, H);
	const px = (arr, i, r) => [...arr.subarray((r * W + i) * 4, (r * W + i) * 4 + 4)];
	const centreRow = Math.round(((0.55 - (C.WALL.cy - C.WALL.height / 2)) / C.WALL.height) * H);
	assert.deepEqual(px(out.albedo, W / 2, centreRow).slice(0, 3).map(Math.round), [200, 20, 20], 'centre = tile A');
	assert.deepEqual(px(out.albedo, 0, H - 1).slice(0, 3).map(Math.round), [20, 20, 200], 'top-left corner = tile B');
	assert.equal(px(out.height, W / 2, centreRow)[0], 50);
	const n = px(out.normal, W / 2, centreRow);
	assert.ok(Math.abs(n[2] - 255) <= 1 && Math.abs(n[0] - 128) <= 1, 'tile A normal kept');
	// every baked normal is a unit vector (the cross-fade renormalises)
	for (let i = 0; i < W; i += 3) {
		for (let r = 0; r < H; r += 3) {
			const [x, y, z] = px(out.normal, i, r).map((v) => v / 127.5 - 1);
			assert.ok(Math.abs(Math.hypot(x, y, z) - 1) < 0.03, `normal length at ${i},${r}`);
		}
	}
});
