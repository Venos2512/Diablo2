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

test('the six holes follow the key art: left to right, the candle between hands 3 and 4, all inside the wall', () => {
	const e = C.SLOTS.map((s) => s.entry);
	for (let i = 1; i < 6; i++) assert.ok(e[i][0] > e[i - 1][0], 'left to right');
	assert.ok(e[2][0] < C.CANDLE.x && e[3][0] > C.CANDLE.x);
	for (const p of e) assert.ok(Math.abs(p[0]) < C.WALL.width / 2 - 0.4 && p[1] > 0.3 && p[1] < C.WALL.cy + C.WALL.height / 2 - 0.4, 'inside the wall');
	// the arms are not mirrored copies (the key art's are not): the middle two hands are the lowest, the outer ones the highest
	assert.ok(e[0][1] > e[2][1] && e[5][1] > e[3][1]);
});

test('KEY ART MARKERS: the projected hole, wrist joint and longest fingertip of every hand are within 0.03 of the measured points (either axis of the frame)', () => {
	for (const s of C.SLOTS) {
		const m = C.slotMarkers(s);
		const t = C.KEYART.hands[s.id];
		for (const k of ['sleeve', 'wrist', 'tip']) {
			assert.ok(Math.abs(m[k][0] - t[k][0]) <= 0.03 && Math.abs(m[k][1] - t[k][1]) <= 0.03, `${s.id} ${k}: got ${m[k].map((v) => v.toFixed(3))}, measured ${t[k]}`);
		}
	}
});

test('KEY ART CANDLE AND LEDGE: the flame, the wax and the dish of the scene project onto the measured points', () => {
	const K = C.CANDLE;
	const dish = C.projectToKeyArt(new THREE.Vector3(K.x, 0.004, K.z));
	const wax = C.projectToKeyArt(new THREE.Vector3(K.x, 0.1355 * K.scale, K.z));
	const flame = C.projectToKeyArt(new THREE.Vector3(K.x, (0.148 + 0.085 * 0.8) * K.scale, K.z)); // the flame billboard: bottom at the wick top, the visible tip at ~80 % of its height
	const edge = C.projectToKeyArt(new THREE.Vector3(0, 0, C.LEDGE.depth - 0.02));
	const ok = (a, b, what) => assert.ok(Math.abs(a[0] - b[0]) <= 0.03 && Math.abs(a[1] - b[1]) <= 0.03, `${what}: ${a.map((v) => v.toFixed(3))} vs ${b}`);
	ok(dish, C.KEYART.candle.dishBase, 'dish base');
	ok(wax, C.KEYART.candle.waxTop, 'wax top');
	ok(flame, C.KEYART.candle.flameTip, 'flame tip');
	assert.ok(Math.abs(edge[1] - C.KEYART.ledgeY) <= 0.03, `ledge line ${edge[1]}`);
	// the frame is 1.8 m wide at the wall: ~10 skulls of 0.18 m
	const w = C.projectToKeyArt(new THREE.Vector3(0.9, 0.4, 0))[0] - C.projectToKeyArt(new THREE.Vector3(-0.9, 0.4, 0))[0];
	assert.ok(Math.abs(w - 1) < 0.03, `1.8 m of wall spans ${w.toFixed(3)} of the frame`);
});

test('arm geometry: the arm axis crosses the wall plane at the hole, the visible length is the slot\'s, the sleeve end is behind the wall', () => {
	for (const s of C.SLOTS) {
		const g = C.armGeometry(s);
		near(g.entry.z, 0, 1e-9);
		near(g.dir.length(), 1);
		near(g.tip.distanceTo(g.entry), g.visible * g.scale, 1e-9);
		assert.ok(g.dir.z > 0.2 && g.dir.z < 0.6, `${s.id} leans out of the wall by ${s.phi} deg (the key art's arms lie 15-40 deg off the wall, fitted by the calibration)`);
		assert.ok(s.phi >= 15 && s.phi <= 60);
		assert.ok(g.sleeveEnd.z < 0, `${s.id}: the sleeve end is behind the wall (${g.sleeveEnd.z.toFixed(3)})`);
		assert.ok(g.tip.z > 0.06 && g.tip.z < 0.3, `${s.id}: fingertips ${g.tip.z.toFixed(3)} m off the wall`);
		near(g.back, C.HAND_LENGTH - g.visible, 1e-9);
		assert.ok(g.wrist.distanceTo(g.entry) < g.visible * g.scale, `${s.id}: the wrist is inside the visible part`);
	}
});

