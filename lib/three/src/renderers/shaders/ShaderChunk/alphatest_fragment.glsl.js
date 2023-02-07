export default /* glsl */`

// lvl max
//alpha_test_2 = round(fract((gl_FragCoord.x) / 2.) + fract((gl_FragCoord.y) / 2.)) * diffuseColor.a + diffuseColor.a;

// lvl mid
//alpha_test_2 = round(fract((gl_FragCoord.x + fract(gl_FragCoord.y / 2.)) / 2.)) * diffuseColor.a + diffuseColor.a;

// lvl min
//alpha_test_2 = round(fract((gl_FragCoord.x) / 2.) * fract((gl_FragCoord.y) / 2.)) * diffuseColor.a + diffuseColor.a;

#ifdef USE_ALPHATEST
	// float alpha_test_2 = 1.;
	// if (diffuseColor.a < 1.){
	// 	alpha_test_2 = round(fract((gl_FragCoord.x) / 2.) + fract((gl_FragCoord.y) / 2.)) * diffuseColor.a + diffuseColor.a;
	// } 
	// if (diffuseColor.a < 0.75) {
	// 	alpha_test_2 = round(fract((gl_FragCoord.x + fract(gl_FragCoord.y / 2.)) / 2.)) * diffuseColor.a + diffuseColor.a;
	// } 
	// if (diffuseColor.a < 0.25){
	// 	alpha_test_2 = round(fract((gl_FragCoord.x) / 2.) * fract((gl_FragCoord.y) / 2.)) * diffuseColor.a + diffuseColor.a;
	// }

	//float alpha_dithered_min = round(fract((gl_FragCoord.x + 1.) / 2.) * fract((gl_FragCoord.y) / 2.)) * diffuseColor.a + diffuseColor.a;
	//float alpha_dithered_max = round(fract((gl_FragCoord.x + fract(gl_FragCoord.y / 2.)) / 2.)) * diffuseColor.a + diffuseColor.a;

	//float alpha_dithered = round(mix(alpha_dithered_min, alpha_dithered_max, diffuseColor.a));

	float alpha_dithered = round(fract(((gl_FragCoord.x) + fract(gl_FragCoord.y / 2.)) / 2.)) * diffuseColor.a + diffuseColor.a;
	if ( alpha_dithered < alphaTest ) discard;

#endif
`;
