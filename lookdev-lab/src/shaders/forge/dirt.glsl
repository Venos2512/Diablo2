// Packed earth with pebbles and damp patches (graves, paths).
void recipe( vec2 uv, out vec3 albedo, out float height, out float rough, out float ao, out float metal ) {
	float n = pFbm( uv, 4.0, 6 ) * 0.5 + 0.5;
	vec3 v = pVoronoi( uv, 24.0, 1.0 );
	float pebble = ( 1.0 - smoothstep( 0.18, 0.36, v.x ) ) * step( 0.72, v.z );
	height = n * 0.6 + pebble * 0.4;

	vec3 col = mix( vec3( 0.15, 0.12, 0.09 ), vec3( 0.25, 0.2, 0.15 ), n );
	col = mix( col, vec3( 0.36, 0.34, 0.31 ) * ( 0.8 + 0.4 * v.z ), pebble );
	float wet = smoothstep( 0.55, 0.75, pFbm( uv + 11.0, 3.0, 4 ) * 0.5 + 0.5 );
	col *= 1.0 - wet * 0.35;

	albedo = col;
	rough = mix( 0.95, 0.55, wet ) - pebble * 0.15;
	ao = 0.7 + 0.3 * n;
	metal = 0.0;
}
