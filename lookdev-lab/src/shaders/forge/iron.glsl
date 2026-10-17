// Rusted wrought iron: bare metal (metalness 1) breaking through rust (metalness 0).
void recipe( vec2 uv, out vec3 albedo, out float height, out float rough, out float ao, out float metal ) {
	float n = pFbm( uv, 4.0, 6 ) * 0.5 + 0.5;
	float rust = smoothstep( 0.42, 0.68, n + pFbm( uv + 5.0, 16.0, 4 ) * 0.15 );
	vec3 steel = vec3( 0.6, 0.6, 0.61 ) * ( 0.88 + 0.2 * pFbm( uv + 1.0, 32.0, 3 ) );
	vec3 rustCol = mix( vec3( 0.29, 0.12, 0.05 ), vec3( 0.46, 0.22, 0.09 ), pFbm( uv + 8.0, 24.0, 4 ) * 0.5 + 0.5 );

	albedo = mix( steel, rustCol, rust );
	metal = 1.0 - rust;
	rough = mix( 0.42, 0.9, rust );
	height = rust * 0.3 + pFbm( uv + 3.0, 32.0, 4 ) * 0.1;
	ao = 0.85 + 0.15 * n;
}
