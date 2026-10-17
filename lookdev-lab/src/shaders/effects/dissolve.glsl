// Dissolve: rest-pose fbm threshold with a scorched rim and an HDR burning edge (monster death / summon).
// Uses vLabObjectPos (rest-pose position in metres) declared by the patch system (backends/webgl/patches.js).
// The same function runs in the shadow depth twins, so the shadow dissolves with the mesh.
// TSL twin: backends/webgpu/effects.js (#region dissolve).
#include <lab_noise>
uniform float uDissolveProgress;
uniform float uDissolveEdge;
uniform vec3 uDissolveEdgeColor;
uniform float uDissolveEdgeIntensity;
uniform float uDissolveScale;

// Distance to the dissolve front in noise units; negative = already gone.
float labDissolveCut() {
	float n = clamp( labFbm3( vLabObjectPos * uDissolveScale ) * 0.75 + 0.5, 0.0, 1.0 );
	return n - ( uDissolveProgress * 1.2 - 0.1 );
}

// Call after the alpha test. Discards dissolved fragments; returns ( edge glow, scorch ) in 0..1.
vec2 labDissolve() {
	float cut = labDissolveCut();
	if ( cut < 0.0 ) discard;
	float started = step( 0.001, uDissolveProgress );
	float glow = ( 1.0 - smoothstep( 0.0, uDissolveEdge, cut ) ) * started;
	float scorch = ( 1.0 - smoothstep( 0.0, uDissolveEdge * 3.0, cut ) ) * started;
	return vec2( glow, scorch );
}