test('hand scale: the holes stay where the table puts them, the arm lengthens about the hole', () => {
	for (const s of C.SLOTS) {
		const a = C.armGeometry(s);
		const b = C.armGeometry(s, { scale: 1.2 });
		near(b.entry.z, 0, 1e-9);
		near(b.entry.x, a.entry.x, 1e-9);
		near(b.entry.y, a.entry.y, 1e-9);
		near(b.tip.distanceTo(b.entry) / a.tip.distanceTo(a.entry), 1.2, 1e-9);
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
		assert.ok(Math.sign(g.palmReach.x) === -Math.sign(s.entry[0]), `${s.id}: ... and turned inward`);
		assert.ok(g.dirReach.z > 0.85 && g.dirReach.y < -0.2, `${s.id}: the offered arm points at the viewer, a little down`);
		// the reached arm swings toward the screen centre
		assert.ok(Math.sign(g.dirReach.x) === -Math.sign(s.entry[0]) || g.dirReach.x === 0);
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
		assert.ok(g.visible + sunk.slide >= 0.04 - 1e-9, `${s.id}: at least 4 cm of the hand stays out`);
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
	assert.ok(offer.position.z > g.handReach.z, 'the camera is in front of the hand');
	assert.ok(offer.position.distanceTo(g.handReach) > 0.4 && offer.position.distanceTo(g.handReach) < 1.8, `distance ${offer.position.distanceTo(g.handReach).toFixed(2)}`);
	assert.ok(offer.target.distanceTo(g.handReach) < 0.3);
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

// ---- the showcase table -------------------------------------------------------------------------------------------------------------
test('showcase: one per class, 3-4.2 s, the hand ends in the offer pose (roll 0, no squeeze, no grip), effects use known presets and anchors, the cold points are the Ossuarist\'s only', () => {
	assert.deepEqual(Object.keys(C.SHOWCASE).sort(), [...C.SHOWCASE_ORDER].sort());
	const anchors = ['wrist', 'palm', 'dorsum', 'knuckles', 'thumb', 'tip'];
	for (const id of C.SHOWCASE_ORDER) {
		const d = C.SHOWCASE[id];
		assert.ok(d.dur >= 3 && d.dur <= 4.2, `${id} lasts ${d.dur} s`);
		assert.ok(d.note.length > 10, `${id} has its note (the marks it shows)`);
		for (const k of ['roll', 'squeeze', 'tremor', 'grip']) near(C.keyAt(d[k], d.dur), 0, 1e-9);
		near(C.keyAt(d.roll, 0), 0); // the hand has already turned palm up on the way out: the showcase starts there ...
		const rolls = d.roll.map((k) => k[1]);
		assert.ok(Math.max(...rolls.map(Math.abs)) >= 20 && Math.max(...rolls.map(Math.abs)) <= 180, `${id} turns to show its marks, never more than half a turn`);
		assert.ok(d.roll.every((k, i) => i === 0 || Math.abs(k[1] - d.roll[i - 1][1]) <= 180), `${id} no step of more than half a turn`); // ... and ends there
		assert.ok(anchors.includes(d.light.anchor));
		near(C.keyAt(d.light.intensity, 0), 0);
		near(C.keyAt(d.light.intensity, d.dur), 0);
		assert.ok(d.cam.dist > 0.6 && d.cam.dist < 1.3 && d.cam.elev > 0);
		for (const ev of d.fx) {
			assert.ok(C.FX_PRESETS[ev.kind], `${id}: preset ${ev.kind}`);
			assert.ok(anchors.includes(ev.at) && ev.from >= 0 && ev.to <= d.dur && ev.to > ev.from && ev.rate > 0);
		}
		assert.equal(d.fx.some((ev) => ev.kind === 'soul'), id === 'OS', 'the still cold-white points belong to the Ossuarist only');
	}
	// warm fire only for lamp / coals / pyre: the flame is the Exhumer's, embers the Exhumer's and Pyre-Singer's
	assert.ok(C.SHOWCASE.EX.flame && !Object.entries(C.SHOWCASE).some(([id, d]) => id !== 'EX' && d.flame));
	for (const [id, d] of Object.entries(C.SHOWCASE)) if (d.fx.some((ev) => ev.kind === 'ember')) assert.ok(id === 'EX' || id === 'PS', `${id} has embers`);
	// the clench of the Pallbearer, the rope of the Flagellant: squeezes; stand-ins run their own class's showcase (it is keyed by the slot id, not by the donor)
	assert.ok(C.keyAt(C.SHOWCASE.PB.squeeze, 2.6) > 0.03 && C.keyAt(C.SHOWCASE.FL.squeeze, 1.1) > 0.05);
	for (const slot of C.SLOTS) assert.ok(C.SHOWCASE[slot.id]);
});

test('keyAt: clamps outside, smooth between keys; computeAnchors finds the parts of a synthetic hand', () => {
	const k = [[0, 0], [1, 10], [2, 10], [3, 0]];
	near(C.keyAt(k, -1), 0);
	near(C.keyAt(k, 0.5), 5, 1e-9);
	near(C.keyAt(k, 1.5), 10);
	near(C.keyAt(k, 9), 0);
	// a flat-ish hand: points on a grid in x (-0.05..0.1), y (-0.02..0.03), z 0..0.45
	const pts = [];
	for (let z = 0; z <= 0.45; z += 0.01) for (let x = -0.05; x <= 0.1; x += 0.01) for (const y of [-0.02, 0.03]) pts.push(x, y, z);
	pts.push(0.2, 0.0, 0.3); // a thumb sticking out sideways
	const a = C.computeAnchors(new Float32Array(pts), 0.27);
	near(a.wrist.z, 0.27);
	assert.ok(a.tip.z > 0.43, `tip z ${a.tip.z}`);
	assert.ok(a.dorsum.y > 0.02 && a.palm.y < -0.01, 'the back of the hand is +y, the palm -y');
	assert.ok(a.thumb.x > 0.1, `the thumb is the sideways extreme (${a.thumb.x})`);
});

// ---- the anchors of the showcase: synthetic, skinned, empty and the real GLBs --------------------------------------------------------
/** The POSITION array of the mesh named `hand` of a prepared GLB (float32 VEC3, plain accessor). */
function glbHandPositions(file) {
	const b = readFileSync(file);
	const jl = b.readUInt32LE(12);
	const j = JSON.parse(b.subarray(20, 20 + jl).toString('utf8'));
	const bin = b.subarray(20 + jl + 8);
	const prim = j.meshes.find((m) => m.name === 'hand').primitives[0];
	const acc = j.accessors[prim.attributes.POSITION];
	const view = j.bufferViews[acc.bufferView];
	assert.equal(acc.componentType, 5126);
	assert.ok(!view.byteStride || view.byteStride === 12);
	const off = bin.byteOffset + (view.byteOffset ?? 0) + (acc.byteOffset ?? 0);
	return new Float32Array(bin.buffer.slice(off, off + acc.count * 12));
}

test('anchors: the thumb is above the wrist (a sleeve hem below it does not count), the knuckle row is beyond the middle of the back, on the three real hands', () => {
	for (const [id, model] of Object.entries(C.HAND_MODELS)) {
		const file = path.join(root, 'assets/choice-hands', `${model.file}.glb`);
		if (!existsSync(file)) continue;
		const a = C.computeAnchors(glbHandPositions(file), model.wrist);
		for (const k of ['wrist', 'tip', 'dorsum', 'knuckles', 'palm', 'thumb']) assert.ok(a[k], `${id}.${k}`);
		assert.ok(a.thumb.z > model.wrist && a.thumb.z < model.wrist + 0.13, `${id} thumb z ${a.thumb.z.toFixed(3)} (wrist ${model.wrist})`);
		assert.ok(Math.abs(a.thumb.x) > 0.03, `${id} thumb sticks out sideways (${a.thumb.x.toFixed(3)})`);
		assert.ok(a.knuckles.z > a.dorsum.z + 0.01, `${id} knuckles ${a.knuckles.z.toFixed(3)} beyond dorsum ${a.dorsum.z.toFixed(3)}`);
		assert.ok(a.dorsum.y > a.palm.y, `${id} back of the hand above the palm`);
		assert.ok(a.tip.distanceTo(new THREE.Vector3(...model.tip)) < 0.02, `${id} tip matches the model table`);
	}
});

test('anchors: a flared sleeve below the wrist is not the thumb; a skinned or empty mesh still gives every anchor; fallbackAnchors covers all names', () => {
	const model = { wrist: 0.27, tip: [0.02, -0.02, 0.447] };
	const names = ['wrist', 'tip', 'dorsum', 'knuckles', 'palm', 'thumb'];
	const pts = [];
	for (let z = 0.0; z <= 0.45; z += 0.01) for (let x = -0.04; x <= 0.06; x += 0.01) for (const y of [-0.02, 0.03]) pts.push(x, y, z);
	for (let z = 0.2; z < 0.27; z += 0.01) pts.push(0.15, 0, z, -0.14, 0, z); // the sleeve flares wide below the wrist
	pts.push(0.12, 0, 0.33); // the thumb
	const a = C.computeAnchors(new Float32Array(pts), model.wrist);
	assert.ok(a.thumb.x > 0.05 && a.thumb.x < 0.1 && a.thumb.z > 0.27, `thumb ${a.thumb.x.toFixed(3)}, ${a.thumb.z.toFixed(3)}`);
	assert.ok(a.knuckles.z > a.dorsum.z);
	// a SkinnedMesh (the finger-rigged GLB): its bind-pose positions are used
	const geo = new THREE.BoxGeometry(0.1, 0.05, 0.45, 12, 12, 12);
	geo.translate(0, 0, 0.225);
	const bone = new THREE.Bone();
	const skinned = new THREE.SkinnedMesh(geo, new THREE.MeshBasicMaterial());
	skinned.name = 'hand';
	skinned.add(bone);
	skinned.bind(new THREE.Skeleton([bone]));
	const group = new THREE.Group();
	group.add(skinned);
	const b = C.handAnchors(group, model);
	for (const n of names) assert.ok(b[n] && Number.isFinite(b[n].x + b[n].y + b[n].z), `skinned ${n}`);
	assert.ok(b.tip.z > 0.43, 'the skinned mesh was measured, not the table');
	// nothing to measure: the table
	const c = C.handAnchors(new THREE.Group(), model);
	for (const n of names) assert.ok(c[n], `empty ${n}`);
	near(c.tip.z, 0.447);
	assert.deepEqual(Object.keys(C.computeAnchors(new Float32Array(0), 0.27)), ['wrist']);
});

// ---- the offer: every hand ends palm up ----------------------------------------------------------------------------------------------
test('offer pose: the palm of EVERY class faces up (dot >= 0.7), toward the viewer, the way there is at most half a turn, and the fingers are a loose cup', () => {
	const up = new THREE.Vector3(0, 1, 0);
	const out = [];
	for (const slot of C.SLOTS) {
		const geo = C.armGeometry(slot, { scale: C.HAND_SCALE });
		const n = C.offerPalmNormal(slot, geo);
		const d = n.dot(up);
		out.push(`${slot.id} ${d.toFixed(3)}`);
		assert.ok(d >= 0.7, `${slot.id}: palm normal ${n.toArray().map((v) => v.toFixed(2))} dot up ${d.toFixed(3)}`);
		assert.ok(n.z > 0, `${slot.id}: the palm is seen from the viewer's side`);
		if (slot.pose === 'back') assert.ok(geo.qIdle.angleTo(geo.qReach) > 1.2, `${slot.id}: a back-up hand really turns over on the way out`);
	}
	console.log('palm dot up:', out.join(' · '));
	for (const f of Object.keys(C.FINGER_POSES)) {
		const open = C.fingerAngles(f, 1, 0);
		assert.ok(open.curl[0] > 0 && open.curl[0] < 20, `${f}: the offered hand is cupped a little (${open.curl[0]})`);
	}
});

/** Total angle (deg, signed) a hand has turned about its own forearm: the way out (reach 0 -> 1 with the real ease), then the showcase's roll over its whole time; returns { min, max, end }. */
function forearmTwistTrace(slot, geo, def) {
	const fore = new THREE.Vector3();
	const axis = new THREE.Vector3();
	let prev = null;
	let total = 0;
	const trace = { min: 0, max: 0, end: 0 };
	const step = (reach, roll) => {
		const q = C.armPose(slot, geo, { reach }).quat.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), (roll * geo.rollSign * Math.PI) / 180));
		if (prev) {
			const dq = q.clone().multiply(prev.clone().invert()); // world-frame increment
			if (dq.w < 0) dq.set(-dq.x, -dq.y, -dq.z, -dq.w);
			const ang = 2 * Math.acos(Math.min(1, dq.w));
			if (ang > 1e-9) {
				axis.set(dq.x, dq.y, dq.z).normalize();
				total += ang * axis.dot(fore.set(0, 0, 1).applyQuaternion(prev));
			}
		}
		prev = q;
		trace.min = Math.min(trace.min, total);
		trace.max = Math.max(trace.max, total);
	};
	for (let i = 0; i <= 120; i++) step(C.easeOutBack(i / 120), 0);
	for (let t = 0; t <= def.dur + 1e-9; t += 0.01) step(1, C.keyAt(def.roll, t));
	trace.min = (trace.min * 180) / Math.PI;
	trace.max = (trace.max * 180) / Math.PI;
	trace.end = (total * 180) / Math.PI;
	return trace;
}

