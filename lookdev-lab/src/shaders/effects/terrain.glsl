// Terrain splat (Act I moor): three layers stacked bottom to top — dry dirt (base), wet dirt, grass —
// driven by a world-space splat map (R = wet dirt, G = grass, B = blood-soaked). Each layer's height sits in its normal map
// alpha, so transitions follow the relief: water fills the low spots of the dirt first, pebbles poke through
// the mud, soil shows between grass blades at the edges. Standing water collects in the wet layer's hollows.
// Anti-tiling: every layer is read twice with per-area UV offsets (labTerrainSample), large-scale brightness
// varies with a world noise, and the splat weights are broken up by noise inside their transition zones.
// Blood-soaked ground (B, the Remnant corruption of Weeping Fields) tints whatever lies underneath instead of
// replacing it — the soil keeps its texture and value — and draws vein lines where it is soaked through.
// Uses vLabWorldPos / vLabWorldNormal from the patch system. TSL twin: backends/webgpu/effects.js (createTerrain).
#include <lab_noise>
uniform sampler2D uTerrainSplat;
uniform vec4 uTerrainRect; // xy = splat origin (world xz), zw = 1 / splat size (metres)
uniform sampler2D uTerrainAlbedo0;
uniform sampler2D uTerrainNormal0;
uniform sampler2D uTerrainOrm0;
uniform sampler2D uTerrainAlbedo1;
uniform sampler2D uTerrainNormal1;
uniform sampler2D uTerrainOrm1;
uniform sampler2D uTerrainAlbedo2;
uniform sampler2D uTerrainNormal2;
uniform sampler2D uTerrainOrm2;
uniform vec3 uTerrainTile; // repeats per metre: dirt, wet dirt, grass
uniform float uTerrainSoftness; // transition width (0.02 sharp … 0.49 soft)
uniform float uTerrainHeightBlend; // how much layer heights bend the transitions
uniform float uTerrainWater; // water level in the wet layer's height (0 = none)
uniform float uTerrainWaterRough; // roughness of standing water
uniform float uTerrainDamp; // darker damp halo of dry dirt around wet areas
uniform float uTerrainAo; // texture AO folded into albedo
uniform float uTerrainVariation; // anti-tiling UV offsets (0 = plain repeat, 1 = full)
uniform float uTerrainMacro; // large-scale brightness variation
uniform float uTerrainEdgeNoise; // noise breakup of the layer transitions
uniform float uTerrainDebug; // 1 = show layer weights (dirt brown, wet blue, grass green)
uniform float uTerrainGrassShadow; // contact shadow of the grass mat on the ground around it + darker roots at its edge
uniform float uTerrainGrassLift; // grass wins the height blend by this much: blades lie over the soil instead of mixing
uniform vec2 uTerrainGrassShadowOffset; // world xz step toward the key light: grass there shades this spot
uniform float uTerrainBlood; // strength of the blood-soaked layer (splat B; 0 = off)
uniform vec3 uTerrainBloodColor; // multiplier on the soaked ground (linear): dark, desaturated red
uniform vec3 uTerrainVeinColor; // vein lines inside the soaked ground

struct LabTerrain {
	vec3 albedo;
	vec3 normal; // world space
	float rough;
};

struct LabTerrainLayer {
	vec4 a; // albedo
	vec4 n; // normal (xyz) + height (a)
	vec4 o; // AO, roughness, metalness
};

// Tiling breakup after Inigo Quilez ("texture repetition", technique 3): the area noise k picks one of 8
// virtual UV offsets; across each step two lookups are cross-faded, biased by their colour difference so the
// seam follows shapes. Gradients come from the plain UV, so the offset jumps cause no mip seams.
LabTerrainLayer labTerrainSample( sampler2D A, sampler2D N, sampler2D O, vec2 uv, float k ) {
	vec2 dx = dFdx( uv );
	vec2 dy = dFdy( uv );
	float l = k * 8.0;
	float ia = floor( l );
	float f = l - ia;
	vec2 offA = sin( vec2( 3.0, 7.0 ) * ia ) * uTerrainVariation;
	vec2 offB = sin( vec2( 3.0, 7.0 ) * ( ia + 1.0 ) ) * uTerrainVariation;
	vec4 aA = textureGrad( A, uv + offA, dx, dy );
	vec4 aB = textureGrad( A, uv + offB, dx, dy );
	float w = smoothstep( 0.2, 0.8, f - 0.1 * dot( aA.rgb - aB.rgb, vec3( 1.0 ) ) );
	LabTerrainLayer s;
	s.a = mix( aA, aB, w );
	s.n = mix( textureGrad( N, uv + offA, dx, dy ), textureGrad( N, uv + offB, dx, dy ), w );
	s.o = mix( textureGrad( O, uv + offA, dx, dy ), textureGrad( O, uv + offB, dx, dy ), w );
	return s;
}

// Coverage of an upper layer: weight 0 → never, 1 → always; in between the height difference decides.
float labTerrainMask( float weight, float heightDelta ) {
	float x = weight * ( 1.0 + 2.0 * uTerrainHeightBlend ) - uTerrainHeightBlend + heightDelta * uTerrainHeightBlend;
	return smoothstep( 0.5 - uTerrainSoftness, 0.5 + uTerrainSoftness, x );
}

// Noise pushes a weight around only where it is partial (0 < w < 1): edges wander, full areas stay full.
float labTerrainBreakup( float weight, float n ) {
	return clamp( weight + n * uTerrainEdgeNoise * 4.0 * weight * ( 1.0 - weight ), 0.0, 1.0 );
}

