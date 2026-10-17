// Status overlays for gameplay readability: 1 frozen, 2 burning, 3 poisoned, 4 hit flash.
// Uses vLabObjectPos from the patch system. TSL twin: backends/webgpu/effects.js (#region status).
#include <lab_noise>
#include <lab_time>
#include <lab_common>
#include <lab_surface>
uniform float uStatusMode;
uniform float uStatusAmount;
uniform float uStatusIntensity;
uniform float uStatusSpeed;

// Base colour tint (before vertex colours, like the TSL colorNode).
vec3 labStatusAlbedo( vec3 albedo ) {
	if ( uStatusMode < 1.5 ) return mix( albedo, vec3( 0.55, 0.75, 1.0 ) * labLuma( albedo ) * 1.6 + 0.05, 0.65 * uStatusAmount );
	if ( uStatusMode < 2.5 ) return mix( albedo, albedo * vec3( 0.25, 0.2, 0.18 ), 0.5 * uStatusAmount );
	if ( uStatusMode < 3.5 ) return mix( albedo, albedo * vec3( 0.55, 1.0, 0.45 ), 0.6 * uStatusAmount );
	return albedo;
}

// Ice is glossy.
float labStatusRoughness( float roughness ) {
	return uStatusMode < 1.5 ? mix( roughness, 0.18, 0.8 * uStatusAmount ) : roughness;
}

vec3 labStatusEmissive( vec3 viewNormal ) {
	float fresnel = labFresnelTerm( viewNormal );
	float t = labTime * uStatusSpeed;
	vec3 p = vLabObjectPos;
	vec3 glow;
	if ( uStatusMode < 1.5 ) {
		float sparkle = step( 0.985, labHash13( floor( p * 90.0 ) + floor( t * 6.0 ) ) );
		glow = vec3( 0.45, 0.75, 1.0 ) * pow( fresnel, 2.5 ) + vec3( 0.8, 0.95, 1.0 ) * sparkle * 2.0;
	} else if ( uStatusMode < 2.5 ) {
		// Turbulent heat licking upwards, a fiery rim and rising ember sparks.
		float flames = labFbm3( vec3( p.x * 5.0, p.y * 4.0 - t * 2.2, p.z * 5.0 ) ) * 0.5 + 0.5;
		float heat = smoothstep( 0.5, 0.78, flames ) * ( 0.75 + 0.25 * sin( t * 11.0 + p.y * 7.0 ) );
		float ember = step( 0.993, labHash13( floor( vec3( p.x, p.y - t * 0.35, p.z ) * 45.0 ) ) );
		glow = mix( vec3( 1.0, 0.22, 0.03 ), vec3( 1.0, 0.62, 0.18 ), heat ) * heat * 1.6 + vec3( 1.0, 0.4, 0.08 ) * ( pow( fresnel, 2.0 ) * 0.5 + ember * 3.0 );
	} else if ( uStatusMode < 3.5 ) {
		// Pulsing veins (zero crossings of noise) and a sickly fresnel.
		float vein = 1.0 - smoothstep( 0.0, 0.07, abs( labNoise3( p * 5.0 + vec3( 0.0, t * 0.2, 0.0 ) ) ) );
		float pulse = 0.55 + 0.45 * sin( t * 3.0 - p.y * 6.0 );
		glow = vec3( 0.35, 1.0, 0.2 ) * ( vein * pulse + pow( fresnel, 3.0 ) * 0.4 );
	} else {
		glow = vec3( 1.0 );
	}
	return glow * uStatusIntensity * uStatusAmount;
}
