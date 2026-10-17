// Weathered planks with grain, rings, end cuts and dark gaps (doors, crosses, fences, torch handles).
void recipe( vec2 uv, out vec3 albedo, out float height, out float rough, out float ao, out float metal ) {
	const float PLANKS = 4.0;
	float pl = floor( uv.y * PLANKS );
	float rnd = fHash12( vec2( pl, 3.0 ) );
	vec2 q = vec2( uv.x + rnd, fract( uv.y * PLANKS ) );
	float grain = pNoise( vec2( q.x * 4.0, q.y * 40.0 + pl * 13.0 ), vec2( 4.0, 1000.0 ) );
	float rings = sin( ( q.x * 18.0 + grain * 0.9 + pFbm( uv, 8.0, 4 ) * 1.6 ) * 6.2831853 ) * 0.5 + 0.5;
	float gap = smoothstep( 0.0, 0.05, min( q.y, 1.0 - q.y ) );
	float cut = fract( uv.x + rnd * 0.37 );
	float endGap = smoothstep( 0.0, 0.006, min( cut, 1.0 - cut ) );
	float plank = gap * endGap;

	vec3 dark = vec3( 0.17, 0.11, 0.07 );
	vec3 light = vec3( 0.34, 0.24, 0.15 );
	vec3 col = mix( dark, light, rings * 0.55 + grain * 0.2 + 0.25 ) * ( 0.85 + 0.3 * rnd );
	col = mix( col, vec3( 0.31, 0.3, 0.28 ), smoothstep( 0.5, 0.9, pFbm( uv + 2.0, 6.0, 4 ) * 0.5 + 0.5 ) * 0.45 );

	albedo = mix( vec3( 0.05, 0.04, 0.03 ), col, plank );
	height = plank * ( 0.8 + rings * 0.1 + grain * 0.1 );
	rough = mix( 1.0, 0.8, plank );
	ao = mix( 0.4, 1.0, plank );
	metal = 0.0;
}
