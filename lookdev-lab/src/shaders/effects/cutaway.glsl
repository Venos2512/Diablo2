// Diablo-style see-through circle: scene geometry between the camera and the character is dithered out
// inside a screen-space circle around the character (character preview, play mode).
// TSL twin: backends/webgpu/effects.js (createCutaway).
uniform vec3 uCutCenter;  // character: xy = view xy / depth (orthographic: view xy), z = view depth
uniform float uCutRadius; // circle radius, same units as uCutCenter.xy
uniform float uCutFeet;   // character feet height (world): floors and low clutter are never cut
uniform float uCutOn;

float labCutBayer2( vec2 a ) {
	a = floor( a );
	return fract( a.x * 0.5 + a.y * a.y * 0.75 );
}

void labCutaway( vec3 viewPos, float worldY ) {
	if ( uCutOn < 0.5 ) return;
	float depth = -viewPos.z;
	vec2 s = isOrthographic ? viewPos.xy : viewPos.xy / max( depth, 1e-4 );
	float r = length( s - uCutCenter.xy ) / uCutRadius;
	if ( r >= 1.0 || depth > uCutCenter.z - 0.4 || worldY < uCutFeet + 0.35 ) return;
	float dither = labCutBayer2( gl_FragCoord.xy * 0.5 ) * 0.25 + labCutBayer2( gl_FragCoord.xy );
	if ( dither >= smoothstep( 0.55, 1.0, r ) ) discard;
}
