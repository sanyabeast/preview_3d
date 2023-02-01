/** Created by @sanyabeast | 28 Jan 2023 | Kyiv, Ukraine */

import { notify_render, start_render, init_render } from './render.js';
import { loaders, init_loaders } from './loaders.js'
import { init_gui, set_loader, notifications } from './gui.js'
import { init_controls } from './controls.js'
import { state } from './state.js';
import { init_inspect } from './inspect.js';
import { write_url } from './util.js';

let OS_TOOLS = window.OS_TOOLS
let is_running = false

async function load_scene(scene_src) {
    console.log(`[load_scene] prepare to load: `, scene_src, state.scene_src)
    scene_src = _.isString(scene_src) ? scene_src : state.scene_src
    if (_.isString(scene_src) && scene_src.length > 0) {
        set_loader(true)
        state.scene_src = scene_src;
        write_url('scene_src', scene_src)
        let model_format = OS_TOOLS.path.extname(state.scene_src).replace(".", '')
        try {
            if (model_format in loaders) {
                await loaders[model_format](state.scene_src)
            } else {
                throw new Error(`Unrecognized file format: ${model_format}`)
            }

        } catch (error) {
            console.error(error)
            notifications.dismissable({ message: error.message, dismissable: true })
            set_loader(false)
        }
    } else {
        console.log(`load_scene: attempt to load invalid src: ${scene_src}`)
    }

}

function load_sample(sample_name) {
    load_scene(`${__dirname}/assets/samples/${ASSETS.samples[sample_name]}`)
}

async function launch() {
    if (is_running) return
    is_running = true
    init_controls({ load_scene })
    init_loaders()
    init_inspect()
    init_gui()
    init_render()
    /* loading assets */
    loaders['hdr'](state.env_texture_src)
    await load_scene()
    start_render()
    notify_render()
}

window.load_file = async function (file_path) {
    await load_scene(file_path)
}

export {
    load_scene,
    load_sample,
    launch,
    state
}