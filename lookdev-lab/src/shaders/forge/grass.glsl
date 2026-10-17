// Muted moor grass with dead patches (Act I wilderness ground).
void recipe( vec2 uv, out vec3 albedo, out float height, out float rough, out float ao, out float metal ) {
	float n = pFbm( uv, 3.0, 6 ) * 0.5 + 0.5;
	float blades = pFbm( uv, 64.0, 3 );
	float streak = pNoise( vec2( uv.x * 96.0, uv.y * 24.0 ), vec2( 96.0, 24.0 ) );
	vec3 green = vec3( 0.17, 0.2, 0.09 );
	vec3 yellow = vec3( 0.31, 0.29, 0.15 );
	vec3 dead = vec3( 0.25, 0.2, 0.13 );
	vec3 col = mix( green, yellow, smoothstep( 0.4, 0.8, n ) );
	col = mix( col, dead, smoothstep( 0.62, 0.85, pFbm( uv + 7.0, 5.0, 4 ) * 0.5 + 0.5 ) );
	col *= 0.74 + 0.36 * ( blades * 0.5 + 0.5 ) + streak * 0.08;

	albedo = col;
	height = 0.5 + blades * 0.25 + streak * 0.15;
	rough = 0.92;
	ao = 0.72 + 0.28 * ( blades * 0.5 + 0.5 );
	metal = 0.0;
}
