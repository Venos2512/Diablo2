// Atmosphere particle shapes (env/atmosphere.js): soft depth fade against the scene and one premultiplied output, so
// glowing particles (fireflies, embers, blood spores) and alpha-blended ones (ash, leaves, fog) share the draw.
// TSL twin: backends/webgpu/vfx.js (#region atmosphere)
#include <lab_noise>
#include <lab_vfx>
#include <lab_time>

uniform float uSoftness;

varying vec2 vUv;
varying vec4 vColor;
varying vec3 vStyle; // shape, additive, seed
varying float vViewZ;

// 0 mote · 1 flake (ragged ash) · 2 leaf · 3 wisp (fog) · 4 glow (core + halo) · 5 moth
float labAtmoShape( float shape, vec2 uv, float seed ) {
	vec2 p = uv * 2.0 - 1.0;
	float r = length( p );
	if ( shape < 0.5 ) return exp( - r * r * 6.0 ) * ( 1.0 - smoothstep( 0.75, 1.0, r ) );
	if ( shape < 1.5 ) {
		float a = atan( p.y, p.x );
		float edge = 0.62 + 0.2 * sin( a * 3.0 + seed * 40.0 ) + 0.1 * sin( a * 7.0 + seed * 90.0 );
		return 1.0 - smoothstep( edge - 0.15, edge, r );
	}
	if ( shape < 2.5 ) {
		float width = 0.5 * ( 1.0 - p.y * p.y ); // pointed oval, a darker midrib
		return ( 1.0 - smoothstep( width - 0.1, width, abs( p.x ) ) ) * ( 0.75 + 0.25 * smoothstep( 0.03, 0.09, abs( p.x ) ) );
	}
	if ( shape < 3.5 ) {
		float n = labNoise3( vec3( p * 1.4 + seed * 17.0, labTime * 0.05 + seed * 5.0 ) ) * 0.6 + labNoise3( vec3( p * 3.1 - seed * 9.0, labTime * 0.08 ) ) * 0.25;
		return clamp( ( 1.0 - smoothstep( 0.1, 1.0, r ) ) * ( 0.55 + n ), 0.0, 1.0 );
	}
	if ( shape < 4.5 ) return exp( - r * r * 28.0 ) + 0.35 * exp( - r * r * 5.0 ) * ( 1.0 - smoothstep( 0.7, 1.0, r ) );
	vec2 q = vec2( abs( p.x ), p.y );
	float wing = 1.0 - smoothstep( 0.75, 0.95, length( ( q - vec2( 0.45, 0.1 ) ) * vec2( 1.4, 1.8 ) ) );
	float body = ( 1.0 - smoothstep( 0.08, 0.14, q.x ) ) * ( 1.0 - smoothstep( 0.5, 0.6, abs( p.y ) ) );
	return max( wing, body );
}

void main() {
	float fade = labVfxDepthFade( vViewZ, uSoftness );
	if ( fade <= 0.0 ) discard;
	float alpha = vColor.a * labAtmoShape( vStyle.x, vUv, vStyle.z ) * fade;
	if ( alpha < 0.002 ) discard;
	gl_FragColor = labVfxOutput( vColor.rgb * alpha, alpha * ( 1.0 - vStyle.y ) );
}
