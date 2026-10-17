// lab_noise — hash, value/gradient noise, fbm and voronoi. Mirrored 1:1 in src/backends/webgpu/tsl/noise.js
// so GLSL and TSL versions of an effect produce the same pattern and comparable cost.
#ifndef LAB_NOISE_GLSL
#define LAB_NOISE_GLSL

float labHash11( float p ) {
	p = fract( p * 0.1031 );
	p *= p + 33.33;
	p *= p + p;
	return fract( p );
}

float labHash12( vec2 p ) {
	vec3 p3 = fract( vec3( p.xyx ) * 0.1031 );
	p3 += dot( p3, p3.yzx + 33.33 );
	return fract( ( p3.x + p3.y ) * p3.z );
}

float labHash13( vec3 p3 ) {
	p3 = fract( p3 * 0.1031 );
	p3 += dot( p3, p3.zyx + 31.32 );
	return fract( ( p3.x + p3.y ) * p3.z );
}

vec2 labHash22( vec2 p ) {
	vec3 p3 = fract( vec3( p.xyx ) * vec3( 0.1031, 0.1030, 0.0973 ) );
	p3 += dot( p3, p3.yzx + 33.33 );
	return fract( ( p3.xx + p3.yz ) * p3.zy );
}

vec3 labHash33( vec3 p3 ) {
	p3 = fract( p3 * vec3( 0.1031, 0.1030, 0.0973 ) );
	p3 += dot( p3, p3.yxz + 33.33 );
	return fract( ( p3.xxy + p3.yxx ) * p3.zyx );
}

// Gradient noise in [-1, 1].
float labNoise3( vec3 p ) {
	vec3 i = floor( p );
	vec3 f = fract( p );
	vec3 u = f * f * f * ( f * ( f * 6.0 - 15.0 ) + 10.0 );
	float n000 = dot( labHash33( i + vec3( 0.0, 0.0, 0.0 ) ) * 2.0 - 1.0, f - vec3( 0.0, 0.0, 0.0 ) );
	float n100 = dot( labHash33( i + vec3( 1.0, 0.0, 0.0 ) ) * 2.0 - 1.0, f - vec3( 1.0, 0.0, 0.0 ) );
	float n010 = dot( labHash33( i + vec3( 0.0, 1.0, 0.0 ) ) * 2.0 - 1.0, f - vec3( 0.0, 1.0, 0.0 ) );
	float n110 = dot( labHash33( i + vec3( 1.0, 1.0, 0.0 ) ) * 2.0 - 1.0, f - vec3( 1.0, 1.0, 0.0 ) );
	float n001 = dot( labHash33( i + vec3( 0.0, 0.0, 1.0 ) ) * 2.0 - 1.0, f - vec3( 0.0, 0.0, 1.0 ) );
	float n101 = dot( labHash33( i + vec3( 1.0, 0.0, 1.0 ) ) * 2.0 - 1.0, f - vec3( 1.0, 0.0, 1.0 ) );
	float n011 = dot( labHash33( i + vec3( 0.0, 1.0, 1.0 ) ) * 2.0 - 1.0, f - vec3( 0.0, 1.0, 1.0 ) );
	float n111 = dot( labHash33( i + vec3( 1.0, 1.0, 1.0 ) ) * 2.0 - 1.0, f - vec3( 1.0, 1.0, 1.0 ) );
	float nx00 = mix( n000, n100, u.x );
	float nx10 = mix( n010, n110, u.x );
	float nx01 = mix( n001, n101, u.x );
	float nx11 = mix( n011, n111, u.x );
	return 1.6 * mix( mix( nx00, nx10, u.y ), mix( nx01, nx11, u.y ), u.z );
}

// Four-octave fbm in roughly [-1, 1].
float labFbm3( vec3 p ) {
	float sum = 0.0;
	float amp = 0.5;
	for ( int i = 0; i < 4; i ++ ) {
		sum += amp * labNoise3( p );
		p = p * 2.03 + vec3( 17.1, 3.7, 9.2 );
		amp *= 0.5;
	}
	return sum / 0.9375;
}

// Distance to the nearest feature point (F1) of a 2D cellular pattern.
float labVoronoi2( vec2 p ) {
	vec2 i = floor( p );
	vec2 f = fract( p );
	float best = 8.0;
	for ( int y = - 1; y <= 1; y ++ ) {
		for ( int x = - 1; x <= 1; x ++ ) {
			vec2 cell = vec2( float( x ), float( y ) );
			vec2 point = labHash22( i + cell );
			vec2 d = cell + point - f;
			best = min( best, dot( d, d ) );
		}
	}
	return sqrt( best );
}

#endif