test('offer: the forearm never winds up - way out + showcase roll stay within ~185 deg in total, and the roll sign is computed from the way out', () => {
	const out = [];
	for (const slot of C.SLOTS) {
		const geo = C.armGeometry(slot, { scale: C.HAND_SCALE });
		const t = forearmTwistTrace(slot, geo, C.SHOWCASE[slot.id]);
		out.push(`${slot.id} twist ${geo.twist.toFixed(0)} deg, roll sign ${geo.rollSign}, range ${t.min.toFixed(0)}..${t.max.toFixed(0)} = ${(t.max - t.min).toFixed(0)} deg`);
		assert.ok(t.max - t.min <= 185, `${slot.id}: the forearm turns ${(t.max - t.min).toFixed(0)} deg in total`);
		if (Math.abs(geo.twist) > 3) assert.equal(Math.sign(geo.rollSign), -Math.sign(geo.twist), `${slot.id}: the showcase rolls against the turn of the way out`);
	}
	console.log('forearm twist:\n  ' + out.join('\n  '));
	// the old hard-coded sign would have wound PB and OS to ~290 deg: the test can tell
	const pb = C.SLOTS.find((s) => s.id === 'PB');
	const geo = C.armGeometry(pb, { scale: C.HAND_SCALE });
	const wrong = { ...geo, rollSign: -geo.rollSign };
	assert.ok(forearmTwistTrace(pb, wrong, C.SHOWCASE.PB).max - forearmTwistTrace(pb, wrong, C.SHOWCASE.PB).min > 250, 'the wrong sign winds the sleeve up (the test sees it)');
});

