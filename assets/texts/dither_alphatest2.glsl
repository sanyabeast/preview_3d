
#ifdef USE_ALPHATEST
    vec4 ditherTex = texture2D(screenDoorTexture, gl_FragCoord.xy / 6.);
    float ditherAlpha = clamp(ditherTex.r * (diffuseColor.a * 2.), 0., 1.);

    if(ditherAlpha < 0.5) {
        discard;
    }
#endif

