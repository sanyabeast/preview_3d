/** Created by @sanyabeast | 28 Jan 2023 | Kyiv, Ukraine */

import { notify_render, start_render } from './render.js';
import { loaders, init_loaders } from './loaders.js'
import { init_gui, set_loader, collapse_gui, notify_error } from './gui.js'
import { init_controls } from './controls.js'
import { state } from './state.js';
import { init_inspect } from './inspect.js';

let os_tools = window.os_tools
let is_running = false

function load_scene(scene_src) {
    set_loader(true)
    collapse_gui();
    if (scene_src !== undefined) {
        state.scene_src = os_tools.path.resolve(scene_src)
    }

    let model_format = os_tools.path.extname(state.scene_src).replace(".", '')
    try {
        loaders[model_format](state.scene_src)
    } catch (error) {
        console.error(error)
        notify_error(error.message)
        set_loader(false)
    }
}

function load_sample(sample_name) {
    load_scene(`${LOCAL_BASE_PATH}/assets/samples/${ASSETS.samples[sample_name]}`)
}

function launch() {
    if (is_running) return
    is_running = true
    init_controls({ load_scene })
    init_loaders()
    init_inspect()
    init_gui()
    /* loading assets */
    loaders['hdr'](state.env_texture_src)
    load_scene()
    start_render()
    notify_render()
}

window.load_file = function (file_path) {
    load_scene(file_path)
}

export {
    load_scene,
    load_sample,
    launch,
    state
}