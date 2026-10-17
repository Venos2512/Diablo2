// Fresnel rim light (selection highlight / elite aura). TSL twin: backends/webgpu/effects.js (#region rim).
#include <lab_surface>
uniform vec3 uRimColor;
uniform float uRimPower;
uniform float uRimIntensity;

vec3 labRimEmissive( vec3 viewNormal ) {
	return uRimColor * pow( labFresnelTerm( viewNormal ), uRimPower ) * uRimIntensity;
}
