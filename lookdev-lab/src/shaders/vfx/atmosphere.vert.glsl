// Atmosphere particles (env/atmosphere.js): one instanced quad per particle, nothing simulated on the CPU. An instance
// holds only a random seed; its place, drift, wander, tumble, blink and light are functions of time evaluated here, so a
// layer of thousands of particles is one draw and a few uniforms a frame.
// The field wraps in a box that follows the view on x / z and lies on the ground on y (a band above the scene's height
// map): particles are anchored in the world and new ones fade in at the box's soft edges as the view moves. Moths orbit
// light anchors instead. Particles outside the layer's zones (or between blinks) are moved off screen: no fill cost.
// TSL twin: backends/webgpu/vfx.js (#region atmosphere)
#include <lab_time>

attribute vec4 aSeed;

uniform vec3 uFocus;
uniform vec3 uBox; // x, height of the band, z (m)
uniform float uBase; // bottom of the band above the ground (m)
uniform vec3 uVelocity; // wind share + own drift (m/s)
uniform float uFall; // down through the band (m/s; < 0 rises)
uniform vec2 uWander; // amplitude (m), rate
uniform float uSkim; // 1: hugs the ground, lifted by gusts (leaves)
uniform float uTumble; // rad/s
uniform vec2 uSize; // min, max (m)
uniform float uShape; // 0 mote · 1 flake · 2 leaf · 3 wisp · 4 glow · 5 moth
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec4 uGlow; // emissive rgb (HDR), share of the particles that glow
uniform vec2 uBlink; // period (s, 0 = steady), lit part of the period
uniform float uLit; // how much of the scene's light the particle takes
uniform vec3 uAmbient;
uniform float uAlpha;
uniform float uAdditive;
uniform float uAnchorCount;
uniform vec4 uAnchors[ 8 ]; // xyz, orbit radius
uniform vec4 uZones[ 6 ]; // x, z, radius, on
uniform float uZoned;
uniform vec4 uLights[ 8 ]; // xyz, range
uniform vec4 uLightColors[ 8 ]; // rgb × intensity, decay
uniform sampler2D uGround; // ground height (m), read with texelFetch
uniform vec4 uGroundRect; // origin x, origin z, size (m), texels per side

varying vec2 vUv;
varying vec4 vColor;
varying vec3 vStyle; // shape, additive, seed
varying float vViewZ;

const float TAU = 6.28318530718;

float labAtmoGround( vec2 xz ) {
	float n = uGroundRect.w;
	vec2 t = clamp( ( xz - uGroundRect.xy ) / uGroundRect.z * n - 0.5, vec2( 0.0 ), vec2( n - 1.001 ) );
	ivec2 i = ivec2( floor( t ) );
	vec2 f = t - floor( t );
	float a = texelFetch( uGround, i, 0 ).r;
	float b = texelFetch( uGround, i + ivec2( 1, 0 ), 0 ).r;
	float c = texelFetch( uGround, i + ivec2( 0, 1 ), 0 ).r;
	float d = texelFetch( uGround, i + ivec2( 1, 1 ), 0 ).r;
	return mix( mix( a, b, f.x ), mix( c, d, f.x ), f.y );
}

// Rotation of v about a unit axis (Rodrigues).
vec3 labAtmoRotate( vec3 v, vec3 axis, float angle ) {
	float c = cos( angle );
	float s = sin( angle );
	return v * c + cross( axis, v ) * s + axis * dot( axis, v ) * ( 1.0 - c );
}

