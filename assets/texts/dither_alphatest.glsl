

#ifdef USE_ALPHATEST
float ad_pi = 3.14159;
float ad_dsq2 = 2.;
float ad_half_pi = ad_pi / 2.;
float ad_orig_alpha = diffuseColor.a;
float alpha_dithered = 1.;
float alpha_inverted = 1. - ad_orig_alpha;
// float ad_x_fract = fract(gl_FragCoord.x / (alpha_inverted) + 1.);
// float ad_y_fract = fract(gl_FragCoord.y / (alpha_inverted) + 1.);
float ad_x_cosine_a = sin((gl_FragCoord.x) * ad_pi);
float ad_y_cosine_a = cos((gl_FragCoord.y + gl_FragCoord.x) * ad_pi);
float ad_x_cosine_b = sin((gl_FragCoord.x) * ad_half_pi);
float ad_y_cosine_b = cos((gl_FragCoord.y + gl_FragCoord.x) * ad_half_pi);
float ad_pat_a = (ad_x_cosine_a + ad_y_cosine_a);
float ad_pat_b = (ad_x_cosine_b + ad_y_cosine_b);

	// alpha_dithered = pow(
	// 	(ad_x_fract + ad_y_fract) * pow(ad_orig_alpha, mix(0.2, 1.5, ad_orig_alpha)) + pow(ad_orig_alpha, 1.5),
	// 	2.
	// );

alpha_dithered = mix(((ad_pat_a + ad_pat_b) / ad_dsq2) * (ad_orig_alpha) * ad_dsq2, ((ad_pat_a + ad_pat_b) / ad_dsq2) + (ad_orig_alpha) * ad_dsq2, ad_orig_alpha);

if(alpha_dithered < alphaTest) discard;
#endif
