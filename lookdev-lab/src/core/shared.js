// Global uniforms read by the procedural characters (src/procedural): time for shader effects, wind for capes.
// The Subject advances uTime while a procedural character is loaded; the gameplay monsters read uWind.
import * as THREE from 'three';

export const SHARED = {
	uniforms: {
		uTime: { value: 0 },
		uWind: { value: new THREE.Vector2(0.6, 0.25) },
	},
};
