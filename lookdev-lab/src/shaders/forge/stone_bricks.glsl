// Monastery / castle wall: irregular running-bond stone blocks (random splits), chipped edges, grime,
// damaged blocks, moss in the joints.
void recipe( vec2 uv, out vec3 albedo, out float height, out float rough, out float ao, out float metal ) {
	const float COLS = 3.0;
	const float ROWS = 6.0;
	vec2 p = vec2( uv.x * COLS, uv.y * ROWS );
	float row = floor( p.y );
	p.x += fract( row * 0.5 ) * 0.5 + ( fHash12( vec2( mod( row, ROWS ), 7.0 ) ) - 0.5 ) * 0.3;
	vec2 cell = floor( p );
	vec2 f = fract( p );
	vec2 cellId = vec2( mod( cell.x, COLS ), mod( cell.y, ROWS ) );

	// Randomly split some blocks in two (narrower stones) so rows don't read as a brick wall.
	float cellW = 1.0 / COLS;
	if ( fHash12( cellId + 2.1 ) < 0.45 ) {
		float split = 0.35 + 0.3 * fHash12( cellId + 1.3 );
		if ( f.x < split ) {
			f.x /= split;
			cellW *= split;
			cellId += 0.37;
		} else {
			f.x = ( f.x - split ) / ( 1.0 - split );
			cellW *= 1.0 - split;
			cellId += 0.71;
		}
	}
	float rnd = fHash12( cellId );

	vec2 e = min( f, 1.0 - f ) * vec2( cellW, 1.0 / ROWS );
	float n = pFbm( uv, 8.0, 5 );
	float chip = pFbm( uv + 3.1, 32.0, 4 );
	float edgeDist = min( e.x, e.y ) + chip * 0.008 + n * 0.005;
	float brick = smoothstep( 0.005, 0.016, edgeDist );
	float bevel = smoothstep( 0.005, 0.035, edgeDist );

	float face = pFbm( uv + rnd * 7.0, 16.0, 5 ) * 0.5 + 0.5;
	float damage = smoothstep( 0.55, 0.75, pFbm( uv + rnd * 3.0, 12.0, 4 ) * 0.5 + 0.5 ) * step( 0.7, fHash12( cellId + 5.5 ) );
	height = brick * ( 0.6 + 0.26 * bevel + 0.14 * face - damage * 0.25 ) * ( 0.88 + 0.12 * rnd );

	vec3 stoneA = vec3( 0.42, 0.4, 0.37 );
	vec3 stoneB = vec3( 0.31, 0.3, 0.28 );
	vec3 stoneC = vec3( 0.47, 0.43, 0.37 );
	vec3 stoneD = vec3( 0.34, 0.35, 0.31 );
	vec3 col = mix( mix( stoneA, stoneB, rnd ), stoneC, smoothstep( 0.6, 1.0, fHash12( cellId + 3.7 ) ) );
	col = mix( col, stoneD, smoothstep( 0.75, 1.0, fHash12( cellId + 8.2 ) ) );
	col *= 0.78 + 0.36 * face;
	col *= 1.0 - damage * 0.35;
	float grime = smoothstep( 0.25, 0.85, pFbm( uv + 9.0, 4.0, 4 ) * 0.5 + 0.5 );
	col = mix( col, col * 0.5, grime * 0.6 );
	float streak = smoothstep( 0.55, 0.95, pNoise( vec2( uv.x * 18.0, uv.y * 2.0 ), vec2( 18.0, 2.0 ) ) * 0.5 + 0.5 );
	col *= 1.0 - streak * 0.25;

	vec3 mortar = vec3( 0.17, 0.16, 0.15 ) * ( 0.8 + 0.4 * n );
	float moss = smoothstep( 0.35, 0.75, pFbm( uv + 5.0, 6.0, 5 ) * 0.5 + 0.5 );
	mortar = mix( mortar, vec3( 0.14, 0.18, 0.08 ), moss * 0.75 );

	albedo = mix( mortar, col, brick );
	rough = mix( 0.97, 0.74 + 0.18 * face + damage * 0.1, brick );
	ao = mix( 0.45, 1.0, smoothstep( 0.0, 0.55, height ) ) * ( 1.0 - damage * 0.2 );
	metal = 0.0;
}
