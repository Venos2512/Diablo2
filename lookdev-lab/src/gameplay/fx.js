// Stand-in for Ashen Crown's FX module: the calls the gameplay makes (bursts, deaths, projectiles, novas)
// are mapped onto the lab's three.quarks library (src/skills/fx.js) when it is available (WebGL2), and
// onto small emissive meshes for projectiles otherwise. Everything else is a no-op handle.
import * as THREE from 'three';
import { Engine } from './engine.js';

const _w = new THREE.Vector3();
const _w2 = new THREE.Vector3();
const NOOP = { stop() {}, update() {}, impact() {}, destroy() {}, setActive() {} };

const BURST = { blood: 'blood.hit', bone: 'bone.hit', sparks: 'shock.hit', heal: 'holy.hit', mana: 'cold.burst' };
const ELEMENT = {
	fire: { burst: 'fire.explode', death: 'death.fire', bolt: 'fire.ball', color: 0xff7a2a },
	demonfire: { burst: 'fire.explode', death: 'death.fire', bolt: 'fire.ball', color: 0xff4a1a },
	cold: { burst: 'cold.burst', death: 'death.cold', bolt: 'cold.orb', color: 0x8fd8ff },
	light: { burst: 'shock.hit', death: 'death.shock', bolt: 'shock.hit', color: 0xb9cdff },
	lightning: { burst: 'shock.hit', death: 'death.shock', bolt: 'shock.hit', color: 0xb9cdff },
	poison: { burst: 'poison.nova', death: 'death.poison', bolt: 'poison.cloud', color: 0x8dff6a },
};

function elementOf(kind = '') {
	if (/fire|flame|meteor/.test(kind)) return 'fire';
	if (/cold|frost|ice/.test(kind)) return 'cold';
	if (/light|bolt|charged|shock/.test(kind)) return 'light';
	if (/poison|venom/.test(kind)) return 'poison';
	return null;
}

function play(key, local, opts) {
	const lib = FX.lib;
	if (!lib || !key) return null;
	try {
		return lib.play(key, Engine.toWorld(local, _w), opts);
	} catch (error) {
		console.warn('fx', key, error);
		return null;
	}
}

/** Fallback / solid projectile: an arrow shaft or a glowing orb in gameplay space. */
function meshProjectile(kind, pos, dir) {
	const element = elementOf(kind);
	const color = element ? ELEMENT[element].color : 0xd8c8a8;
	const arrow = /arrow|bolt_phys|spear/.test(kind) || !element;
	const geometry = arrow ? new THREE.CylinderGeometry(0.018, 0.018, 0.7, 5).rotateX(Math.PI / 2) : new THREE.SphereGeometry(0.16, 12, 8);
	const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(arrow ? 1 : 4), toneMapped: false });
	const mesh = new THREE.Mesh(geometry, material);
	mesh.userData.labNoPick = mesh.userData.labNoCollide = true;
	Engine.scene?.add(mesh);
	const place = (p, d) => {
		mesh.position.copy(p);
		if (d && d.lengthSq() > 1e-8) mesh.lookAt(_w2.copy(p).add(d));
	};
	place(pos, dir);
	return {
		update(p, d) {
			place(p, d);
		},
		impact() {
			this.destroy();
		},
		destroy() {
			mesh.removeFromParent();
			geometry.dispose();
			material.dispose();
		},
	};
}

const impl = {
	lib: null, // FxLibrary (src/skills/fx.js) or null
	lights: null, // lab light pool { flash(point, colour, intensity, opts) }

	burst(kind, pos, o = {}) {
		play(BURST[kind], pos, { scale: Math.min(1.6, 0.6 + (o.count || 8) / 16) });
	},
	projectile(kind, { pos, dir }) {
		const mesh = meshProjectile(kind, pos, dir);
		const element = elementOf(kind);
		const lib = FX.lib;
		if (!lib || !element) return mesh;
		const state = { pos: pos.clone(), dir: dir.clone() };
		let trail = null;
		try {
			trail = lib.attach(ELEMENT[element].bolt, () => Engine.toWorld(state.pos, new THREE.Vector3()), { getDir: () => state.dir });
		} catch {
			trail = null;
		}
		return {
			update(p, d, dt) {
				state.pos.copy(p);
				state.dir.copy(d);
				mesh.update(p, d, dt);
			},
			impact(p) {
				trail?.stop();
				mesh.destroy();
				play(ELEMENT[element].burst, p);
			},
			destroy() {
				trail?.stop();
				mesh.destroy();
			},
		};
	},
	explosion(pos, { element = 'fire' } = {}) {
		play((ELEMENT[element] || ELEMENT.fire).burst, pos, { scale: 1.4 });
	},
	nova(pos, { element = 'cold' } = {}) {
		play((ELEMENT[element] || ELEMENT.cold).burst, pos, { scale: 1.8 });
	},
	shockwave(pos) {
		play('aura.pulse', pos);
	},
	teleport(from, to) {
		play('teleport.out', from);
		play('teleport.in', to);
	},
	summon(pos) {
		play('bone.spirit', pos);
	},
	shatter(pos) {
		play('death.cold', pos);
	},
	gibs(pos) {
		play('blood.hit', pos, { scale: 1.8 });
	},
	boneCollapse(pos) {
		play('bone.hit', pos, { scale: 1.4 });
	},
	flashLight(pos, color, intensity, distance, duration) {
		FX.lights?.flash(Engine.toWorld(pos, new THREE.Vector3()), new THREE.Color(color), intensity / 6, { distance, duration });
	},
	elementDeath(element, pos) {
		play(ELEMENT[element]?.death, pos);
	},
};

/** Unknown effects (curses, auras, decals, weapon trails…) return a handle that does nothing. */
export const FX = new Proxy(impl, {
	get(target, key) {
		if (key in target) return target[key];
		return () => NOOP;
	},
	set(target, key, value) {
		target[key] = value;
		return true;
	},
});
