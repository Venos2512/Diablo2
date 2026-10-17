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
