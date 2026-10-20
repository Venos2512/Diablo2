// Ground blend: assets standing on the terrain take on the ground where they meet it, so a rock, a trunk, a post or a
// mud patch seems to sit in the soil instead of on it. The terrain's own material is captured top-down around the
// camera (env/groundBlend.js: albedo + roughness, world normal + height); every asset fragment reads it at its world xz.
//  · Band: near the ground the asset's albedo, roughness and shading normal fade into the ground's under a wavy,
//    noise-broken edge (dark grooves of the asset's texture fill first). The band is as tall as the face is steep — a
//    vertical face gets the whole band, a gently sloping rim only a sliver — so the transition is about as wide across
//    the ground for a cliff face as for a mud patch, and flat decals lying on the ground keep their own look; and never
//    more than a fraction of the asset's local relief (labGround.y), so a pebble or a root tip keeps its shape. Up the band
//    the ground is read further out along the face's normal (the ground unrolled up the face) instead of streaking the
//    texel under the seam.
//  · Top: upward-facing parts above the band take the ground too (dust and moss on rock tops; rocks side by side share
//    one cover). Scaled per material (uGroundProfile.x).
//  · Contact: where assets touch each other (rock on rock, trunk on rock, a barrel against a crate) the crevice fills with
//    ground and darkens: a per-vertex proximity baked by env/contact.js (attribute labGround.x), fading out with height
//    above the ground. Scaled per material (uGroundProfile.y).
// Uses vLabWorldPos / vLabWorldNormal from the patch system. TSL twin: backends/webgpu/effects.js (createGroundBlend).
#include <lab_noise>
#include <lab_common>
uniform sampler2D uGroundA; // rgb = sqrt( albedo ), a = roughness
uniform sampler2D uGroundB; // rg = world normal xz * 0.5 + 0.5, b = ground height (m), a = 1 where the ground was drawn
uniform vec4 uGroundRect; // xy = capture origin (world xz), zw = 1 / capture size (m)
uniform vec4 uGroundBand; // x = band height (m), y = transition width across the ground (m), z = edge noise, w = strength
uniform vec4 uGroundLayers; // x = normal blend, y = top cover, z = contact fill, w = darkening (contacts, soil line)
uniform vec4 uGroundMore; // x = unroll, y = contact height (m), z = debug view, w = edge softness (fraction of the band)
uniform float uGroundFraction; // the band is at most this fraction of the asset's height
uniform vec3 uGroundProfile; // per material: x = top cover ×, y = contact fill ×, z = band ×
varying vec2 vLabGround; // x = contact with another asset (0..1), y = local relief of the asset (m, env/contact.js)

struct LabGround {
	vec3 albedo; // ground albedo (linear)
	vec3 normal; // ground normal (world)
	float rough;
	float weight; // 0 = the asset as authored … 1 = ground
	float normalWeight;
	float shade; // darkening of crevices and of the soil line (multiplier)
	vec3 debug; // band (red), top (green), contact (blue)
};

// Capture texture coordinates of a world xz (the capture camera looks down with -z up the image).
vec2 labGroundUv( vec2 xz ) {
	return vec2( ( xz.x - uGroundRect.x ) * uGroundRect.z, 1.0 - ( xz.y - uGroundRect.y ) * uGroundRect.w );
}

LabGround labGroundBlend( vec3 wp, vec3 n, vec3 albedo, vec2 data ) {
	vec2 uv = labGroundUv( wp.xz );
	vec4 below = texture2D( uGroundB, uv );
	float lift = wp.y - below.b;
	vec2 border = smoothstep( vec2( 0.0 ), vec2( 0.04 ), uv ) * smoothstep( vec2( 0.0 ), vec2( 0.04 ), 1.0 - uv );
	float inside = below.a * border.x * border.y;

	// Edge noise: mostly along the ground (the soil line wanders), a finer octave on top.
	float wave = labNoise3( vec3( wp.xz * 1.9, wp.y * 0.7 ) ) * 0.65 + labNoise3( wp * 7.3 + 5.1 ) * 0.35;
	float ny = clamp( n.y, 0.0, 1.0 );
	float slope = n.y < 0.0 ? 20.0 : sqrt( max( 1.0 - ny * ny, 0.0 ) ) / max( ny, 0.05 ); // tan of the face's slope; overhangs count as steep
	float band = min( min( uGroundBand.x * uGroundProfile.z, data.y * uGroundFraction ), uGroundBand.y * slope ) * max( 1.0 + wave * uGroundBand.z, 0.0 );
	float groove = smoothstep( 0.01, 0.12, labLuma( albedo ) ) - 0.5;
	float h = lift + groove * band * 0.6 * uGroundBand.z;
	float soft = max( band * uGroundMore.w, 0.004 );
	float wBand = 1.0 - smoothstep( band - soft, band + soft, h );

	float wTop = smoothstep( 0.6, 0.9, n.y + wave * 0.2 ) * smoothstep( 0.1, 0.3, lift ) * smoothstep( -0.35, 0.25, wave ) * uGroundLayers.y * uGroundProfile.x;
	float touch = smoothstep( 0.35, 1.0, data.x ) * ( 1.0 - smoothstep( uGroundMore.y * 0.5, uGroundMore.y + 0.01, lift ) ) * uGroundProfile.y;
	float wContact = touch * smoothstep( -0.6, 0.4, wave ) * uGroundLayers.z;

	LabGround g;
	float strength = uGroundBand.w * inside;
	g.weight = clamp( max( max( wBand, wTop ), wContact ), 0.0, 1.0 ) * strength;
	// The shading normal turns to the ground's only low in the band (higher up, a face lit like flat ground would read
	// as a bright sock round a trunk), and never on faces looking down (half way to an opposite normal is no normal).
	g.normalWeight = max( wBand * wBand, wTop ) * strength * uGroundLayers.x * smoothstep( -0.5, 0.0, n.y );
	float line = 4.0 * wBand * ( 1.0 - wBand ); // the soil line: damp, darker where the ground ends on the asset
	g.shade = 1.0 - ( touch * 0.8 + line * 0.6 ) * uGroundLayers.w * strength;
	g.debug = vec3( wBand, wTop, wContact ) * inside;

	// The ground unrolled up the face: read further out along the normal the higher the fragment (steep faces only).
	vec2 at = wp.xz + n.xz * clamp( lift, 0.0, uGroundBand.x * 2.0 ) * uGroundMore.x;
	vec4 A = texture2D( uGroundA, labGroundUv( at ) );
	vec4 B = texture2D( uGroundB, labGroundUv( at ) );
	g.albedo = A.rgb * A.rgb;
	g.rough = A.a;
	vec2 gn = B.rg * 2.0 - 1.0;
	g.normal = normalize( vec3( gn.x, sqrt( max( 1.0 - dot( gn, gn ), 0.0 ) ), gn.y ) );
	return g;
}
