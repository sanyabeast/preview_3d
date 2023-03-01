export default /* glsl */`
#ifdef USE_FOG

	vFogDepth = - mvPosition.z + clamp(
		((mvPosition.y * fogHeightDistribution) + fogHeightDistributionOffset) + 
		(sin(position.z * 2.) + sin(position.z * 3.) + sin(position.z * 5.)) / 12.,
		0., 
		1.
	);

#endif
`;
