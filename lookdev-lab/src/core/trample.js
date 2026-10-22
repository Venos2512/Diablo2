// Shared uniforms of the foot-bend on vegetation: the wind effect (GLSL + TSL, backends/*/effects.js) reads them, character/footsteps.js writes them.
// points[i] = (x, z, ground y, strength 0..1) in world space - slot 0 follows the body, the others are recent footsteps that fade out;
// params = (radius m, lean, press, active): active is 1 while any slot is live, 0 otherwise - the shaders return at once on 0.
import { Vector4 } from 'three';

export const TRAMPLE_SLOTS = 8;

export const TRAMPLE = {
	points: Array.from({ length: TRAMPLE_SLOTS }, () => new Vector4(0, 0, 0, 0)),
	params: new Vector4(0.6, 0.75, 0.55, 0),
};
