// Moor grass seen from the game camera — top layer of the Act I terrain splat: short blades in three
// periodic layers (random direction, tapered, tips higher), olive-grey to straw, soil in thin clumps.
// Blades are segments shorter than one cell, so a 3x3 neighbourhood finds every blade that can reach.
float bladeLayer( vec2 uv, float cells, float salt, out float tint ) {
	vec2 p = uv * cells;
	vec2 i = floor( p );
	vec2 f = fract( p );
	float best = 0.0;
	tint = 0.0;
	for ( int y = - 1; y <= 1; y ++ ) {
		for ( int x = - 1; x <= 1; x ++ ) {
			vec2 c = vec2( float( x ), float( y ) );
			vec2 id = mod( i + c, vec2( cells ) );
			vec2 h = fHash22( id + salt );
			float a = h.x * 6.2832;
			vec2 dir = vec2( cos( a ), sin( a ) );
			float len = 0.45 + 0.4 * fHash12( id + salt * 1.7 );
			vec2 d = f - ( c + h );
			float t = clamp( dot( d, dir ) / len, 0.0, 1.0 );
			float dist = length( d - dir * t * len );
			float w = mix( 0.12, 0.025, t );
			float b = ( 1.0 - smoothstep( w * 0.5, w, dist ) ) * ( 0.4 + 0.6 * t );
			if ( b > best ) {
				best = b;
				tint = fHash12( id + salt * 3.1 );
			}
		}
	}
	return best;
}

void recipe( vec2 uv, out vec3 albedo, out float height, out float rough, out float ao, out float metal ) {
	float t1;
	float t2;
	float t3;
	float b1 = bladeLayer( uv, 44.0, 1.0, t1 );
	float b2 = bladeLayer( uv, 60.0, 7.0, t2 ) * 0.85;
	float b3 = bladeLayer( uv, 30.0, 13.0, t3 );
	float blades = max( max( b1, b2 ), b3 );
	float tint = b1 >= max( b2, b3 ) ? t1 : ( b2 >= b3 ? t2 : t3 );

	float clump = pFbm( uv, 4.0, 5 ) * 0.5 + 0.5;
	float density = smoothstep( 0.22, 0.6, clump );
	float dry = smoothstep( 0.5, 0.75, pFbm( uv + 9.0, 3.0, 4 ) * 0.5 + 0.5 );
	blades *= mix( 0.7, 1.0, density );

	// Act I palette: dark #1B1F1C, moor #3E4638 / #4C5440, straw #6F6F5C.
	vec3 soil = vec3( 0.11, 0.1, 0.08 );
	vec3 green = vec3( 0.23, 0.27, 0.17 );
	vec3 olive = vec3( 0.32, 0.34, 0.24 );
	vec3 straw = vec3( 0.42, 0.4, 0.29 );
	vec3 blade = mix( green, olive, tint );
	blade = mix( blade, straw, smoothstep( 0.55, 1.0, tint ) * ( 0.25 + 0.75 * dry ) );
	vec3 col = mix( soil, blade, smoothstep( 0.02, 0.35, blades ) );
	col *= 0.85 + 0.25 * blades;

	albedo = col;
	height = clamp( 0.15 + blades * 0.65 + clump * 0.2, 0.0, 1.0 );
	rough = 0.9 - blades * 0.05;
	ao = mix( 0.5, 1.0, smoothstep( 0.0, 0.6, blades ) );
	metal = 0.0;
}
