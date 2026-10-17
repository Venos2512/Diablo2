// Procedural flame: fbm-distorted teardrop, hot core near the base, HDR output for bloom.
#include <lab_noise>
#include <lab_vfx>

#include <lab_time>
uniform float uIntensity;
uniform vec3 uCoreColor;
uniform vec3 uEdgeColor;
uniform float uTurbulence;
uniform float uSpeed;

varying vec2 vUv;
varying float vSeed;
varying float vIntensity;
varying float vViewZ;

void main() {
	float fade = labVfxDepthFade( vViewZ, 0.12 );
	if ( fade <= 0.0 ) discard;
	vec2 uv = vUv;
	float t = labTime * uSpeed + vSeed * 17.0;
	float n = labFbm3( vec3( uv.x * 3.0, uv.y * 2.4 - t * 1.7, t * 0.35 + vSeed ) );
	float n2 = labNoise3( vec3( uv.x * 7.0, uv.y * 6.0 - t * 3.1, vSeed * 3.0 ) );
	float x = uv.x - 0.5 + ( n * 0.16 + n2 * 0.05 ) * uTurbulence * uv.y;
	float width = 0.34 * pow( 1.0 - uv.y, 1.1 ) + 0.02;
	float body = 1.0 - smoothstep( width * 0.45, width, abs( x ) );
	float base = smoothstep( 0.0, 0.12, uv.y );
	float top = 1.0 - smoothstep( 0.45, 0.95, uv.y + n * 0.22 );
	float flame = body * base * top;
	float core = smoothstep( 0.45, 1.0, flame ) * ( 1.0 - smoothstep( 0.05, 0.55, uv.y ) );
	vec3 color = mix( uEdgeColor, uCoreColor, core ) * flame * uIntensity * vIntensity;
	gl_FragColor = labVfxOutput( color * fade, 0.0 );
}
