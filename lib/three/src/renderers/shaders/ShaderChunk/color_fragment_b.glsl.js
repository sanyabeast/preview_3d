export default /* glsl */`
#if defined( USE_COLOR )

	totalEmissiveRadiance.rgb += vColor.rgb;

#endif
`;