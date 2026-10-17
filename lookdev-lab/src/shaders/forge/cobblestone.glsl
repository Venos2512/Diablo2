// Worn cobbles with dirt in the gaps (paths, crypt floors).
void recipe( vec2 uv, out vec3 albedo, out float height, out float rough, out float ao, out float metal ) {
	vec3 v = pVoronoi( uv, 7.0, 0.85 );
	float stone = smoothstep( 0.02, 0.11, v.y );
	float dome = 1.0 - smoothstep( 0.0, 0.75, v.x );
	float n = pFbm( uv, 16.0, 5 );
	height = stone * ( 0.5 + 0.42 * dome ) + n * 0.05 * stone;

	vec3 c1 = vec3( 0.38, 0.36, 0.33 );
	vec3 c2 = vec3( 0.29, 0.28, 0.26 );
	vec3 c3 = vec3( 0.46, 0.41, 0.34 );
	vec3 col = mix( mix( c1, c2, v.z ), c3, step( 0.82, fract( v.z * 7.0 ) ) );
	col *= 0.78 + 0.35 * ( n * 0.5 + 0.5 );
	vec3 dirt = vec3( 0.16, 0.13, 0.1 ) * ( 0.8 + 0.4 * pFbm( uv + 4.0, 32.0, 3 ) );

	albedo = mix( dirt, col, stone );
	rough = mix( 1.0, 0.7 + 0.2 * ( n * 0.5 + 0.5 ), stone );
	ao = mix( 0.45, 1.0, stone ) * ( 0.85 + 0.15 * dome );
	metal = 0.0;
}
