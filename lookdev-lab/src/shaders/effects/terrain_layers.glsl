// N-layer terrain (ASHLAR biome mix): up to 8 painted ground layers read from three texture ARRAYS (albedo, OpenGL normal + height in A,
// ORM: G = roughness) and blended in priority order (layer 0 = base, a higher layer covers the ones below it) by a two-texture splat:
// uTLSplat0 = layers 1..4 (RGBA), uTLSplat1 = layers 5..7 (RGB) + wetness (A). The blend is the lab terrain's own (terrain.glsl): per layer
// a coverage weight, bent by the height difference to what lies below (uTLHeightBlend), softened by uTLSoftness, broken up by edge noise.
// Per layer (uTLParams[i]): x = repeats per metre, y = normal strength, z = anti-tiling (-1 off, 0 offsets only, 1 + quarter turns, 2 + half
// turns), w = the layer's slice in the arrays. Wetness darkens and glosses the ground; where it is high and the blended height sinks below the
// water level, puddles: dark tint, flat normal, mirror-like roughness. A layer whose weight is ~0 is not sampled (the sample is in an `if`).
// Uses vLabWorldPos / vLabWorldNormal from the patch system. TSL twin: backends/webgpu/effects.js (createTerrainLayers).
// The effect prepends `#define LAB_TL_COUNT n` (number of layers, 2..8).
#include <lab_noise>
#include <lab_time>
uniform sampler2DArray uTLMap;
uniform sampler2DArray uTLNormal;
uniform sampler2DArray uTLOrm;
uniform sampler2D uTLSplat0;
uniform sampler2D uTLSplat1;
uniform vec4 uTLRect; // xy = splat origin (world xz), zw = 1 / splat size (metres)
uniform vec4 uTLParams[LAB_TL_COUNT];
uniform vec4 uTLParams2[LAB_TL_COUNT]; // xyz = the layer's mean albedo (linear), w = porosity (how much it darkens / glosses when wet)
uniform float uTLContrast; // 0 = plain linear cross-fades, 1 = variance-preserving ones (no grey, muddy midpoint)
uniform vec3 uTLMacroCool; // macro colour variation: the ground is multiplied by a low-frequency blend of these two (palette-bounded)
uniform vec3 uTLMacroWarm;
uniform vec3 uTLSky; // what puddles mirror (linear sky colour x intensity)
uniform float uTLPuddleRefl; // strength of that mirror (a Fresnel floor of 0.05, rising toward grazing angles)
uniform float uTLRain; // 0..1 ripples in the puddles
uniform float uTLSoftness; // transition width (0.02 sharp … 0.49 soft)
uniform float uTLHeightBlend; // how much layer heights bend the transitions
uniform float uTLEdgeNoise; // noise breakup of the transitions
uniform float uTLVariation; // anti-tiling UV offsets (0 = plain repeat everywhere)
uniform float uTLVariationScale; // frequency (per metre) of the area noise that picks the variant
uniform float uTLMacro; // large-scale brightness variation
uniform float uTLWater; // puddle level in the puddle field (0 = no puddles)
uniform float uTLWaterY; // world y of the pond's surface (a very low number: no pond): the ground below it gets no puddles, no wet halo, and darkens with depth
uniform float uTLPuddleCompress; // soft-compression strength of the lit colour above a knee (0.08) on puddle pixels (the sun on a satin film must not burn out to white)
uniform float uTLWaterRough; // roughness of puddles
uniform float uTLWetDarken; // how much full wetness darkens the ground
uniform float uTLRoughMin; // floor of the ground's own roughness (the baked puddle gloss of some tiles is the shader's job)
uniform float uTLWetRough; // roughness multiplier of fully wet porous ground (< 1 = glossier)
uniform vec3 uTLPuddleTint; // multiplier on the ground under a puddle
uniform vec4 uTLLantern; // xyz = centre of the radial lantern (world), w = radius (m)
uniform vec4 uTLLanternP; // x = falloff band (m), y = strength of the warm light on the albedo (0 = off), z = how much the ground outside the pool is dimmed
uniform vec3 uTLLanternColor;
uniform float uTLDebug; // 1 = false colour per layer (+ wetness blue, puddles cyan)

