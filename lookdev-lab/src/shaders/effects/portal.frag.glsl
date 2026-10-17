// Town portal: swirling oval. The inside darkens what is behind it (premultiplied alpha), the rim and
// the vortex add HDR light for bloom. TSL twin: backends/webgpu/effects.js (#region portal).
#include <lab_noise>
#include <lab_vfx>
#include <lab_time>
uniform vec3 uColor;
uniform float uIntensity;
uniform float uSwirl;
uniform float uSpeed;
varying vec2 vUv;
varying float vViewZ;

void main() {
	float fade = labVfxDepthFade( vViewZ, 0.2 );
	if ( fade <= 0.0 ) discard;
	vec2 p = ( vUv - 0.5 ) * 2.0; // ellipse inscribed in the quad
	float r = length( p );
	if ( r > 1.08 ) discard;
	float t = labTime * uSpeed;
	float swirl = atan( p.y, p.x ) + r * uSwirl - t * 1.3;
	float n = labFbm3( vec3( cos( swirl ) * r * 2.0, sin( swirl ) * r * 2.0, t * 0.4 ) ) * 0.5 + 0.5;
	float bands = sin( swirl * 3.0 + n * 4.0 ) * 0.5 + 0.5;
	float rim = smoothstep( 0.72, 0.96, r ) * ( 1.0 - smoothstep( 0.96, 1.08, r ) );
	float inner = 1.0 - smoothstep( 0.75, 1.0, r );
	vec3 glow = uColor * ( rim * 2.0 + inner * ( 0.12 + bands * n * 0.7 ) ) * uIntensity;
	vec3 core = mix( uColor * 0.15, vec3( 0.9, 0.97, 1.0 ), ( 1.0 - smoothstep( 0.0, 0.35, r ) ) * n ) * inner;
	gl_FragColor = labVfxOutput( ( glow + core ) * fade, inner * 0.75 * fade );
}
