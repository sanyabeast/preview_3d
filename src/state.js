

import { read_url } from "./util.js"

console.log(`[state] open parameter: `, process.env.file_parameter)
const STARTUP_SCENE = read_url('file_parameter') !== null ? read_url('file_parameter') : process.env.file_parameter

const state = {
    env_enabled: true,
    env_texture_src: 'assets/hdr/atelier.hdr',
    env_default_background: null,
    env_default_texture: null,
    env_texture: null,
    env_intensity: 1,
    env_power: 1,
    postfx_enabled: true,
    postfx_bloom_exposure: 1,
    postfx_bloom_strength: 0.3,
    postfx_bloom_treshold: 0.9,
    postfx_bloom_radius: 1,
    camera_fov: 45,
    scene_src: STARTUP_SCENE || '',
    resolution_scale: process.platform === 'darwin' ? 0.65 : 1,
    active_scene: null,
    torch_light: false,
    application_has_updates: '',
    check_updates: true,
    inspect_mode: '',
    inspect_show_gizmo: true,
    inspect_matcap_file: '',
    inspect_matcap_mode: '',
    render_fps_limit: process.platform === 'darwin' ? Infinity : Infinity,
    render_ambient_intensity: 0.5,
    render_sun_height: 1,
    render_sun_azimuth: 0.5,
    render_daytime: 0.5,
    render_dynamic_resolution: false
}

window.state = state

export {
    state
}