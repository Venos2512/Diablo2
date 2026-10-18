// Floating combat text through the VFX lab's text layer (world positions, so it follows the camera).
import * as THREE from 'three';
import { Engine } from './engine.js';

const KIND = { dmg: 'physical', crit: 'fire', player: 'fire', heal: 'poison', miss: 'magic', immune: 'magic', block: 'cold', xp: 'magic' };

export const Floaters = {
	sink: null, // (worldPosition, text, colourKind) => void

	/** `local` is a gameplay-space point above the actor. */
	spawnWorld(local, text, kind = 'dmg') {
		this.sink?.(Engine.toWorld(local, new THREE.Vector3()), text, KIND[kind] || 'physical');
	},
};
