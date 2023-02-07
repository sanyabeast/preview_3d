export default /* glsl */`

// lvl max
//alpha_test_2 = round(fract((gl_FragCoord.x) / 2.) + fract((gl_FragCoord.y) / 2.)) * diffuseColor.a + diffuseColor.a;

// lvl mid
//alpha_test_2 = round(fract((gl_FragCoord.x + fract(gl_FragCoord.y / 2.)) / 2.)) * diffuseColor.a + diffuseColor.a;

// lvl min
//alpha_test_2 = round(fract((gl_FragCoord.x) / 2.) * fract((gl_FragCoord.y) / 2.)) * diffuseColor.a + diffuseColor.a;


//float alpha_dithered_min = round(fract((gl_FragCoord.x + 1.) / 2.) * fract((gl_FragCoord.y) / 2.)) * diffuseColor.a + diffuseColor.a;
//float alpha_dithered_max = round(fract((gl_FragCoord.x + fract(gl_FragCoord.y / 2.)) / 2.)) * diffuseColor.a + diffuseColor.a;

//float alpha_dithered = round(mix(alpha_dithered_min, alpha_dithered_max, diffuseColor.a));

//float alpha_dithered = round(fract(((gl_FragCoord.x) + fract(gl_FragCoord.y / 2.)) / 2.)) * diffuseColor.a + diffuseColor.a;

#ifdef USE_ALPHATEST
	// float alpha_dithered = 1.;
	// float ad_x_coord = gl_FragCoord.x;
	// float ad_x_fract = fract(gl_FragCoord.x / 2.);
	// float ad_y_fract = fract(gl_FragCoord.y / 2.);
	// float ad_orig_alpha = diffuseColor.a;

	// if (ad_orig_alpha < 0.85){
	// 	alpha_dithered = round(ad_x_fract + ad_y_fract);
	// } 
	// if (ad_orig_alpha < 0.75) {
	// 	alpha_dithered = round(fract((ad_x_coord + ad_y_fract) / 2.));
	// } 
	// if (ad_orig_alpha < 0.25){
	// 	alpha_dithered = round(ad_x_fract * ad_y_fract);
	// }
	// if (ad_orig_alpha < 0.05){
	// 	alpha_dithered = 0.;
	// }

	float ad_orig_alpha = diffuseColor.a;
	float alpha_dithered = 1.;
	float ad_x_fract = pow( fract(gl_FragCoord.x / round(((1.-ad_orig_alpha) + 1.) * 1.)) , 1. );
	float ad_y_fract = pow( fract(gl_FragCoord.y / round(((1.-ad_orig_alpha) + 1.) * 1.)) , 1. );

	alpha_dithered = pow(
		(ad_x_fract + ad_y_fract) * pow(ad_orig_alpha, mix(0.2, 1.5, ad_orig_alpha)) + pow(ad_orig_alpha, 1.5),
		2.
	);
	
	if ( alpha_dithered < alphaTest ) discard;

#endif
`;