struct LabTL {
	vec3 albedo;
	vec3 normal; // world space
	float rough;
	float pud; // puddle coverage 0..1 (the lit colour is soft-compressed by it, see the effect's opaque_fragment hook)
	float specK; // scale of the specular (F0 and F90) of the physical material: damped on a puddle's half-wet edge, where the sun's broad lobe is the white outline
	vec3 glow; // faint sky mirror of the puddles, added as emission (never lit by the sun)
};

vec2 labTLTurn( vec2 v, float q ) {
	float c = cos( q * 1.5707963 );
	float s = sin( q * 1.5707963 );
	return vec2( c * v.x - s * v.y, s * v.x + c * v.y );
}

// One layer: albedo, normal (xyz 0..1, height in w) and roughness. Two reads with per-area offsets (and quarter / half turns) cross-faded,
// biased by their colour difference (labTerrainSample in terrain.glsl); gradients turn with the UV so the jumps cause no mip seams. The
// gradients come from the caller (derivatives are not valid inside the `if` that skips unused layers).
void labTLSample( int i, vec2 st, vec2 dxs, vec2 dys, float k, out vec4 a, out vec4 n, out float rough ) {
	vec4 P = uTLParams[i];
	vec2 uv = st * P.x;
	vec2 dx = dxs * P.x;
	vec2 dy = dys * P.x;
	float layer = P.w;
	float vr = uTLVariation * step( -0.5, P.z );
	float rt = step( 0.5, P.z ) * step( 0.001, uTLVariation );
	if ( vr < 0.001 && rt < 0.5 ) {
		a = textureGrad( uTLMap, vec3( uv, layer ), dx, dy );
		n = textureGrad( uTLNormal, vec3( uv, layer ), dx, dy );
		n.xy = ( n.xy * 2.0 - 1.0 ) * P.y * 0.5 + 0.5;
		rough = textureGrad( uTLOrm, vec3( uv, layer ), dx, dy ).g;
		return;
	}
	float l = k * 8.0;
	float ia = floor( l );
	float f = l - ia;
	float half_ = step( 1.5, P.z );
	vec2 offA = sin( vec2( 3.0, 7.0 ) * ia ) * vr;
	vec2 offB = sin( vec2( 3.0, 7.0 ) * ( ia + 1.0 ) ) * vr;
	float qA = mix( mod( ia * 3.0, 4.0 ), mod( ia * 3.0, 2.0 ) * 2.0, half_ ) * rt;
	float qB = mix( mod( ( ia + 1.0 ) * 3.0, 4.0 ), mod( ( ia + 1.0 ) * 3.0, 2.0 ) * 2.0, half_ ) * rt;
	vec2 uvA = labTLTurn( uv, qA ) + offA;
	vec2 uvB = labTLTurn( uv, qB ) + offB;
	vec2 dxA = labTLTurn( dx, qA );
	vec2 dyA = labTLTurn( dy, qA );
	vec2 dxB = labTLTurn( dx, qB );
	vec2 dyB = labTLTurn( dy, qB );
	vec4 aA = textureGrad( uTLMap, vec3( uvA, layer ), dxA, dyA );
	vec4 aB = textureGrad( uTLMap, vec3( uvB, layer ), dxB, dyB );
	float w = smoothstep( 0.2, 0.8, f - 0.1 * dot( aA.rgb - aB.rgb, vec3( 1.0 ) ) );
	vec4 nA = textureGrad( uTLNormal, vec3( uvA, layer ), dxA, dyA );
	vec4 nB = textureGrad( uTLNormal, vec3( uvB, layer ), dxB, dyB );
	nA.xy = labTLTurn( nA.xy * 2.0 - 1.0, - qA ) * 0.5 + 0.5;
	nB.xy = labTLTurn( nB.xy * 2.0 - 1.0, - qB ) * 0.5 + 0.5;
	a = mix( aA, aB, w );
	n = mix( nA, nB, w );
	n.xy = ( n.xy * 2.0 - 1.0 ) * P.y * 0.5 + 0.5;
	rough = mix( textureGrad( uTLOrm, vec3( uvA, layer ), dxA, dyA ).g, textureGrad( uTLOrm, vec3( uvB, layer ), dxB, dyB ).g, w );
}

