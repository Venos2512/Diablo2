// Instanced flame billboards: one draw call for every torch / candle / brazier flame in the scene.
attribute vec3 aCenter;
attribute vec2 aSize;
attribute float aSeed;
attribute float aIntensity;

varying vec2 vUv;
varying float vSeed;
varying float vIntensity;
varying float vViewZ;

void main() {
	vUv = uv;
	vSeed = aSeed;
	vIntensity = aIntensity;
	vec3 center = ( modelMatrix * vec4( aCenter, 1.0 ) ).xyz;
	vec3 toCamera = cameraPosition - center;
	toCamera.y = 0.0;
	vec3 forward = normalize( toCamera + vec3( 1e-4, 0.0, 0.0 ) );
	vec3 right = vec3( forward.z, 0.0, - forward.x );
	vec3 world = center + right * position.x * aSize.x + vec3( 0.0, position.y * aSize.y, 0.0 );
	vec4 mvPosition = viewMatrix * vec4( world, 1.0 );
	vViewZ = mvPosition.z;
	gl_Position = projectionMatrix * mvPosition;
}
