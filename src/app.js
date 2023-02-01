/** Created by @sanyabeast | 28 Jan 2023 | Kyiv, Ukraine */

import { notify_render, start_render, init_render } from './render.js';
import { loaders, init_loaders } from './loaders.js'
import { init_gui, set_loader, notifications, panes } from './gui.js'
import { init_controls } from './controls.js'
import { state } from './state.js';
import { init_inspect } from './inspect.js';
import { write_url, loge, logd, extend_gui } from './util.js';

let OS_TOOLS = window.OS_TOOLS
let is_running = false
let scene_data
let animation_folder_gui

async function load_scene(scene_src) {
    console.log(`[load_scene] prepare to load: `, scene_src, state.scene_src)
    scene_src = _.isString(scene_src) ? scene_src : state.scene_src
    if (_.isString(scene_src) && scene_src.length > 0) {
        set_loader(true)
        state.scene_src = scene_src;
        write_url('scene_src', scene_src)
        let model_format = OS_TOOLS.path.extname(state.scene_src).replace(".", '')
        let is_ok = false
        try {
            if (model_format in loaders) {
                scene_data = await loaders[model_format](state.scene_src)
                is_ok = true
            } else {
                throw new Error(`Unrecognized file format: ${model_format}`)
            }
        } catch (error) {
            loge('app/load_scene', error.message)
            notifications.open({
                type: 'error',
                message: error.message,
            })
            set_loader(false)
        }

        if (is_ok) {
            setup_scene()
        }

    } else {
        console.log(`load_scene: attempt to load invalid src: ${scene_src}`)
    }

}

function setup_scene() {
    scene_data = scene_data || {
        animations: []
    }

    animation_folder_gui.item.hidden = scene_data.animations.length === 0

    animation_folder_gui.item.children.forEach((child, index) => {
        if (index > scene_data.animations.length) {
            child.hidden = true
        } else {
            chil.hidden = false
        }
    })

    scene_data.animations.forEach((anim_data, index) => {
        console.log(anim_data)
        anim_data.lel = 1
        if (!animation_folder_gui.item.children[index]) {
            animation_folder_gui.item.addInput(anim_data, 'lel', {
                label: anim_data.name,
                min: 0,
                max: anim_data.duration,
                step: anim_data.duration / 100
            }).on('change', (evt) => {
                console.log(evt)
            })
        } else {
            console.log('exist', animation_folder_gui.item.children[index])
        }
    })

    animation_folder_gui.item.chil
}

function load_sample(sample_name) {
    load_scene(`${__dirname}/assets/samples/${ASSETS.samples[sample_name]}`)
}

function init_animation_player() {
    /** animation plauer */
    animation_folder_gui = extend_gui(panes.main.item, {
        type: 'folder',
        title: '🤹‍♀️ Animations'
    })


}


async function launch() {
    if (is_running) return
    is_running = true
    init_controls({ load_scene })
    init_loaders()
    init_inspect()
    init_gui()
    init_animation_player()
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