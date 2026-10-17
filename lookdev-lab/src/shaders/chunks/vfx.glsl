// lab_vfx — helpers for materials rendered in the VFX layer (separate premultiplied target).
// Scene depth comes from the opaque pass; there is no depth buffer in the VFX target, so occlusion
// and soft-particle fades are computed here (identical maths in the TSL version).
#ifndef LAB_VFX_GLSL
#define LAB_VFX_GLSL
#include <packing>

uniform sampler2D uSceneDepth;
uniform vec2 uVfxSize;
uniform float uCameraNear;
uniform float uCameraFar;
uniform float uOrtho;
uniform float uOverdraw;

float labSceneViewZ() {
	float depth = texture2D( uSceneDepth, gl_FragCoord.xy / uVfxSize ).r;
	return uOrtho > 0.5 ? orthographicDepthToViewZ( depth, uCameraNear, uCameraFar ) : perspectiveDepthToViewZ( depth, uCameraNear, uCameraFar );
}

// 0 when hidden behind opaque geometry, ramps to 1 over `softness` metres in front of it.
float labVfxDepthFade( float fragViewZ, float softness ) {
	return clamp( ( fragViewZ - labSceneViewZ() ) / max( softness, 1e-3 ), 0.0, 1.0 );
}

// Overdraw debug view: every fragment adds a fixed amount so stacked layers read as heat.
vec4 labVfxOutput( vec3 premultipliedRgb, float alpha ) {
	if ( uOverdraw > 0.5 ) return vec4( 0.06, 0.025, 0.004, 0.0 );
	return vec4( premultipliedRgb, alpha );
}

#endif
