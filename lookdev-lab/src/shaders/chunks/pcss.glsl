// Percentage-closer soft shadows (Fernando 2005) for shadows whose radius is negative: the baked moon of Weeping
// Fields (env/bakedShadow.js). -radius = penumbra texels per unit of shadow depth (light angular radius × depth range /
// texel size). A blocker search around the receiver finds the mean occluder depth; the filter radius grows with the
// receiver–occluder gap: hard where a caster stands on the ground, soft far from it. Taps follow a Vogel spiral turned
// per shadow texel (grain fixed to the world instead of banding); a receiver-plane depth bias keeps the wide kernels
// off sloped ground. Texel reads use an explicit LOD (no derivatives inside the loops). Installed in three's
// getShadow() by backends/webgl/bakedShadow.js; TSL twin: pcssFilter() in backends/webgpu/bakedShadow.js.

#define LAB_PCSS_SEARCH 16
#define LAB_PCSS_TAPS 24
#define LAB_PCSS_SEARCH_SCALE 0.1 // search radius / penumbra scale: occluders up to ~16 m along the light (159 m deep camera)
#define LAB_PCSS_MAX_TEXELS 32.0

float labPcssDepth( sampler2D shadowMap, vec2 uv ) {
	return unpackRGBAToDepth( textureLod( shadowMap, uv, 0.0 ) );
}

float labPcssShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float penumbraScale, vec4 shadowCoord ) {
	vec3 coord = shadowCoord.xyz / shadowCoord.w;
	coord.z += shadowBias;

	// Depth slope of the receiver plane per unit of shadow uv (before any branch: derivatives need every pixel of the quad).
	vec3 ddx = dFdx( coord );
	vec3 ddy = dFdy( coord );
	float det = ddx.x * ddy.y - ddx.y * ddy.x;
	vec2 slope = abs( det ) > 1e-12 ? vec2( ddy.y * ddx.z - ddx.y * ddy.z, ddx.x * ddy.z - ddy.x * ddx.z ) / det : vec2( 0.0 );
	slope = clamp( slope, - 4.0, 4.0 );

	float shadow = 1.0; // one exit: ANGLE's HLSL compiler warns about early returns (X4000)
	if ( coord.x >= 0.0 && coord.x <= 1.0 && coord.y >= 0.0 && coord.y <= 1.0 && coord.z <= 1.0 ) {
		vec2 texel = 1.0 / shadowMapSize;
		float spin = 6.2831853 * fract( 52.9829189 * fract( dot( floor( coord.xy * shadowMapSize ), vec2( 0.06711056, 0.00583715 ) ) ) );
		vec2 start = vec2( cos( spin ), sin( spin ) );
		const vec2 golden = vec2( -0.73736887, 0.67549029 ); // cos, sin of the golden angle (2.39996323): one spiral step
		float search = clamp( penumbraScale * LAB_PCSS_SEARCH_SCALE, 1.0, LAB_PCSS_MAX_TEXELS );

		float blockers = 0.0;
		float count = 0.0;
		vec2 dir = start;
		for ( int i = 0; i < LAB_PCSS_SEARCH; i ++ ) {
			vec2 o = dir * sqrt( ( float( i ) + 0.5 ) / float( LAB_PCSS_SEARCH ) ) * search * texel;
			float depth = labPcssDepth( shadowMap, coord.xy + o );
			float blocked = step( depth, coord.z + dot( slope, o ) - 1e-7 );
			blockers += depth * blocked;
			count += blocked;
			dir = vec2( dir.x * golden.x - dir.y * golden.y, dir.x * golden.y + dir.y * golden.x );
		}

		if ( count > 0.0 ) {
			float radius = clamp( ( coord.z - blockers / count ) * penumbraScale, 1.0, search );
			float lit = 0.0;
			dir = start;
			for ( int i = 0; i < LAB_PCSS_TAPS; i ++ ) {
				vec2 o = dir * sqrt( ( float( i ) + 0.5 ) / float( LAB_PCSS_TAPS ) ) * radius * texel;
				lit += step( coord.z + dot( slope, o ), labPcssDepth( shadowMap, coord.xy + o ) );
				dir = vec2( dir.x * golden.x - dir.y * golden.y, dir.x * golden.y + dir.y * golden.x );
			}
			shadow = mix( 1.0, lit / float( LAB_PCSS_TAPS ), shadowIntensity );
		}
	}
	return shadow;
}
