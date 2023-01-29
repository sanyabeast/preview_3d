

import { notify_render, start_render } from './render.js';
import { state } from './data.js'
import { loaders, init_loaders } from './loaders.js'
import { init_gui, set_loader, collapse_gui, notify_error } from './gui.js'
import { init_controls } from './controls.js'


let inited = false
let os_tools = window.os_tools

init();

function init() {
    if (inited) return
    inited = true
    init_controls({ load_scene })
    init_loaders()
    init_gui()

    /* loading assets */
    loaders['hdr'](state.env_texture_src)
    load_scene()
    start_render()
    notify_render()
}

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

window.load_file = function (file_path) {
    load_scene(file_path)
}