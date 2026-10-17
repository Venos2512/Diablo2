// Display transform: grading -> tone mapping -> sRGB -> 3D LUT, plus vignette, grain and chromatic aberration.
// uMode: 0 = graded output, 1 = debug passthrough (no grade, no tone mapping), 2 = exposure false colour.
#include <common>
#include <tonemapping_pars_fragment>
#include <lab_common>

uniform sampler2D tColor;
uniform int uMode;
uniform int uToneMapping;
uniform float uExposure;
uniform vec3 uWhiteBalance;
uniform float uSaturation;
uniform float uContrast;
uniform vec3 uLift;
uniform vec3 uGamma;
uniform vec3 uGain;
uniform float uVignette;
uniform float uGrain;
uniform float uChromatic;
uniform float uTime;
uniform vec2 uResolution;
uniform sampler3D uLut;
uniform float uLutSize;
uniform float uLutIntensity;

varying vec2 vUv;

vec3 toneMap( vec3 c ) {
	if ( uToneMapping == 1 ) return LinearToneMapping( c );
	if ( uToneMapping == 2 ) return ReinhardToneMapping( c );
	if ( uToneMapping == 3 ) return CineonToneMapping( c );
	if ( uToneMapping == 4 ) return ACESFilmicToneMapping( c );
	if ( uToneMapping == 5 ) return AgXToneMapping( c );
	if ( uToneMapping == 6 ) return NeutralToneMapping( c );
	return clamp( c, 0.0, 1.0 );
}

vec3 sampleColor( vec2 uv ) {
	if ( uChromatic <= 0.0 ) return texture2D( tColor, uv ).rgb;
	vec2 d = ( uv - 0.5 ) * uChromatic * 0.012;
	return vec3( texture2D( tColor, uv + d ).r, texture2D( tColor, uv ).g, texture2D( tColor, uv - d ).b );
}

void main() {
	if ( uMode == 1 ) {
		gl_FragColor = vec4( labLinearToSRGB( texture2D( tColor, vUv ).rgb ), 1.0 );
		return;
	}

	vec3 color = sampleColor( vUv ) * uExposure;

	if ( uMode == 2 ) {
		gl_FragColor = vec4( labFalseColor( labLuma( color ) ), 1.0 );
		return;
	}

	// Scene-referred grading.
	color *= uWhiteBalance;
	color = max( color, vec3( 0.0 ) );
	color = pow( color / 0.18 + 1e-6, vec3( uContrast ) ) * 0.18;
	float luma = labLuma( color );
	color = max( mix( vec3( luma ), color, uSaturation ), vec3( 0.0 ) );

	color = toneMap( color );

	// Display-referred lift / gamma / gain.
	color = clamp( color * uGain + uLift * ( 1.0 - color ), 0.0, 1.0 );
	color = pow( color, 1.0 / max( uGamma, vec3( 0.01 ) ) );

	vec2 p = vUv - 0.5;
	p.x *= uResolution.x / uResolution.y;
	color *= mix( 1.0, 1.0 - smoothstep( 0.25, 0.95, length( p ) ), uVignette );

	color = labLinearToSRGB( color );

	// 3D LUT in display space (texel centres: scale + offset so 0 and 1 hit the first / last entry).
	if ( uLutIntensity > 0.0 ) {
		vec3 lutCoord = clamp( color, 0.0, 1.0 ) * ( ( uLutSize - 1.0 ) / uLutSize ) + 0.5 / uLutSize;
		color = mix( color, texture( uLut, lutCoord ).rgb, uLutIntensity );
	}

	if ( uGrain > 0.0 ) {
		float n = fract( sin( dot( gl_FragCoord.xy + fract( uTime * 7.31 ) * 97.0, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 ) - 0.5;
		float mid = 1.0 - abs( labLuma( color ) * 2.0 - 1.0 );
		color += n * uGrain * ( 0.35 + 0.65 * mid );
	}

	gl_FragColor = vec4( color, 1.0 );
}