// ---- the palm plane of the real meshes, independent of the anchors ---------------------------------------------------------------------
/** Principal axes of the hand's cross-section just beyond the wrist (wrist + 3..11 cm): the slab's NORMAL (smallest variance) oriented to the CONVEX face. */
function palmPlane(P, wrist) {
	const pts = [];
	for (let i = 0; i < P.length; i += 3) if (P[i + 2] > wrist + 0.03 && P[i + 2] < wrist + 0.11) pts.push([P[i], P[i + 1], P[i + 2]]);
	const m = [0, 1, 2].map((k) => pts.reduce((s, p) => s + p[k], 0) / pts.length);
	const cov = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
	for (const p of pts) for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) cov[a][b] += ((p[a] - m[a]) * (p[b] - m[b])) / pts.length;
	const mul = (M, v) => M.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
	const norm = (v) => v.map((x) => x / Math.hypot(...v));
	let v = norm([1, 0.3, 0.2]);
	for (let i = 0; i < 200; i++) v = norm(mul(cov, v));
	const cv = mul(cov, v);
	const lmax = v[0] * cv[0] + v[1] * cv[1] + v[2] * cv[2];
	const M = cov.map((r, a) => r.map((x, b) => (a === b ? lmax : 0) - x));
	let n = norm([0.2, 1, 0.1]);
	for (let i = 0; i < 300; i++) n = norm(mul(M, n));
	const along = (p) => (p[0] - m[0]) * n[0] + (p[1] - m[1]) * n[1] + (p[2] - m[2]) * n[2];
	const xs = pts.map((p) => p[0]);
	const xc = (Math.min(...xs) + Math.max(...xs)) / 2;
	const w = Math.max(...xs) - Math.min(...xs);
	const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
	const arch = mean(pts.filter((p) => Math.abs(p[0] - xc) < w * 0.2).map(along)) - mean(pts.filter((p) => Math.abs(p[0] - xc) > w * 0.35).map(along));
	if (arch < 0) n = n.map((x) => -x); // the slab bulges toward its convex face: the back of the hand
	return { n, arch: Math.abs(arch) };
}

