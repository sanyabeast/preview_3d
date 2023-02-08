#ifdef USE_ALPHATEST
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