// Coverage of an upper layer: weight 0 → never, 1 → always; in between the height difference decides.
float labTLMask( float weight, float heightDelta ) {
	float x = weight * ( 1.0 + 2.0 * uTLHeightBlend ) - uTLHeightBlend + heightDelta * uTLHeightBlend;
	return smoothstep( 0.5 - uTLSoftness, 0.5 + uTLSoftness, x );
}

float labTLBreakup( float weight, float n ) {
	return clamp( weight + n * uTLEdgeNoise * 4.0 * weight * ( 1.0 - weight ), 0.0, 1.0 );
}

// Rain ripples: one drop per 1.25 m cell, restarting every ~1.7 s; the gradient of an outgoing damped ring (xy, 0 where there is none).
vec2 labTLRipple( vec2 p ) {
	vec2 q = p * 0.8;
	vec2 cell = floor( q );
	vec2 f = fract( q ) - 0.5;
	float r = fract( sin( dot( cell, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 );
	float t = fract( labTime * 0.6 + r );
	vec2 d = f - vec2( r - 0.5, fract( r * 7.13 ) - 0.5 ) * 0.5;
	float dist = length( d );
	float ring = sin( ( dist - t * 0.45 ) * 38.0 ) * exp( - abs( dist - t * 0.45 ) * 14.0 ) * ( 1.0 - t );
	return d / max( dist, 1e-3 ) * ring * 0.35;
}

vec3 labTLDebugColor( int i ) {
	if ( i == 0 ) return vec3( 0.45, 0.28, 0.15 );
	if ( i == 1 ) return vec3( 0.55, 0.12, 0.12 );
	if ( i == 2 ) return vec3( 0.85, 0.65, 0.15 );
	if ( i == 3 ) return vec3( 0.55, 0.8, 0.2 );
	if ( i == 4 ) return vec3( 0.1, 0.6, 0.2 );
	if ( i == 5 ) return vec3( 0.05, 0.35, 0.3 );
	if ( i == 6 ) return vec3( 0.6, 0.3, 0.8 );
	return vec3( 0.9, 0.9, 0.9 );
}

LabTL labTerrainLayers( vec3 worldPos, vec3 worldNormal ) {
	vec2 st = vec2( worldPos.x, - worldPos.z ); // same mapping as the other ground meshes (u = x, v = -z)
	vec2 dxs = dFdx( st );
	vec2 dys = dFdy( st );
	float k = labNoise3( vec3( st * uTLVariationScale, 1.7 ) ) * 0.5 + 0.5;
	float macro = labNoise3( vec3( st * 0.035, 4.2 ) );
	float edge = labNoise3( vec3( st * 0.55, 9.1 ) );
	vec2 suv = ( worldPos.xz - uTLRect.xy ) * uTLRect.zw;
	vec4 s0 = texture2D( uTLSplat0, suv );
	vec4 s1 = texture2D( uTLSplat1, suv );
	float W[8] = float[8]( 1.0, s0.r, s0.g, s0.b, s0.a, s1.r, s1.g, s1.b );
	float wet = s1.a;

	vec4 a;
	vec4 n;
	float r;
	labTLSample( 0, st, dxs, dys, k, a, n, r );
	vec3 albedo = a.rgb;
	vec3 nrm = n.xyz;
	float h = n.a;
	float rough = r;
	vec3 mu = uTLParams2[0].rgb; // running mean of what the albedo blends, for the variance-preserving cross-fades
	float por = uTLParams2[0].w;
	// Low-frequency height for the puddles: the blended layers' height read at a coarse mip (8x the gradient), only where there is wetness to show it. A puddle follows the
	// ground's broad hollows, not the texel-scale relief (that gave hundreds of islands per tile, repeating with it).
	// The gradient is 8x the pixel's, and never finer than ~0.1 m of the world, so the outlines do not shift with the resolution or the zoom.
	bool wetHere = wet > 0.3;
	float gs = max( 8.0, 0.1 / max( max( length( dxs ), length( dys ) ), 1e-5 ) );
	float hb = 0.5;
	if ( wetHere ) hb = textureGrad( uTLNormal, vec3( st * uTLParams[0].x, uTLParams[0].w ), dxs * uTLParams[0].x * gs, dys * uTLParams[0].x * gs ).a;
	float fw[8] = float[8]( 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0 ); // final weight per layer (debug view)
	for ( int i = 1; i < LAB_TL_COUNT; i ++ ) {
		if ( W[i] < 0.004 ) continue; // ~0 weight: this layer is not read here
		labTLSample( i, st, dxs, dys, k, a, n, r );
		float m = labTLMask( labTLBreakup( W[i], ( i % 2 == 0 ) ? edge : - edge ), n.a - h ) * smoothstep( 0.0, 0.03, W[i] );
		vec3 mu2 = mix( mu, uTLParams2[i].rgb, m );
		float gain = inversesqrt( ( 1.0 - m ) * ( 1.0 - m ) + m * m ); // a plain mix shrinks the contrast by this much at the midpoint
		albedo = max( mu2 + ( mix( albedo, a.rgb, m ) - mu2 ) * mix( 1.0, gain, uTLContrast ), 0.0 );
		mu = mu2;
		por = mix( por, uTLParams2[i].w, m );
		nrm = mix( nrm, n.xyz, m );
		h = mix( h, n.a, m );
		rough = mix( rough, r, m );
		if ( wetHere ) hb = mix( hb, textureGrad( uTLNormal, vec3( st * uTLParams[i].x, uTLParams[i].w ), dxs * uTLParams[i].x * gs, dys * uTLParams[i].x * gs ).a, m );
		if ( uTLDebug > 0.5 ) {
			for ( int j = 0; j < i; j ++ ) fw[j] *= 1.0 - m;
			fw[i] = m;
		}
	}

	rough = max( rough, uTLRoughMin );
	// Macro colour: palette-bounded warm / cool drift over ~45 m, and the value drift.
	albedo *= mix( uTLMacroCool, uTLMacroWarm, macro * 0.5 + 0.5 ) * ( 1.0 + macro * uTLMacro );

	vec3 N = normalize( worldNormal );
	vec3 V = normalize( cameraPosition - worldPos );

	// Wet ground (Lagarde): how wet x how porous. Water in the pores darkens the mid-tones most and saturates a little, and smooths the surface.
	float wetK = smoothstep( 0.05, 0.9, wet );
	float sub = 1.0 - smoothstep( uTLWaterY - 0.04, uTLWaterY + 0.01, worldPos.y ); // below the pond's surface: the water mesh covers it
	float level = uTLWater * smoothstep( 0.35, 0.95, wet ); // puddles fill the low spots first as it gets wetter;
	float gate = step( 0.001, uTLWater ) * smoothstep( 0.35, 0.5, wet ) * ( 1.0 - sub );
	float depth = 0.0;
	float halo = 0.0;
	if ( gate > 0.001 ) {
		// the puddle field: world-space noise (~0.7 / m and ~1.9 / m: organic, 1-3 m shapes) leaning 30 % on the coarse height of the ground
		float field = 0.5 + 0.5 * clamp( 2.0 * ( labNoise3( vec3( st * 0.7, 3.3 ) ) * 0.7 + labNoise3( vec3( st * 1.9, 5.1 ) ) * 0.3 ), - 1.0, 1.0 ); // noise std ~0.3: x2 uses the range
		float hq = mix( field, hb, 0.3 );
		depth = ( level - hq ) * gate;
		halo = pow( 1.0 - smoothstep( level - 0.02, level + 0.45, hq ), 1.5 ) * gate * 0.85; // the ground round a puddle is soaked too: a ~30 cm ring
	}
	// A soft shore: 0.15 field units (~10-15 cm), and never narrower than ~2 px at any distance (the field's gradient is ~1.3 / m).
	float pud = smoothstep( 0.0, max( 0.15, 2.6 * max( length( dxs ), length( dys ) ) ), depth );
	float wetAmt = max( max( wetK, sub ), halo ) * por; // below the waterline the ground is soaked through
	float lum = dot( albedo, vec3( 0.2126, 0.7152, 0.0722 ) );
	albedo *= 1.0 - uTLWetDarken * wetAmt * ( 0.55 + 0.45 * smoothstep( 0.02, 0.25, lum ) );
	albedo = max( mix( vec3( lum ) * ( 1.0 - uTLWetDarken * wetAmt ), albedo, 1.0 + 0.3 * wetAmt ), 0.0 ); // the extrapolation toward saturation must not go negative
	rough = mix( rough, rough * uTLWetRough, wetAmt );
	// the pond's floor: matte, darker with depth (the water mesh above is mostly transparent, a pale floor would show through)
	albedo *= mix( 1.0, exp( - 2.5 * max( uTLWaterY - worldPos.y, 0.0 ) ), sub );
	rough = mix( rough, 1.0, sub );

	// Puddles: a flat, blue-grey film (wet albedo x tint: darker than the mud round it, not black), flat by depth (a thin film keeps the relief), glossy only once the film
	// is complete (a half-gloss edge throws the sun as a white outline: gloss ramps in at 0.45-0.8 coverage, and the specular is damped on the way), with a faint
	// always-on micro-ripple so the sun breaks into small sparkles, rain rings on top; the sky is an emissive mirror (Fresnel 0.05 + 0.95 (1 - N.V)^4), never albedo.
	nrm = mix( nrm, vec3( 0.5, 0.5, 1.0 ), smoothstep( 0.1, 0.6, pud ) );
	if ( pud > 0.01 ) {
		vec2 pp = worldPos.xz;
		nrm.xy += vec2( labNoise3( vec3( pp * 5.0, labTime * 0.4 ) ), labNoise3( vec3( pp * 5.0 + 31.7, labTime * 0.4 + 9.0 ) ) ) * 0.05 * pud;
	}
	if ( uTLRain > 0.001 ) nrm.xy += labTLRipple( worldPos.xz ) * uTLRain * pud * 0.5;
	float fres = 0.05 + 0.95 * pow( 1.0 - clamp( dot( N, V ), 0.0, 1.0 ), 4.0 );
	albedo = mix( albedo, albedo * uTLPuddleTint, pud );
	rough = mix( rough, uTLWaterRough, smoothstep( 0.45, 0.8, pud ) );
	float specK = 1.0 - 0.95 * smoothstep( 0.02, 0.25, pud ) * ( 1.0 - smoothstep( 0.8, 0.88, pud ) );
	vec3 glow = uTLSky * ( fres * uTLPuddleRefl * pud );

	if ( uTLDebug > 0.5 ) {
		vec3 dbg = vec3( 0.0 );
		for ( int i = 0; i < LAB_TL_COUNT; i ++ ) dbg += fw[i] * labTLDebugColor( i );
		dbg = mix( dbg, vec3( 0.0, 0.3, 1.0 ), wetAmt * 0.5 );
		albedo = mix( dbg, vec3( 0.0, 1.0, 1.0 ), pud );
	}

	// Tangent frame of a world-UV heightfield: T = +x, B = -z (follows the slope through N).
	vec3 T = normalize( vec3( 1.0, 0.0, 0.0 ) - N * N.x );
	vec3 B = cross( N, T );
	vec3 tn = nrm * 2.0 - 1.0;

	LabTL t;
	t.albedo = albedo;
	t.normal = normalize( T * tn.x + B * tn.y + N * tn.z );
	t.rough = rough;
	t.pud = pud;
	t.specK = specK;
	t.glow = glow;
	return t;
}
