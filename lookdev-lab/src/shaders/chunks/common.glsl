// lab_common — small helpers shared by post and material shaders.
#ifndef LAB_COMMON_GLSL
#define LAB_COMMON_GLSL

float labLuma( vec3 c ) {
	return dot( c, vec3( 0.2126, 0.7152, 0.0722 ) );
}

float labRemap( float v, float a, float b, float c, float d ) {
	return c + ( v - a ) * ( d - c ) / ( b - a );
}

vec3 labSRGBToLinear( vec3 c ) {
	return mix( pow( c * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), c * 0.0773993808, vec3( lessThanEqual( c, vec3( 0.04045 ) ) ) );
}

vec3 labLinearToSRGB( vec3 c ) {
	c = max( c, vec3( 0.0 ) );
	return mix( pow( c, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), c * 12.92, vec3( lessThanEqual( c, vec3( 0.0031308 ) ) ) );
}

// Exposure false colour: EV relative to 18% grey, banded like on-set monitors.
vec3 labFalseColor( float luminance ) {
	float ev = log2( max( luminance, 1e-6 ) / 0.18 );
	if ( ev < - 6.0 ) return vec3( 0.18, 0.0, 0.28 );
	if ( ev < - 4.0 ) return vec3( 0.05, 0.12, 0.65 );
	if ( ev < - 2.0 ) return vec3( 0.0, 0.45, 0.55 );
	if ( ev < - 0.5 ) return vec3( 0.12, 0.55, 0.15 );
	if ( ev < 0.5 ) return vec3( 0.5 );
	if ( ev < 2.0 ) return vec3( 0.85, 0.8, 0.1 );
	if ( ev < 4.0 ) return vec3( 0.95, 0.5, 0.05 );
	if ( ev < 6.0 ) return vec3( 0.9, 0.1, 0.05 );
	return vec3( 1.0, 0.75, 0.9 );
}

#endif
