// Character rim light for the Act I moods (Diablo III style): a fresnel term weighted towards the upper
// silhouette (moonlight from above), added as emission so the hero separates from a dark scene.
// TSL twin: backends/webgpu/effects.js (createHeroRim).
#include <lab_surface>
uniform vec3 uHeroRimColor;
uniform float uHeroRimIntensity;
uniform float uHeroRimPower;
uniform float uHeroRimBias; // 0 = even all around, 1 = only the upper silhouette

vec3 labHeroRim( vec3 viewNormal ) {
	float rim = pow( labFresnelTerm( viewNormal ), uHeroRimPower );
	float top = clamp( viewNormal.y * 0.5 + 0.5, 0.0, 1.0 );
	return uHeroRimColor * ( rim * mix( 1.0, top, uHeroRimBias ) * uHeroRimIntensity );
}