test('palm plane (PCA of wrist + 3..11 cm) of the three GLBs: nearly the XZ plane, and +Y is the convex BACK of the hand (the convention the offer pose relies on)', () => {
	for (const [id, model] of Object.entries(C.HAND_MODELS)) {
		const file = path.join(root, 'assets/choice-hands', `${model.file}.glb`);
		if (!existsSync(file)) continue;
		const { n, arch } = palmPlane(glbHandPositions(file), model.wrist);
		assert.ok(arch > 0.004, `${id}: the cross-section is arched (${arch.toFixed(4)}), so its convex side can be told`);
		assert.ok(Math.abs(n[1]) > 0.75, `${id}: palm plane normal ${n.map((x) => x.toFixed(2))}`);
		assert.ok(n[1] > 0.75, `${id}: the convex side (the back) is +Y`);
	}
});

test('offer camera (fitted to the REAL meshes): the hand fills 30-36 % of the frame height with the margins, and the candle (dish, wax, flame) never overlaps its box', () => {
	const out = [];
	for (const slot of C.SLOTS) {
		const geo = C.armGeometry(slot, { scale: C.HAND_SCALE });
		const model = C.HAND_MODELS[slot.source];
		const P = glbHandPositions(path.join(root, 'assets/choice-hands', `${model.file}.glb`));
		const pts = [];
		for (let i = 0; i < P.length; i += 3) if (P[i + 2] >= model.wrist - 0.045) pts.push([P[i], P[i + 1], P[i + 2]]);
		const step = Math.max(1, Math.floor(pts.length / 240));
		geo.fitLocal = pts.filter((_, i) => i % step === 0); // before the first use of geo.offerCam, as the scene does
		const c = geo.offerCam;
		assert.ok(c.ok, `${slot.id}: a view that clears the candle and keeps the margins exists`);
		for (const aspect of [1.29, 1.6, 2.4]) assert.ok(geo.offerCamFor(C.offerView(aspect)).ok, `${slot.id}: also in a window of aspect ${aspect}`);
		// an independent re-projection through cameraPose with a real camera
		const pose = C.cameraPose(geo, 1);
		const cam = new THREE.PerspectiveCamera(C.OFFER_FIT.fov, C.OFFER_FIT.aspect, 0.1, 50);
		cam.position.copy(pose.position);
		cam.lookAt(pose.target);
		cam.updateMatrixWorld(true);
		const box = (list) => {
			const b = { x0: 9, x1: -9, y0: 9, y1: -9 };
			for (const p of list) {
				const v = p.clone().project(cam);
				b.x0 = Math.min(b.x0, (v.x + 1) / 2);
				b.x1 = Math.max(b.x1, (v.x + 1) / 2);
				b.y0 = Math.min(b.y0, (1 - v.y) / 2);
				b.y1 = Math.max(b.y1, (1 - v.y) / 2);
			}
			return b;
		};
		const h = box(C.offerHandPoints(slot, geo));
		const k = C.CANDLE.scale;
		const corners = [];
		for (const x of [-0.082, 0.145]) for (const y of [0, 0.233]) for (const z of [-0.082, 0.082]) corners.push(new THREE.Vector3(C.CANDLE.x + x * k, y * k, C.CANDLE.z + z * k));
		const cb = box(corners);
		const clear = Math.max(cb.x0 - h.x1, h.x0 - cb.x1, cb.y0 - h.y1, h.y0 - cb.y1);
		out.push(`${slot.id}: dist ${c.dist.toFixed(2)} yaw ${c.yaw} elev ${c.elev}; hand height ${(h.y1 - h.y0).toFixed(3)}, y ${h.y0.toFixed(2)}..${h.y1.toFixed(2)}, x ${h.x0.toFixed(2)}..${h.x1.toFixed(2)}; candle clear ${clear.toFixed(3)}`);
		assert.ok(h.y1 - h.y0 >= 0.295 && h.y1 - h.y0 <= 0.36, `${slot.id}: height ${(h.y1 - h.y0).toFixed(3)}`);
		assert.ok(h.x0 >= 0.05 && h.x1 <= 0.95 && h.y0 >= 0.05 && h.y1 <= C.OFFER_FIT.floor, `${slot.id}: margins`);
		assert.ok(clear >= C.OFFER_FIT.gap - 1e-6, `${slot.id}: the candle box clears the hand box by ${clear.toFixed(3)}`);
	}
	console.log('offer camera:\n  ' + out.join('\n  '));
});

