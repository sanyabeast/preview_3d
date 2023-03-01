export const vertex = /* glsl */`

#define USE_FOG
#define FOG_EXP2

varying vec4 vWorldDirection;

#include <common>
#include <fog_pars_vertex>

void main() {

	

	#include <begin_vertex>
	#include <project_vertex>
	#include <fog_vertex>

	vWorldDirection = vec4(transformDirection( position, modelMatrix ), clamp(mvPosition.y - 0.5, 0., 1.));

	gl_Position.z = gl_Position.w; // set z to camera.far

}
`;

export const fragment = /* glsl */`

#define USE_FOG
#define FOG_EXP2

#ifdef ENVMAP_TYPE_CUBE

	uniform samplerCube envMap;

#elif defined( ENVMAP_TYPE_CUBE_UV )

	uniform sampler2D envMap;

#endif

uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;

varying vec4 vWorldDirection;

#include <cube_uv_reflection_fragment>
#include <fog_pars_fragment>

void main() {

	#ifdef ENVMAP_TYPE_CUBE

		vec4 texColor = textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );

	#elif defined( ENVMAP_TYPE_CUBE_UV )

		vec4 texColor = textureCubeUV( envMap, vWorldDirection.xyz, backgroundBlurriness );

	#else

		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );

	#endif

	texColor.rgb *= backgroundIntensity;

	gl_FragColor = texColor;

	#include <tonemapping_fragment>
	#include <encodings_fragment>
	
	
	#ifdef USE_FOG

		#ifdef FOG_EXP2

			float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );

		#else

			float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );

		#endif

		gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor * clamp(pow((1.-vWorldDirection.y), 2.- backgroundIntensity), 0., 1.) );

#endif

}
`;
