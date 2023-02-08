
import ShaderChunk from 'three'

function enable_pcss_shadows() {
    let shader = ShaderChunk.shadowmap_pars_fragment;

    shader = shader.replace(
        '#ifdef USE_SHADOWMAP',
        '#ifdef USE_SHADOWMAP' +
        '\n' +
        ASSETS.texts.pcss_glsl
    );

    shader = shader.replace(
        '#if defined( SHADOWMAP_TYPE_PCF )' +
        '\n' +
        ASSETS.texts.pcss_get_shadow_glsl +
        '\n' +
        '#if defined( SHADOWMAP_TYPE_PCF )'
    );

    ShaderChunk.shadowmap_pars_fragment = shader;
}

export default enable_pcss_shadows