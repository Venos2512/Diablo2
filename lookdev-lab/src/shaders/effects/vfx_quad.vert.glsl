// Plain mesh vertex shader for VFX-layer materials (portal, runes): uv and view-space depth.
varying vec2 vUv;
varying float vViewZ;

void main() {
	vUv = uv;
	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
	vViewZ = mvPosition.z;
	gl_Position = projectionMatrix * mvPosition;
}
