// Scene-referred (linear HDR) composite: AO, exponential height fog, then the VFX layer (premultiplied).
#include <lab_common>

uniform sampler2D tScene;
uniform sampler2D tDepth;
uniform sampler2D tAO;
uniform sampler2D tVFX;

uniform float uAOIntensity;
uniform float uShowAO;
uniform float uHasVFX;

uniform float uFog;
uniform float uFogDensity;
uniform float uFogFalloff;
uniform float uFogHeight;
uniform float uFogStart;
uniform float uFogMaxDist;
uniform vec3 uFogColor;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uInscatter;

uniform mat4 uProjInv;
uniform mat4 uCamWorld;
uniform vec3 uCamPos;

varying vec2 vUv;

vec3 worldFromDepth( vec2 uv, float depth ) {
	vec4 ndc = vec4( uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0 );
	vec4 view = uProjInv * ndc;
	view /= view.w;
	return ( uCamWorld * vec4( view.xyz, 1.0 ) ).xyz;
}

vec3 heightFog( vec3 color, vec3 worldPos, bool sky ) {
	vec3 ray = worldPos - uCamPos;
	float dist = sky ? uFogMaxDist : length( ray );
	vec3 dir = normalize( ray );
	float s0 = uFogStart;
	float s1 = max( dist, s0 );
	float a = uFogDensity * exp( clamp( - uFogFalloff * ( uCamPos.y - uFogHeight ), - 80.0, 80.0 ) );
	float b = uFogFalloff * dir.y;
	float amount = abs( b ) > 1e-5
		? a * ( exp( clamp( - b * s0, - 80.0, 80.0 ) ) - exp( clamp( - b * s1, - 80.0, 80.0 ) ) ) / b
		: a * ( s1 - s0 );
	float transmittance = exp( - max( amount, 0.0 ) );
	float sun = pow( max( dot( dir, uSunDir ), 0.0 ), 8.0 ) * uInscatter;
	vec3 fogColor = uFogColor + uSunColor * sun;
	return color * transmittance + fogColor * ( 1.0 - transmittance );
}

void main() {
	if ( uShowAO > 0.5 ) {
		// Debug view: raw AO buffer (pre-linearised so the passthrough display shows the stored value).
		gl_FragColor = vec4( labSRGBToLinear( vec3( texture2D( tAO, vUv ).r ) ), 1.0 );
		return;
	}

	vec3 color = texture2D( tScene, vUv ).rgb;

	if ( uAOIntensity > 0.0 ) {
		float ao = texture2D( tAO, vUv ).r;
		color *= mix( 1.0, ao, uAOIntensity );
	}

	if ( uFog > 0.5 ) {
		float depth = texture2D( tDepth, vUv ).r;
		bool sky = depth >= 0.999999;
		color = heightFog( color, worldFromDepth( vUv, sky ? 0.999 : depth ), sky );
	}

	if ( uHasVFX > 0.5 ) {
		vec4 vfx = texture2D( tVFX, vUv );
		color = color * ( 1.0 - vfx.a ) + vfx.rgb;
	}

	gl_FragColor = vec4( color, 1.0 );
}