LabTerrain labTerrain( vec3 worldPos, vec3 worldNormal ) {
	vec2 st = vec2( worldPos.x, - worldPos.z ); // same mapping as the other ground meshes (u = x, v = -z)
	float k = labNoise3( vec3( st * 0.09, 1.7 ) ) * 0.5 + 0.5;
	float macro = labNoise3( vec3( st * 0.035, 4.2 ) );
	float edge = labNoise3( vec3( st * 0.55, 9.1 ) );
	LabTerrainLayer L0 = labTerrainSample( uTerrainAlbedo0, uTerrainNormal0, uTerrainOrm0, st * uTerrainTile.x, k );
	LabTerrainLayer L1 = labTerrainSample( uTerrainAlbedo1, uTerrainNormal1, uTerrainOrm1, st * uTerrainTile.y, k );
	LabTerrainLayer L2 = labTerrainSample( uTerrainAlbedo2, uTerrainNormal2, uTerrainOrm2, st * uTerrainTile.z, k );
	vec4 splat = texture2D( uTerrainSplat, ( worldPos.xz - uTerrainRect.xy ) * uTerrainRect.zw );
	float wetWeight = labTerrainBreakup( splat.r, edge );
	float grassWeight = labTerrainBreakup( splat.g, - edge );

	// Dry dirt, darkened where it borders wet ground.
	float halo = uTerrainDamp * smoothstep( 0.0, 0.7, wetWeight );
	vec3 albedo = L0.a.rgb * ( 1.0 - halo );
	vec3 nrm = L0.n.xyz;
	float h = L0.n.a;
	float rough = L0.o.g * ( 1.0 - 0.3 * halo );
	float ao = L0.o.r;

	// Wet dirt over dry dirt.
	float wet = labTerrainMask( wetWeight, L1.n.a - L0.n.a );
	albedo = mix( albedo, L1.a.rgb, wet );
	nrm = mix( nrm, L1.n.xyz, wet );
	h = mix( h, L1.n.a, wet );
	rough = mix( rough, L1.o.g, wet );
	ao = mix( ao, L1.o.r, wet );

	// Standing water in the hollows of the wet layer: dark, glossy, flat.
	float water = wet * ( 1.0 - smoothstep( uTerrainWater - 0.05, uTerrainWater, L1.n.a ) ) * step( 0.001, uTerrainWater );
	albedo = mix( albedo, albedo * 0.4, water );
	nrm = mix( nrm, vec3( 0.5, 0.5, 1.0 ), water );
	rough = mix( rough, uTerrainWaterRough, water );
	ao = mix( ao, 1.0, water );

	// Grass over everything.
	float grass = labTerrainMask( grassWeight, L2.n.a - h + uTerrainGrassLift );

	// Grass reads as a raised mat: the ground next to it sits in its contact shadow (wider toward the side away
	// from the light: one splat tap toward the light), and the blades darken toward their roots at the edge.
	float towardLight = texture2D( uTerrainSplat, ( worldPos.xz + uTerrainGrassShadowOffset - uTerrainRect.xy ) * uTerrainRect.zw ).g;
	float under = max( smoothstep( 0.08, 0.6, grassWeight ), smoothstep( 0.25, 0.8, towardLight ) * 0.85 ) * ( 1.0 - grass );
	float roots = 4.0 * grass * ( 1.0 - grass ) * ( 1.0 - L2.n.a ); // only along the visible edge of the mat
	albedo *= 1.0 - uTerrainGrassShadow * under;
	albedo = mix( albedo, L2.a.rgb * ( 1.0 - uTerrainGrassShadow * roots ), grass );
	nrm = mix( nrm, L2.n.xyz, grass );
	rough = mix( rough, L2.o.g, grass );
	ao = mix( ao, L2.o.r, grass );

	// Blood-soaked ground over everything: a tint (texture and value survive), a little wetter, vein lines
	// (ridged noise) only where it is soaked through.
	float soak = smoothstep( 0.15, 0.85, labTerrainBreakup( splat.b, edge * 0.7 ) ) * uTerrainBlood;
	float vein = ( 1.0 - smoothstep( 0.0, 0.06, abs( labNoise3( vec3( st * 0.9, 3.3 ) ) ) ) ) * smoothstep( 0.45, 0.95, splat.b );
	albedo = mix( albedo, albedo * uTerrainBloodColor, soak );
	albedo = mix( albedo, uTerrainVeinColor, vein * soak );
	rough *= mix( 1.0, 0.7, soak );

	albedo *= mix( 1.0, ao, uTerrainAo ) * ( 1.0 + macro * uTerrainMacro );
	if ( uTerrainDebug > 0.5 ) albedo = mix( mix( mix( vec3( 0.45, 0.28, 0.15 ), vec3( 0.08, 0.22, 0.6 ), wet ), vec3( 0.2, 0.55, 0.12 ), grass ), vec3( 0.6, 0.04, 0.05 ), soak );

	// Tangent frame of a world-UV heightfield: T = +x, B = -z (follows the slope through N).
	vec3 N = normalize( worldNormal );
	vec3 T = normalize( vec3( 1.0, 0.0, 0.0 ) - N * N.x );
	vec3 B = cross( N, T );
	vec3 tn = nrm * 2.0 - 1.0;

	LabTerrain t;
	t.albedo = albedo;
	t.normal = normalize( T * tn.x + B * tn.y + N * tn.z );
	t.rough = rough;
	return t;
}
