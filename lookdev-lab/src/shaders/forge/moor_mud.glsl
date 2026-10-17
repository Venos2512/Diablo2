// Wet moor earth — second layer of the Act I terrain splat: dark saturated soil, clods, sparse stones and
// standing water in the hollows (flat, glossy). The terrain shader adds more water with its water level.
void recipe( vec2 uv, out vec3 albedo, out float height, out float rough, out float ao, out float metal ) {
	float n = pFbm( uv, 4.0, 6 ) * 0.5 + 0.5;
	float clods = pFbm( uv, 22.0, 4 ) * 0.5 + 0.5;
	float smear = pNoise( vec2( uv.x * 5.0, uv.y * 28.0 ), vec2( 5.0, 28.0 ) ) * 0.5 + 0.5;
	vec3 peb = pVoronoi( uv, 30.0, 1.0 );
	float pebble = ( 1.0 - smoothstep( 0.18, 0.36, peb.x ) ) * step( 0.86, peb.z );

	float h = n * 0.5 + clods * 0.3 + smear * 0.08 + pebble * 0.3 - 0.06;
	float hollow = 1.0 - smoothstep( 0.3, 0.4, h );
	height = clamp( mix( h, 0.3, hollow ), 0.0, 1.0 ); // water surface is flat

	vec3 col = mix( vec3( 0.085, 0.07, 0.055 ), vec3( 0.165, 0.135, 0.1 ), clods * 0.6 + n * 0.4 );
	col *= 0.92 + 0.16 * smear;
	col = mix( col, vec3( 0.25, 0.24, 0.22 ) * ( 0.7 + 0.4 * peb.z ), pebble * 0.85 );
	col = mix( col, vec3( 0.05, 0.05, 0.045 ), hollow * 0.75 );

	albedo = col;
	rough = mix( mix( 0.66, 0.52, clods ), 0.08, hollow ) - pebble * 0.05;
	ao = mix( 0.72 + 0.28 * clods, 1.0, hollow );
	metal = 0.0;
}
