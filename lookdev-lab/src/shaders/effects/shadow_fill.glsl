// Shadow fill: lifts the darkest part of the lit result toward a tinted fraction of the surface's own albedo, so
// shadowed and unlit sides keep their colour instead of sinking to black — the painted-game "fill" of Diablo-style
// night scenes. It is not a light: where the surface is already lit (luminance above the threshold) nothing is
// added, so contrast and light pools stay intact. Runs on the final outgoing light (linear HDR, before exposure).
// TSL twin: backends/webgpu/effects.js (createShadowFill).
uniform vec3 uFillColor;
uniform float uFillStrength;
uniform float uFillThreshold;

vec3 labShadowFill( vec3 lit, vec3 albedo ) {
	float lum = dot( lit, vec3( 0.2126, 0.7152, 0.0722 ) );
	float dark = 1.0 - smoothstep( 0.0, uFillThreshold, lum );
	// Half-desaturated albedo: the fill colour carries the night tint, the surface keeps its own value and some hue.
	vec3 base = mix( albedo, vec3( dot( albedo, vec3( 0.2126, 0.7152, 0.0722 ) ) ), 0.5 );
	return lit + base * uFillColor * uFillStrength * dark;
}
