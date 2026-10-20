#!/bin/bash
# Screenshot each camp-dressing cluster of the Moor terrain scene: camera at a 3/4 game angle over world (x, z).
cd "$(dirname "$0")"
export CDP_MATCH=localhost:8092
OUT=../_shots/tour
mkdir -p "$OUT"
shoot() { # name x z distance
	node cdp.mjs eval "(async () => {
		const app = window.__LAB__.app, rig = app.rig, c = rig.controls, THREE_V = rig.camera.position.constructor;
		const h = app.current.height ? app.current.height($2, $3) : 0;
		const target = new THREE_V($2, h + 0.5, $3);
		const d = $4, polar = 50 * Math.PI / 180, az = 30 * Math.PI / 180;
		c.target.copy(target);
		rig.camera.position.set(target.x + d * Math.sin(polar) * Math.sin(az), target.y + d * Math.cos(polar), target.z + d * Math.sin(polar) * Math.cos(az));
		rig.camera.lookAt(target); c.update();
		await new Promise((r) => setTimeout(r, 1800));
		return 'ok';
	})()" > /dev/null && node cdp.mjs shot "$OUT/$1.png" > /dev/null && echo "$1"
}
shoot 01_fire_kitchen 10 6 16
shoot 02_gate_banner 16 2 16
shoot 03_quartermaster -9 17 18
shoot 04_crafts_creek -19 9 18
shoot 05_training_forge 18 22 18
shoot 06_hospital 21 31 15
shoot 07_shrine_graves -16 -7 17
shoot 08_animals -22 26 18
shoot 09_outer_east 32 6 20
shoot 10_beacon 32 -6 16
shoot 11_overview 4 10 60
