

import { read_url } from "./util.js"

console.log(`[state] open parameter: `, process.env.file_parameter)
const STARTUP_SCENE = read_url('file_parameter') !== null ? read_url('file_parameter') : process.env.file_parameter

const state = {
    env_enabled: true,
    env_texture_src: 'assets/hdr/atelier.hdr',
    env_default_background: null,
    env_default_texture: null,
    env_texture: null,
    render_environment_intensity: 1,
    render_environment_influence: 1,
    postfx_bloom_exposure: 1,
    postfx_bloom_strength: 0.25,
    postfx_bloom_treshold: 0.8,
    postfx_bloom_radius: 1,
    scene_src: STARTUP_SCENE || '',
    resolution_scale: IS_MACOS ? 0.5 : 1,
    torch_light: false,
    application_has_updates: '',
    check_updates: true,
    inspect_mode: '',
    inspect_show_gizmo: true,
    inspect_matcap_file: '',
    inspect_matcap_mode: '',
    render_fps_limit: IS_MACOS ? Infinity : Infinity,
    render_ambient_intensity: 0.5,
    render_sun_height: 1,
    render_sun_azimuth: 0.5,
    render_daytime: 0.55,
    render_dynamic_resolution: false,
    render_shadows_enabled: true,
    postfx_enabled: false,
    render_camera_fov: 55,
    render_disable_animations: false,
    render_global_timescale: 1,
    render_disable_all_scenic_lights: false,
    render_scenic_light_intensity_scale: 1,
    render_environment_rotation: 0,
    render_emission_scale: 1,
    render_flares_global_intensity: 1,
    render_flares_enabled: true,
    render_alpha_rendering_mode: 1,
    render_use_autolod: false
}

window.state = state

export {
    state
}