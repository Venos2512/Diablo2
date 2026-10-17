// "Retro preview": shows how an asset reads at a low internal resolution with a reduced palette,
// close to the 640x480 / 800x600 era. Input is display-referred (after the final pass).
uniform sampler2D tColor;
uniform vec2 uResolution;
uniform float uTargetHeight;
uniform float uLevels;
uniform float uDither;

varying vec2 vUv;

// Ordered dither (4x4 Bayer) in closed form; the TSL version uses the same formula.
float bayer2( vec2 a ) {
	a = floor( a );
	return fract( a.x / 2.0 + a.y * a.y * 0.75 );
}

float bayer4( vec2 p ) {
	return bayer2( 0.5 * p ) * 0.25 + bayer2( p ) - 0.5;
}

void main() {
	float scale = max( 1.0, uResolution.y / uTargetHeight );
	vec2 cells = floor( uResolution / scale );
	vec2 cell = floor( vUv * cells );
	vec2 uv = ( cell + 0.5 ) / cells;
	vec3 color = texture2D( tColor, uv ).rgb;
	float steps = max( uLevels - 1.0, 1.0 );
	color = floor( color * steps + 0.5 + bayer4( cell ) * uDither ) / steps;
	gl_FragColor = vec4( clamp( color, 0.0, 1.0 ), 1.0 );
}
