// Vertex wind (world space). Inserted into the vertex shader of lit materials and of their shadow
// depth twins by the wind patch (backends/webgl/effects.js). TSL twin: backends/webgpu/effects.js.
#include <lab_time>
uniform float uWindStrength;
uniform float uWindFrequency;
uniform float uWindGust;
uniform float uWindDir;
uniform float uWindHeight;

// `mask` is 0 at the roots and 1 at the tips (object height / uWindHeight, squared below).
vec3 labWindOffset( vec3 worldPos, float mask ) {
	vec2 dir = vec2( cos( uWindDir ), sin( uWindDir ) );
	float phase = dot( worldPos.xz, dir ) * 0.35 + labTime * uWindFrequency;
	float gust = labNoise3( vec3( worldPos.xz * 0.08 - dir * labTime * 0.6, labTime * 0.15 ) ) * 0.5 + 0.5;
	float sway = sin( phase ) * 0.65 + sin( phase * 2.3 + 1.7 ) * 0.25;
	float amount = uWindStrength * mix( 1.0, gust * 2.0, uWindGust ) * mask * mask;
	return vec3( dir.x * sway, - abs( sway ) * 0.2, dir.y * sway ) * amount;
}

// Foot bend: foliage near the hero's body / recent footsteps (shared slots, core/trample.js: x, z, ground y, strength) leans away and is pressed down,
// proportional to its height above that ground; anything higher than ~1.5 m (crowns, banners) is left alone.
uniform vec4 uLabTrample[ 8 ];
uniform vec4 uLabTrampleParams; // radius (m), lean, press, active (0 / 1)
uniform float uWindBend; // 0 = rigid (trunks), 1 = grass
vec3 labTrampleOffset( vec3 worldPos ) {
	vec3 o = vec3( 0.0 );
	if ( uLabTrampleParams.w <= 0.0 || uWindBend <= 0.0 ) return o; // nothing is bending (the system sets .w = 1 while a slot is live)
	for ( int i = 0; i < 8; i ++ ) {
		vec4 p = uLabTrample[ i ];
		if ( p.w <= 0.001 ) continue;
		vec2 d = worldPos.xz - p.xy;
		float dist = length( d );
		float h = worldPos.y - p.z;
		float f = ( 1.0 - smoothstep( 0.0, uLabTrampleParams.x, dist ) ) * p.w * ( 1.0 - smoothstep( 0.9, 1.5, h ) ) * smoothstep( - 0.3, - 0.05, h );
		float hh = clamp( h, 0.0, 0.9 );
		vec2 away = d / max( dist, 0.0001 );
		o.xz += away * ( f * hh * uLabTrampleParams.y );
		o.y -= f * hh * uLabTrampleParams.z;
	}
	o.xz = clamp( o.xz, vec2( - 0.7 ), vec2( 0.7 ) );
	o.y = clamp( o.y, - 0.5, 0.0 );
	return o * uWindBend;
}
