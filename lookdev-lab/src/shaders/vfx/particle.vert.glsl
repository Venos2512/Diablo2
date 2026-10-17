// Instanced particle quad (one draw per emitter, positions in world space, simulated on the CPU).
// iParams: size, rotation, stretch (seconds of velocity added to the length), seed
// iStyle:  shape, align (0 camera-facing, 1 flat on the ground, 2 stretched along velocity), additive, softness
// TSL twin: backends/webgpu/vfx.js (#region particle)
attribute vec3 iPosition;
attribute vec3 iVelocity;
attribute vec4 iColor;
attribute vec4 iParams;
attribute vec4 iStyle;

varying vec2 vUv;
varying vec4 vColor;
varying vec4 vStyle;
varying float vSeed;
varying float vViewZ;

void main() {
	float size = iParams.x;
	float c = cos( iParams.y );
	float s = sin( iParams.y );
	vec2 corner = vec2( c * position.x - s * position.y, s * position.x + c * position.y );
	vec3 world = iPosition;
	if ( iStyle.y < 0.5 ) {
		// Camera-facing: the view matrix rows are the camera axes in world space.
		vec3 right = vec3( viewMatrix[ 0 ][ 0 ], viewMatrix[ 1 ][ 0 ], viewMatrix[ 2 ][ 0 ] );
		vec3 up = vec3( viewMatrix[ 0 ][ 1 ], viewMatrix[ 1 ][ 1 ], viewMatrix[ 2 ][ 1 ] );
		world += ( right * corner.x + up * corner.y ) * size;
	} else if ( iStyle.y < 1.5 ) {
		world += vec3( corner.x, 0.0, corner.y ) * size;
	} else {
		float speed = length( iVelocity );
		vec3 axis = speed > 1e-4 ? iVelocity / speed : vec3( 0.0, 1.0, 0.0 );
		vec3 side = normalize( cross( axis, normalize( cameraPosition - iPosition ) ) + vec3( 1e-5 ) );
		world += axis * ( position.y * ( size + speed * iParams.z ) ) + side * ( position.x * size );
	}
	vec4 mvPosition = viewMatrix * vec4( world, 1.0 );
	gl_Position = projectionMatrix * mvPosition;
	vUv = uv;
	vColor = iColor;
	vStyle = iStyle;
	vSeed = iParams.w;
	vViewZ = mvPosition.z;
}
