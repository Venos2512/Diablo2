// Texture forge prelude: tileable (periodic) noise for baking procedural PBR texture sets.
// Recipes implement:  void recipe( vec2 uv, out vec3 albedo, out float height, out float rough, out float ao, out float metal )
// uv covers one tile in [0,1); every pattern must repeat with period 1 so the bake tiles seamlessly.

vec2 fHash22( vec2 p ) {
	vec3 p3 = fract( vec3( p.xyx ) * vec3( 0.1031, 0.1030, 0.0973 ) + uSeed * 0.0137 );
	p3 += dot( p3, p3.yzx + 33.33 );
	return fract( ( p3.xx + p3.yz ) * p3.zy );
}

float fHash12( vec2 p ) {
	vec3 p3 = fract( vec3( p.xyx ) * 0.1031 + uSeed * 0.0113 );
	p3 += dot( p3, p3.yzx + 33.33 );
	return fract( ( p3.x + p3.y ) * p3.z );
}

// Periodic gradient noise in [-1, 1]; `period` in cells.
float pNoise( vec2 p, vec2 period ) {
	vec2 i = floor( p );
	vec2 f = fract( p );
	vec2 u = f * f * f * ( f * ( f * 6.0 - 15.0 ) + 10.0 );
	vec2 g00 = fHash22( mod( i, period ) ) * 2.0 - 1.0;
	vec2 g10 = fHash22( mod( i + vec2( 1.0, 0.0 ), period ) ) * 2.0 - 1.0;
	vec2 g01 = fHash22( mod( i + vec2( 0.0, 1.0 ), period ) ) * 2.0 - 1.0;
	vec2 g11 = fHash22( mod( i + vec2( 1.0, 1.0 ), period ) ) * 2.0 - 1.0;
	float a = dot( g00, f );
	float b = dot( g10, f - vec2( 1.0, 0.0 ) );
	float c = dot( g01, f - vec2( 0.0, 1.0 ) );
	float d = dot( g11, f - vec2( 1.0, 1.0 ) );
	return 1.41 * mix( mix( a, b, u.x ), mix( c, d, u.x ), u.y );
}

// Periodic fbm: base frequency `freq` cells per tile, `octaves` up to 7.
float pFbm( vec2 uv, float freq, int octaves ) {
	float sum = 0.0;
	float amp = 0.5;
	float norm = 0.0;
	for ( int i = 0; i < 7; i ++ ) {
		if ( i >= octaves ) break;
		sum += amp * pNoise( uv * freq, vec2( freq ) );
		norm += amp;
		freq *= 2.0;
		amp *= 0.5;
	}
	return sum / norm;
}

// Periodic voronoi: x = F1, y = F2 - F1 (edge distance), z = cell id hash.
vec3 pVoronoi( vec2 uv, float cells, float jitter ) {
	vec2 p = uv * cells;
	vec2 i = floor( p );
	vec2 f = fract( p );
	float f1 = 8.0;
	float f2 = 8.0;
	vec2 bestCell = vec2( 0.0 );
	for ( int y = - 1; y <= 1; y ++ ) {
		for ( int x = - 1; x <= 1; x ++ ) {
			vec2 c = vec2( float( x ), float( y ) );
			vec2 id = mod( i + c, vec2( cells ) );
			vec2 o = 0.5 + ( fHash22( id ) - 0.5 ) * jitter;
			float d = length( c + o - f );
			if ( d < f1 ) {
				f2 = f1;
				f1 = d;
				bestCell = id;
			} else if ( d < f2 ) {
				f2 = d;
			}
		}
	}
	return vec3( f1, f2 - f1, fHash12( bestCell ) );
}

// Recipes write albedo in display (sRGB) values; the baked texture is tagged SRGBColorSpace.
