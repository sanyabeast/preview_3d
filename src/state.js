
const state = {
    env_enabled: true,
    env_texture_src: 'assets/hdr/atelier.hdr',
    env_default_background: null,
    env_default_texture: null,
    env_texture: null,
    postfx_enabled: false,
    postfx_bloom_exposure: 1,
    postfx_bloom_strength: 0.2,
    postfx_bloom_treshold: 0.5,
    postfx_bloom_radius: 0.2,
    camera_fov: 45,
    scene_src: window.file_to_open || '',
    resolution_scale: 1,
    active_scene: null,
    show_gizmo: true,
    torch_light: false,
    application_has_updates: '',
    check_updates: true,
    inspect_mode: '',
    inspect_matcap_mode: 'AAA',
}

export {
    state
}