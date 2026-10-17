// Waypoint rune circle: two rings and procedural glyphs (three hashed strokes per sector), revealed by
// an activation sweep. Additive, soft-intersects the floor. TSL twin: backends/webgpu/effects.js (#region runes).
#include <lab_noise>
#include <lab_vfx>
#include <lab_time>
uniform vec3 uColor;
uniform float uIntensity;
uniform float uActivation;
uniform float uSpeed;
varying vec2 vUv;
varying float vViewZ;

float labSegment( vec2 p, vec2 a, vec2 b ) {
	vec2 pa = p - a;
	vec2 ba = b - a;
	float h = clamp( dot( pa, ba ) / dot( ba, ba ), 0.0, 1.0 );
	return length( pa - ba * h );
}

void main() {
	float fade = labVfxDepthFade( vViewZ, 0.03 );
	if ( fade <= 0.0 ) discard;
	vec2 p = ( vUv - 0.5 ) * 2.0;
	float r = length( p );
	if ( r > 1.0 ) discard;
	float angle = atan( p.y, p.x ) + 3.14159265; // 0 .. 2pi
	float t = labTime * uSpeed;
	float ring = ( 1.0 - smoothstep( 0.0, 0.025, abs( r - 0.92 ) ) ) + ( 1.0 - smoothstep( 0.0, 0.02, abs( r - 0.64 ) ) ) * 0.8;
	float sectors = 16.0;
	float sector = floor( angle / 6.2831853 * sectors );
	vec2 g = vec2( fract( angle / 6.2831853 * sectors ), ( r - 0.68 ) / 0.2 );
	float stroke = 1e3;
	for ( int i = 0; i < 3; i ++ ) {
		vec2 a = labHash22( vec2( sector, float( i ) * 3.1 ) );
		vec2 b = labHash22( vec2( sector + 7.0, float( i ) * 5.7 ) );
		stroke = min( stroke, labSegment( g, vec2( 0.2 + 0.6 * a.x, 0.1 + 0.8 * a.y ), vec2( 0.2 + 0.6 * b.x, 0.1 + 0.8 * b.y ) ) );
	}
	float glyphs = ( 1.0 - smoothstep( 0.02, 0.07, stroke ) ) * step( 0.0, g.y ) * step( g.y, 1.0 );
	float sweepAngle = uActivation * 6.5831853;
	float sweep = 1.0 - smoothstep( sweepAngle - 0.3, sweepAngle, angle );
	float pulse = 0.75 + 0.25 * sin( t * 2.5 - r * 6.0 );
	float halo = exp( - abs( r - 0.92 ) * 18.0 ) * 0.35 * uActivation;
	gl_FragColor = labVfxOutput( uColor * ( ( ring + glyphs ) * sweep * pulse + halo ) * uIntensity * fade, 0.0 );
}