test('offer light: only the classes that need it (Pallbearer steel, Brinecaller dark skin), in the same scale as the showcase light (never brighter than its peak)', () => {
	const withOffer = C.SHOWCASE_ORDER.filter((id) => C.SHOWCASE[id].offer);
	assert.deepEqual(withOffer, ['PB', 'BR']); // measured: the others read 66-74/255 without it, these two 46-50
	const d = C.SHOWCASE.PB;
	const peak = Math.max(...d.light.intensity.map((k) => k[1]));
	assert.ok(d.offer.intensity > 0 && d.offer.intensity <= peak * 2, `offer ${d.offer.intensity} vs showcase peak ${peak}`);
	near(C.CLASS_LIGHT_SCALE, 0.2);
});

// ---- the hand-test mode: limits, presets, the way a hand moves, the joint drivers ----------------------------------------------------------------------
const FINGERS = ['thumb', 'index', 'middle', 'ring', 'pinky'];

test('hand test: every preset lies inside the anatomical limits and says what it says (fist closes, point points, spread spreads, wrist and roll presets move only those)', () => {
	for (const [id, pr] of Object.entries(C.HAND_PRESETS)) {
		for (const t of pr.dynamic ? [0, 0.4, 0.8, 1.2, 1.6, 2.4] : [0]) {
			const raw = pr.dynamic ? pr.dynamic(t) : pr.pose();
			const clamped = C.clampPose(raw);
			assert.deepEqual(clamped, raw, `${id} @${t}: inside the limits already (nothing had to be clamped)`);
		}
	}
	const fist = C.presetPose('fist');
	for (const f of ['index', 'middle', 'ring', 'pinky']) {
		assert.ok(fist.fingers[f].curl[0] >= 85 && fist.fingers[f].curl[1] >= 100 && fist.fingers[f].curl[2] >= 70, `${f} closes in the fist`);
	}
	const point = C.presetPose('point');
	assert.ok(point.fingers.index.curl.every((v) => v < 5) && point.fingers.middle.curl[1] > 90, 'the index is straight, the rest are closed');
	const spread = C.presetPose('spread');
	assert.ok(spread.fingers.thumb.spread >= 35 && spread.fingers.pinky.spread <= -15 && spread.fingers.index.spread > spread.fingers.ring.spread, 'the fingers fan away from each other');
	near(C.presetPose('flexed').wrist.flex, 40);
	near(C.presetPose('extended').wrist.flex, -40);
	near(C.presetPose('rollPlus').roll, 90);
	near(C.presetPose('rollMinus').roll, -90);
	const cup = C.presetPose('cup');
	const offer = C.presetPose('offer');
	for (const f of ['index', 'middle', 'ring', 'pinky']) assert.ok(cup.fingers[f].curl[1] > offer.fingers[f].curl[1] && cup.fingers[f].curl[1] < fist.fingers[f].curl[1]);
	const wild = C.emptyPose();
	wild.fingers.index.curl = [200, 300, 400];
	wild.fingers.index.spread = 99;
	wild.wrist = { flex: 500, dev: -500 };
	wild.roll = 999;
	const c = C.clampPose(wild);
	assert.deepEqual(c.fingers.index.curl, [90, 110, 80]);
	assert.equal(c.fingers.index.spread, 20);
	assert.deepEqual([c.wrist.flex, c.wrist.dev, c.roll], [80, -20, 90]);
});

test('hand test: the sequence visits every preset in order and wraps', () => {
	const total = C.HAND_TEST_SEQUENCE.reduce((s, [, d]) => s + d, 0);
	assert.equal(new Set(C.HAND_TEST_SEQUENCE.map(([id]) => id)).size, Object.keys(C.HAND_PRESETS).length, 'every preset is in the loop');
	let t = 0;
	C.HAND_TEST_SEQUENCE.forEach(([id, d], i) => {
		const a = C.sequenceAt(t + d / 2);
		assert.equal(a.id, id);
		assert.equal(a.index, i);
		t += d;
	});
	assert.equal(C.sequenceAt(total + 0.1).index, 0);
	assert.equal(C.sequenceAt(-0.1).index, C.HAND_TEST_SEQUENCE.length - 1);
});

