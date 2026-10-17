// Weathered limestone with lichen, rain streaks and hairline cracks (tombstones, crosses, pillars).
void recipe( vec2 uv, out vec3 albedo, out float height, out float rough, out float ao, out float metal ) {
	float n = pFbm( uv, 3.0, 6 ) * 0.5 + 0.5;
	float fine = pFbm( uv + 2.0, 24.0, 4 );
	vec3 base = mix( vec3( 0.47, 0.46, 0.43 ), vec3( 0.36, 0.35, 0.33 ), n );
	float lichen = smoothstep( 0.62, 0.8, pFbm( uv + 7.0, 6.0, 5 ) * 0.5 + 0.5 );
	vec3 lichenCol = mix( vec3( 0.42, 0.44, 0.26 ), vec3( 0.55, 0.5, 0.3 ), fHash12( floor( uv * 40.0 ) ) );
	float streaks = smoothstep( 0.45, 0.95, pNoise( vec2( uv.x * 24.0, uv.y * 3.0 ), vec2( 24.0, 3.0 ) ) * 0.5 + 0.5 );
	float crack = ( 1.0 - smoothstep( 0.0, 0.015, pVoronoi( uv, 5.0, 1.0 ).y ) ) * step( 0.45, n );

	vec3 col = base * ( 0.85 + 0.25 * fine ) * ( 1.0 - streaks * 0.25 );
	col = mix( col, lichenCol, lichen * 0.8 );

	albedo = col * ( 1.0 - crack * 0.6 );
	height = 0.6 + fine * 0.2 - crack * 0.5 + lichen * 0.1;
	rough = 0.86 - lichen * 0.05;
	ao = 1.0 - crack * 0.5;
	metal = 0.0;
}
