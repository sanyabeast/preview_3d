

import { read_url } from "./util.js"

console.log(`[state] open parameter: `, process.env.file_parameter)
let startup_scene_src = read_url('scene_src') !== null ? read_url('scene_src') : process.env.file_parameter

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
    scene_src: startup_scene_src || '',
    resolution_scale: process.platform === 'darwin' ? 0.65 : 1,
    active_scene: null,
    show_gizmo: true,
    torch_light: false,
    application_has_updates: '',
    check_updates: true,
    inspect_mode: '',
    inspect_matcap_file: '',
    inspect_matcap_mode: ''
}

export {
    state
}