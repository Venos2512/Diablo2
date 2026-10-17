// Dry moor earth — base layer of the Act I terrain splat: packed grey-brown soil, hairline cracks in
// dried patches, pebbles and grit. Low internal contrast (value 15–30 %) so characters read on top.
void recipe( vec2 uv, out vec3 albedo, out float height, out float rough, out float ao, out float metal ) {
	float n = pFbm( uv, 5.0, 6 ) * 0.5 + 0.5;
	float fine = pFbm( uv, 48.0, 3 ) * 0.5 + 0.5;
	vec3 crack = pVoronoi( uv + vec2( pFbm( uv, 6.0, 3 ), pFbm( uv + 5.0, 6.0, 3 ) ) * 0.015, 9.0, 0.9 );
	float dried = smoothstep( 0.5, 0.68, pFbm( uv + 3.0, 4.0, 3 ) * 0.5 + 0.5 );
	float cracks = ( 1.0 - smoothstep( 0.0, 0.035, crack.y ) ) * dried;
	vec3 peb = pVoronoi( uv, 36.0, 1.0 );
	float pebble = ( 1.0 - smoothstep( 0.2, 0.42, peb.x ) ) * step( 0.9, peb.z );
	vec3 grit = pVoronoi( uv, 110.0, 1.0 );
	float g = ( 1.0 - smoothstep( 0.15, 0.35, grit.x ) ) * step( 0.75, grit.z );

	height = clamp( 0.18 + n * 0.42 + fine * 0.12 + pebble * 0.32 + g * 0.06 - cracks * 0.2, 0.0, 1.0 );

	vec3 col = mix( vec3( 0.17, 0.145, 0.115 ), vec3( 0.29, 0.255, 0.205 ), n );
	col = mix( col, col * vec3( 1.08, 1.04, 0.95 ), dried ); // dried crust: a touch paler and warmer
	col *= 0.86 + 0.28 * fine;
	col = mix( col, vec3( 0.1, 0.085, 0.07 ), cracks * 0.8 );
	col = mix( col, vec3( 0.25, 0.235, 0.21 ) * ( 0.8 + 0.3 * peb.z ), pebble );
	col = mix( col, vec3( 0.26, 0.235, 0.2 ), g * 0.35 );

	albedo = col;
	rough = 0.93 - pebble * 0.08;
	ao = clamp( 0.6 + 0.5 * height - cracks * 0.3, 0.0, 1.0 );
	metal = 0.0;
}