void main() {
	vec4 s = aSeed;
	float t = labTime;
	float rate = 0.65 + 0.7 * s.w;
	float ph = s.w * TAU;
	vec3 wp;
	float edge = 1.0;
	if ( uAnchorCount > 0.5 ) {
		// Moths: erratic loops round a light, a little below the flame, with a fast jitter.
		int k = int( min( floor( s.x * uAnchorCount ), uAnchorCount - 1.0 ) );
		vec4 anchor = uAnchors[ k ];
		float r = anchor.w * ( 0.35 + 0.65 * s.y );
		float q = s.z * TAU;
		wp = anchor.xyz + vec3( sin( t * ( 1.7 + s.w * 1.9 ) + q ), sin( t * ( 2.3 + s.y * 1.3 ) + q * 2.0 ) * 0.55 - 0.25, cos( t * ( 1.3 + s.z * 2.1 ) + q * 3.0 ) ) * r;
		wp += vec3( sin( t * 13.0 + q * 7.0 ), sin( t * 11.0 + q * 5.0 ), cos( t * 12.0 + q * 3.0 ) ) * 0.03;
	} else {
		float w = uWander.y * t;
		// Skimming leaves: speed 1 ± 0.8 with the gust (its integral keeps them moving forward), lifted at the gust's peak.
		float gustPhase = w * 0.7 + ph * 2.0;
		float gust = pow( 0.5 + 0.5 * cos( gustPhase ), 4.0 );
		float surge = uSkim * 0.8 * sin( gustPhase ) / max( uWander.y * 0.7, 1e-3 );
		vec3 p = s.xyz * uBox + uVelocity * rate * ( t + surge );
		p.y -= uFall * rate * t;
		p += vec3( sin( w * 1.1 + ph * 3.0 ) + 0.5 * sin( w * 2.3 + ph * 7.0 ), 0.6 * sin( w * 0.9 + ph * 5.0 ), cos( w * 0.95 + ph * 4.0 ) + 0.5 * cos( w * 2.1 + ph * 9.0 ) ) * uWander.x;
		vec2 origin = uFocus.xz - uBox.xz * 0.5;
		vec3 local = vec3( mod( p.x - origin.x, uBox.x ), mod( p.y, uBox.y ), mod( p.z - origin.y, uBox.z ) );
		local.y = mix( local.y, uBox.y * gust * ( 0.3 + 0.7 * s.y ), uSkim );
		wp = vec3( origin.x + local.x, 0.0, origin.y + local.z );
		wp.y = labAtmoGround( wp.xz ) + uBase + local.y;
		vec3 e = local / uBox;
		edge = smoothstep( 0.0, 0.12, e.x ) * ( 1.0 - smoothstep( 0.88, 1.0, e.x ) ) * smoothstep( 0.0, 0.12, e.z ) * ( 1.0 - smoothstep( 0.88, 1.0, e.z ) );
		edge *= mix( smoothstep( 0.0, 0.1, e.y ) * ( 1.0 - smoothstep( 0.8, 1.0, e.y ) ), 1.0, uSkim );
	}

	// Zones: the layer lives inside any of its circles (soft rim), nowhere else.
	float zone = 1.0;
	if ( uZoned > 0.5 ) {
		zone = 0.0;
		for ( int i = 0; i < 6; i ++ ) {
			vec4 z = uZones[ i ];
			zone = max( zone, step( 0.5, z.w ) * ( 1.0 - smoothstep( z.z * 0.6, max( z.z, 1e-3 ), distance( wp.xz, z.xy ) ) ) );
		}
	}

	// Flakes and leaves tumble in 3D about their own axis; the rest — and the glowing ones (embers) — face the camera.
	float glows = step( fract( s.x * 91.7 + s.y * 13.3 ), uGlow.a - 1e-4 );
	float size = mix( uSize.x, uSize.y, fract( s.y * 7.31 + s.z * 3.17 ) );
	vec3 corner;
	float facing = 1.0;
	if ( uShape > 0.5 && uShape < 2.5 && glows < 0.5 ) {
		vec3 axis = normalize( s.zxy - 0.5 + vec3( 0.0, 0.001, 0.0 ) );
		float angle = s.x * TAU + t * uTumble * ( 0.5 + s.w );
		corner = labAtmoRotate( vec3( position.xy, 0.0 ), axis, angle ) * size;
		facing = 0.35 + 0.65 * abs( labAtmoRotate( vec3( 0.0, 0.0, 1.0 ), axis, angle ).y );
	} else {
		float spin = s.x * TAU + t * uTumble * ( s.w - 0.5 );
		float c = cos( spin );
		float sn = sin( spin );
		vec2 q = vec2( c * position.x - sn * position.y, sn * position.x + c * position.y );
		q.x *= mix( 1.0, 0.25 + 0.75 * abs( sin( t * 31.0 + s.w * 50.0 ) ), step( 4.5, uShape ) ); // moth wings beat
		facing = mix( 1.0, 0.25 + 0.75 * pow( 0.5 + 0.5 * sin( t * ( 0.6 + 1.6 * s.y ) + s.z * TAU ), 2.0 ), step( uShape, 0.5 ) ); // motes glint as they turn
		vec3 right = vec3( viewMatrix[ 0 ][ 0 ], viewMatrix[ 1 ][ 0 ], viewMatrix[ 2 ][ 0 ] );
		vec3 up = vec3( viewMatrix[ 0 ][ 1 ], viewMatrix[ 1 ][ 1 ], viewMatrix[ 2 ][ 1 ] );
		corner = ( right * q.x + up * q.y ) * size;
	}

	// Light: the scene's nearest point / spot lights (three's distance falloff and range window) + ambient.
	vec3 light = uAmbient;
	for ( int i = 0; i < 8; i ++ ) {
		vec3 d = uLights[ i ].xyz - wp;
		float d2 = max( dot( d, d ), 0.09 ); // no closer than 0.3 m: moths at the flame stay a moth
		float x = d2 / max( uLights[ i ].w * uLights[ i ].w, 1e-4 );
		float win = clamp( 1.0 - x * x, 0.0, 1.0 );
		light += uLightColors[ i ].rgb * ( win * win / max( pow( d2, uLightColors[ i ].w * 0.5 ), 0.01 ) );
	}
	float blink = 1.0;
	if ( uBlink.x > 0.0 ) {
		float b = fract( t / uBlink.x + s.w );
		blink = smoothstep( 0.0, 0.08, b ) * ( 1.0 - smoothstep( uBlink.y * 0.7, uBlink.y, b ) );
	}
	vec3 albedo = mix( uColorA, uColorB, fract( s.z * 5.13 + s.x * 1.7 ) );
	vec3 rgb = albedo * light * ( uLit * facing * 0.31831 ) + uGlow.rgb * ( glows * blink );
	vec4 mvPosition = viewMatrix * vec4( wp + corner, 1.0 );
	// Gone within 1.5–3.5 m of a perspective camera (a mote at the lens is a blur the size of the screen); the iso camera
	// stands 60 m back.
	float alpha = uAlpha * edge * zone * mix( 1.0, blink, glows ) * smoothstep( 1.5, 3.5, - mvPosition.z );

	vUv = uv;
	vColor = vec4( rgb, alpha );
	vStyle = vec3( uShape, mix( uAdditive, 1.0, glows ), s.w );
	vViewZ = mvPosition.z;
	gl_Position = alpha < 0.002 ? vec4( 0.0, 0.0, - 2.0, 1.0 ) : projectionMatrix * mvPosition;
}