test('hand motion: the hand settles on its target with almost no overshoot, the outer joints and the later fingers follow, nothing leaves the limits', () => {
	const from = C.presetPose('relaxed');
	const to = C.presetPose('fist');
	const cross = (get, level) => {
		const mm = new C.HandMotion(from);
		mm.setTarget(to);
		const a0 = get(from);
		const a1 = get(to);
		for (let tt = 0; tt < 3; tt += 1 / 120) {
			mm.update(1 / 120);
			if ((get(mm.pose) - a0) / (a1 - a0) >= level) return tt;
		}
		return Infinity;
	};
	assert.ok(cross((p) => p.fingers.pinky.curl[0], 0.2) > cross((p) => p.fingers.index.curl[0], 0.2) + 0.03, 'the little finger starts after the index');
	assert.ok(cross((p) => p.fingers.index.curl[2], 0.5) > cross((p) => p.fingers.index.curl[0], 0.5), 'the fingertip joint follows the knuckle');
	const m = new C.HandMotion(from);
	m.setTarget(to);
	let peak = 0;
	for (let i = 0; i < 360; i++) {
		m.update(1 / 120);
		for (const f of FINGERS) {
			m.pose.fingers[f].curl.forEach((v, k) => {
				const [lo, hi] = C.HAND_LIMITS[f].curl[k];
				assert.ok(v >= lo - 1e-9 && v <= hi + 1e-9, `${f} joint ${k} ${v}`);
				peak = Math.max(peak, (v - to.fingers[f].curl[k]) / (to.fingers[f].curl[k] - from.fingers[f].curl[k]));
			});
		}
	}
	assert.ok(peak < 0.04, `overshoot ${(peak * 100).toFixed(1)} %`);
	for (const f of FINGERS) m.pose.fingers[f].curl.forEach((v, k) => near(v, to.fingers[f].curl[k], 0.5));
	const big = new C.HandMotion(from);
	big.setTarget(to);
	big.update(0.5);
	big.update(0.5);
	big.update(1.0);
	near(big.pose.fingers.index.curl[1], to.fingers.index.curl[1], 0.5);
	big.setTarget(from, { instant: true });
	near(big.pose.fingers.index.curl[1], from.fingers.index.curl[1], 1e-9);
});

/** A little bone skeleton in the hand frame (+z fingers, +y back of the hand, the thumb toward +x), every bone with identity rest rotation, like the synthetic rig. */
function boneHand() {
	const root = new THREE.Group();
	const add = (name, parent, pos) => {
		const b = new THREE.Bone();
		b.name = name;
		b.position.set(...pos);
		parent.add(b);
		return b;
	};
	const hr = add('hand_root', root, [0, 0, 0]);
	const fa = add('forearm', hr, [0, 0, 0.04]);
	const ft = add('forearm_twist', fa, [0, 0, 0.06]);
	const wr = add('wrist', fa, [0, 0, 0.23]);
	const bones = { hand_root: hr, forearm: fa, forearm_twist: ft, wrist: wr };
	const xs = { pinky: -0.04, ring: -0.02, middle: 0, index: 0.02 };
	for (const [f, x] of Object.entries(xs)) {
		let parent = wr;
		for (let k = 1; k <= 3; k++) parent = bones[`${f}_0${k}`] = add(`${f}_0${k}`, parent, k === 1 ? [x, 0, 0.085] : [0, 0, 0.028]);
	}
	let parent = wr;
	for (let k = 1; k <= 3; k++) parent = bones[`thumb_0${k}`] = add(`thumb_0${k}`, parent, k === 1 ? [0.045, 0, 0.03] : [0.01, 0, 0.026]);
	root.updateMatrixWorld(true);
	return { root, bones };
}

test('finger rig: applyPose bends the bones the right way and clamps; the joint rig flexes toward the palm, deviates toward the thumb, rolls the palm toward the thumb', () => {
	const { root, bones } = boneHand();
	const rig = C.createFingerRig(root, C.FINGER_BONES, {}); // axes derived from the bones (the real rig's thumb override does not belong to this test skeleton)
	assert.equal(rig.missing.length, 0);
	const tip = (f) => bones[`${f}_03`].getWorldPosition(new THREE.Vector3());
	const rest = tip('index');
	rig.applyPose(C.presetPose('fist'));
	root.updateMatrixWorld(true);
	assert.ok(tip("index").y < rest.y - 0.015 && tip("index").z < rest.z, `the index fingertip curls to the palm side: ${tip('index').toArray().map((v) => v.toFixed(3))}`);
	assert.ok(tip('thumb').y < -0.005, 'the thumb curls toward the palm too');
	const wild = C.emptyPose();
	wild.fingers.middle.curl = [200, 0, 0];
	rig.applyPose(wild);
	near(bones.middle_01.quaternion.angleTo(new THREE.Quaternion()), (90 * Math.PI) / 180, 1e-6);
	rig.applyPose(C.emptyPose());
	for (const f of FINGERS) for (let k = 1; k <= 3; k++) near(bones[`${f}_0${k}`].quaternion.angleTo(new THREE.Quaternion()), 0, 1e-6);
	const sp = C.emptyPose();
	sp.fingers.index.spread = 15;
	rig.applyPose(sp);
	root.updateMatrixWorld(true);
	assert.ok(tip('index').x > rest.x + 0.005, 'positive spread moves the index toward the thumb side');
	rig.applyPose(C.emptyPose());
	root.updateMatrixWorld(true);
	const joints = C.createJointRig(root);
	assert.ok(joints.has.wrist && joints.has.forearm);
	assert.equal(joints.axes.thumbSide, 1);
	const mid0 = tip('middle');
	const pose = C.emptyPose();
	pose.wrist.flex = 40;
	joints.apply(pose);
	root.updateMatrixWorld(true);
	assert.ok(tip('middle').y < mid0.y - 0.05, 'wrist flexion drops the fingers toward the palm');
	pose.wrist.flex = 0;
	pose.wrist.dev = 20;
	joints.apply(pose);
	root.updateMatrixWorld(true);
	assert.ok(tip('middle').x > mid0.x + 0.03, 'deviation swings the hand toward the thumb');
	pose.wrist.dev = 0;
	pose.roll = 90;
	joints.apply(pose);
	root.updateMatrixWorld(true);
	const palmN = new THREE.Vector3(0, -1, 0).applyQuaternion(bones.wrist.getWorldQuaternion(new THREE.Quaternion()));
	assert.ok(palmN.x > 0.9, `after +90 the palm faces the thumb side: ${palmN.toArray().map((v) => v.toFixed(2))}`);
	// the bone between the cuff and the cord takes the other half of the twist, the other way: -theta/2 about the same axis
	assert.ok(joints.has.twist);
	near(bones.forearm_twist.quaternion.angleTo(new THREE.Quaternion()), (45 * Math.PI) / 180, 1e-6);
	const net = bones.forearm.quaternion.clone().multiply(bones.forearm_twist.quaternion);
	near(net.angleTo(new THREE.Quaternion()), (45 * Math.PI) / 180, 1e-6); // 90 - 45 = 45 deg of net roll beyond the twist bone
	pose.roll = 200;
	joints.apply(pose);
	near(bones.forearm.quaternion.angleTo(new THREE.Quaternion()), (90 * Math.PI) / 180, 1e-6);
	near(bones.forearm_twist.quaternion.angleTo(new THREE.Quaternion()), (45 * Math.PI) / 180, 1e-6); // the limit applies to it too
});

