// Procedural particle shapes, soft depth fade against the scene and mixed blending in one draw:
// premultiplied output whose alpha is scaled by (1 - additive), so 1 = pure additive glow and
// 0 = regular alpha-blended smoke. TSL twin: backends/webgpu/vfx.js (#region particle).
#include <lab_noise>
#include <lab_vfx>
#include <lab_time>

varying vec2 vUv;
varying vec4 vColor;
varying vec4 vStyle;
varying float vSeed;
varying float vViewZ;

// 0 soft glow · 1 smoke puff · 2 spark streak · 3 ring · 4 flare · 5 splat (decal) · 6 shard
float labParticleShape( float shape, vec2 uv, float seed ) {
	vec2 p = uv * 2.0 - 1.0;
	float r = length( p );
	if ( shape < 0.5 ) return exp( - r * r * 4.5 ) * ( 1.0 - smoothstep( 0.85, 1.0, r ) );
	if ( shape < 1.5 ) {
		float n = labFbm3( vec3( p * 1.7 + seed * 11.0, seed * 3.0 + labTime * 0.12 ) ) * 0.5 + 0.5;
		return clamp( ( n * 1.6 - 0.4 ) * ( 1.0 - smoothstep( 0.2, 1.0, r ) ), 0.0, 1.0 );
	}
	if ( shape < 2.5 ) return exp( - p.x * p.x * 10.0 ) * ( 1.0 - smoothstep( 0.5, 1.0, abs( p.y ) ) );
	if ( shape < 3.5 ) {
		float d = ( r - 0.8 ) / 0.1;
		return exp( - d * d ) * ( 1.0 - smoothstep( 0.96, 1.0, r ) );
	}
	if ( shape < 4.5 ) return exp( - r * r * 10.0 ) + 0.4 * exp( - abs( p.x * p.y ) * 80.0 ) * ( 1.0 - smoothstep( 0.0, 1.0, r ) );
	if ( shape < 5.5 ) {
		float n = labNoise3( vec3( p * 2.2, seed * 7.0 ) ) * 0.5 + labNoise3( vec3( p * 6.0, seed * 3.0 ) ) * 0.2;
		float edge = 0.6 + 0.3 * n;
		return 1.0 - smoothstep( edge - 0.1, edge, r );
	}
	return 1.0 - smoothstep( 0.8, 1.0, abs( p.x ) * 3.0 + abs( p.y ) );
}

void main() {
	float fade = labVfxDepthFade( vViewZ, vStyle.w );
	if ( fade <= 0.0 ) discard;
	float alpha = vColor.a * labParticleShape( vStyle.x, vUv, vSeed ) * fade;
	if ( alpha < 0.002 ) discard;
	gl_FragColor = labVfxOutput( vColor.rgb * alpha, alpha * ( 1.0 - vStyle.z ) );
}
