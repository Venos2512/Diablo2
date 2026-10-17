// Puddle layer (water / blood): noise-shaped puddles on upward-facing surfaces, darkened tinted albedo,
// glossy dielectric response and rain ripples as an analytic world-space normal (3x3 cells of rings);
// `wetness` darkens and glosses the rest of the surface (rain).
// Uses vLabWorldPos / vLabWorldNormal from the patch system. TSL twin: backends/webgpu/effects.js (#region liquid).
#include <lab_noise>
#include <lab_time>
uniform vec3 uLiquidTint;
uniform float uLiquidCoverage;
uniform float uRippleScale;
uniform float uRippleSpeed;
uniform float uLiquidRoughness;
uniform float uLiquidWetness;

// 1 inside a puddle, 0 on dry ground.
float labPuddleMask() {
	float up = smoothstep( 0.55, 0.9, normalize( vLabWorldNormal ).y );
	float n = labFbm3( vec3( vLabWorldPos.xz * 0.45, 3.7 ) ) * 0.5 + 0.5;
	float threshold = 1.0 - uLiquidCoverage;
	return up * smoothstep( threshold - 0.04, threshold + 0.04, n );
}

// Rain-soaked surface outside the puddles: tops get wetter than walls.
float labWetAmount() {
	return uLiquidWetness * ( 0.55 + 0.45 * clamp( normalize( vLabWorldNormal ).y, 0.0, 1.0 ) );
}

// Porous materials darken when wet; puddles show the tinted liquid.
vec3 labLiquidAlbedo( vec3 albedo, float puddle ) {
	return mix( albedo * ( 1.0 - 0.45 * labWetAmount() ), mix( albedo * 0.25, uLiquidTint, 0.7 ), puddle );
}

// Wet surfaces turn glossy; puddles take the liquid's roughness.
float labLiquidRoughness( float roughness, float puddle ) {
	return mix( roughness * ( 1.0 - 0.55 * labWetAmount() ), uLiquidRoughness, puddle );
}

vec3 labRippleNormal( vec2 xz ) {
	vec2 p = xz * uRippleScale;
	vec2 cell = floor( p );
	vec2 grad = vec2( 0.0 );
	for ( int y = - 1; y <= 1; y ++ ) {
		for ( int x = - 1; x <= 1; x ++ ) {
			vec2 c = cell + vec2( float( x ), float( y ) );
			vec2 center = c + labHash22( c );
			float phase = fract( labTime * uRippleSpeed * 0.6 + labHash12( c + 7.7 ) );
			vec2 d = p - center;
			float dist = length( d ) + 1e-4;
			float x0 = dist - phase * 1.3;
			float envelope = exp( - x0 * x0 * 40.0 ) * ( 1.0 - phase );
			grad += ( d / dist ) * cos( x0 * 28.0 ) * envelope;
		}
	}
	return normalize( vec3( - grad.x * 0.35, 1.0, - grad.y * 0.35 ) );
}
