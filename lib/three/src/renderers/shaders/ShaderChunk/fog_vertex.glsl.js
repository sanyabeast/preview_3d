export default /* glsl */`
#ifdef USE_FOG

	vFogDepth = - mvPosition.z + clamp(
		((mvPosition.y * (fogHeightDistribution * 3.)) + fogHeightDistributionOffset) + 
		(sin(position.z * 2.) + sin(position.z * 3.) + sin(position.z * 5.)) / 12.,
		0., 
		1.
	);

#endif
`;
