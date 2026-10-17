// Shared Act I materials (forged texture sets), created once per app.
import * as THREE from 'three';
import { TextureForge, forgedMaterial } from './forge.js';

export function getForge(app) {
	if (!app.forge) {
		const size = app.settings.data.quality === 'low' ? 512 : 1024;
		app.forge = new TextureForge({ size, anisotropy: Math.min(8, app.backend.caps.maxAnisotropy || 4) });
	}
	return app.forge;
}

export function act1Materials(app) {
	if (app._act1Materials) return app._act1Materials;
	const forge = getForge(app);
	const m = {
		stone: forgedMaterial(forge, 'stoneBricks'),
		cobble: forgedMaterial(forge, 'cobblestone'),
		dirt: forgedMaterial(forge, 'dirt', { vertexColors: false }),
		ground: forgedMaterial(forge, 'grass', { vertexColors: true, name: 'Moor ground' }),
		wood: forgedMaterial(forge, 'wood'),
		bark: forgedMaterial(forge, 'wood', { color: new THREE.Color(0.55, 0.5, 0.46), name: 'Dead bark' }),
		iron: forgedMaterial(forge, 'iron'),
		weathered: forgedMaterial(forge, 'stoneWeathered'),
		ember: new THREE.MeshStandardMaterial({ name: 'Embers', color: 0x1a0d08, roughness: 0.9, emissive: new THREE.Color(1.0, 0.32, 0.08), emissiveIntensity: 3 }),
		grassBlade: new THREE.MeshStandardMaterial({ name: 'Grass blades', color: 0xffffff, roughness: 0.92, metalness: 0, side: THREE.DoubleSide }),
	};
	app._act1Materials = m;
	return m;
}
