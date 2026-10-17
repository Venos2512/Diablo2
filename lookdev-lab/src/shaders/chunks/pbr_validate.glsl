// lab_pbr_validate — highlights base colours outside common PBR ranges (sRGB values, see README).
// Non-metal: below 30/255 = red (too dark), above 240/255 = blue (too bright).
// Metal: below 180/255 = orange (too dark for a metal). Metalness between 0.1 and 0.9 = magenta (mixed).
// Valid pixels show the base colour as greyscale so problems stand out.
#ifndef LAB_PBR_VALIDATE_GLSL
#define LAB_PBR_VALIDATE_GLSL
vec3 labPbrValidate( vec3 albedoLinear, float metalness ) {
	vec3 s = labLinearToSRGB( albedoLinear );
	float l = labLuma( s );
	vec3 grey = vec3( labLuma( albedoLinear ) );
	if ( metalness > 0.1 && metalness < 0.9 ) return vec3( 0.75, 0.05, 0.75 );
	if ( metalness >= 0.9 ) return l < 180.0 / 255.0 ? vec3( 0.95, 0.35, 0.02 ) : grey;
	if ( l < 30.0 / 255.0 ) return vec3( 0.85, 0.02, 0.02 );
	if ( l > 240.0 / 255.0 ) return vec3( 0.02, 0.2, 0.95 );
	return grey;
}

#endif