test('finger weights: the natural lag (index first, little finger last, outer joints after inner) keeps both ends exact', () => {
	for (const f of FINGERS) {
		const a0 = C.fingerAngles(f, 0, 0);
		const a1 = C.fingerAngles(f, 1, 0);
		const g1 = C.fingerAngles(f, 1, 1);
		for (let k = 0; k < 3; k++) {
			near(a0.curl[k], C.FINGER_POSES[f].relaxed[k], 1e-9);
			near(a1.curl[k], C.FINGER_POSES[f].open[k], 1e-9);
			near(g1.curl[k], C.FINGER_POSES[f].grip[k], 1e-9);
		}
	}
	const idx = C.fingerAngles('index', 0, 0.35);
	const pky = C.fingerAngles('pinky', 0, 0.35);
	const frac = (a, f, k) => (a.curl[k] - C.FINGER_POSES[f].relaxed[k]) / (C.FINGER_POSES[f].grip[k] - C.FINGER_POSES[f].relaxed[k]);
	assert.ok(frac(idx, 'index', 0) > frac(pky, 'pinky', 0), 'the index leads the little finger');
	assert.ok(frac(idx, 'index', 0) > frac(idx, 'index', 2), 'the knuckle leads the fingertip joint');
});

test('the real Flagellant rig: measured fist, a straightened (negative) offer, the thumb hinge, presets inside the limits', () => {
	const P = C.HAND_PROFILES.flRig.poses;
	assert.deepEqual(P.index.grip, [52.7, 64.8, 45.4]);
	assert.deepEqual(P.middle.grip, [42.5, 52, 35.5]);
	assert.deepEqual(P.ring.grip, [48.5, 59, 39.2]);
	assert.deepEqual(P.pinky.grip, [60.2, 70.1, 46.9]);
	assert.deepEqual(C.FINGER_AXES.thumb.curl, [-0.007, -0.954, -0.299]);
	assert.deepEqual(C.FINGER_AXES.thumb.spread, [0.226, 0.29, -0.93]);
	for (const f of ['index', 'middle', 'ring', 'pinky']) {
		assert.ok(P[f].relaxed.every((v) => v === 0), `${f}: the mesh is already curled: relaxed adds nothing`);
		assert.ok(P[f].open.every((v) => v < 0), `${f}: the offered hand is a little straighter than the mesh (negative), never a claw`);
	}
	const set = C.presetSet('flRig');
	assert.deepEqual(Object.keys(set), Object.keys(C.HAND_PRESETS), 'the same presets');
	for (const [id, pr] of Object.entries(set)) {
		for (const t of pr.dynamic ? [0, 0.4, 0.8, 1.2, 1.6] : [0]) {
			const raw = pr.dynamic ? pr.dynamic(t) : pr.pose();
			assert.deepEqual(C.clampPose(raw), raw, `${id} @${t} inside the limits`);
		}
	}
	const fist = C.presetPose('fist', 0, 'flRig');
	assert.deepEqual(fist.fingers.index.curl, P.index.grip.map((v) => v));
	const hold = C.presetPose('hold', 0, 'flRig');
	for (const f of ['index', 'middle', 'ring', 'pinky']) hold.fingers[f].curl.forEach((v, k) => assert.ok(v / P[f].grip[k] > 0.45 && v / P[f].grip[k] < 0.55, `${f}: the loose hold is ~50 % of the fist`));
	const point = C.presetPose('point', 0, 'flRig');
	assert.ok(point.fingers.index.curl.every((v) => v < 0) && point.fingers.middle.curl[1] > 50, 'the index is straight, the rest closed');
	const relaxed = C.presetPose('relaxed', 0, 'flRig');
	for (const f of ['index', 'middle', 'ring', 'pinky']) assert.deepEqual(relaxed.fingers[f].curl, [0, 0, 0]);
	// the default profile is untouched
	assert.deepEqual(C.HAND_PROFILES.default.poses, C.FINGER_POSES);
});
