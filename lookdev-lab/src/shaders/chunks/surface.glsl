// lab_surface — helpers for effects patched into lit built-in materials (MeshStandard / MeshPhysical).
// Needs the material's own `vViewPosition` varying and three's `isOrthographic` uniform.
#ifndef LAB_SURFACE_GLSL
#define LAB_SURFACE_GLSL

// View-space direction from the fragment towards the camera.
vec3 labViewDirection() {
	return isOrthographic ? vec3( 0.0, 0.0, 1.0 ) : normalize( vViewPosition );
}

// 0 facing the camera, 1 at grazing angles (Schlick-style rim term without the power).
float labFresnelTerm( vec3 viewNormal ) {
	return 1.0 - clamp( dot( viewNormal, labViewDirection() ), 0.0, 1.0 );
}

#endif
