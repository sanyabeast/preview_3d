export default /* glsl */`
#ifdef USE_ALPHATEST
	float alpha_test_2 = (fract((gl_FragCoord.x) * (diffuseColor.a * 1.)) + fract(gl_FragCoord.y * (diffuseColor.a * 1.))) * pow(diffuseColor.a, 0.5) + diffuseColor.a;
	if ( alpha_test_2 < alphaTest ) discard;

#endif
`;
