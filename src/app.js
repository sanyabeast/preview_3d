/** Created by @sanyabeast | 28 Jan 2023 | Kyiv, Ukraine */

import { AnimationMixer } from 'three'

import { notify_render, start_render, init_render, loop_tasks } from './render.js';
import { loaders, init_loaders } from './loaders.js'
import { init_gui, set_loader, notifications, panes } from './gui.js'
import { init_controls } from './controls.js'
import { state } from './state.js';
import { init_inspect } from './inspect.js';
import { write_url, loge, logd, extend_gui } from './util.js';

let OS_TOOLS = window.OS_TOOLS
let is_running = false

let scene_state = {
    animations: [],
    actions: [],
    current_position: 0,
}

let animation_state = {
    disable_animations: false,
    global_timescale: 1
}
let animation_folder_gui
let animation_mixer

async function load_scene(scene_src) {
    kill_animations()
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
                _.assign(scene_state, await loaders[model_format](state.scene_src))
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
    console.log(scene_state)
    animation_folder_gui.item.hidden = scene_state.animations.length === 0
    animation_folder_gui.actions.children.forEach((child, index) => {
        if (index < scene_state.animations.length) {
            child.hidden = false
        } else {
            child.hidden = true
        }
    })

    if (scene_state.animations.length > 0) {
        animation_mixer = new AnimationMixer(state.active_scene);

        scene_state.animations.forEach((anim_data, index) => {
            console.log(anim_data)
            let action = scene_state.actions[index] = animation_mixer.clipAction(anim_data)
            anim_data.custom_weight = 1
            if (!animation_folder_gui.actions.children[index]) {
                animation_folder_gui.actions.addInput(anim_data, 'custom_weight', {
                    label: anim_data.name,
                    min: 0,
                    max: 1,
                    step: 0.1
                }).on('change', ({ value }) => {
                    scene_state.actions[index].enabled = value > 0
                    scene_state.actions[index].setEffectiveTimeScale(1);
                    scene_state.actions[index].setEffectiveWeight(value);
                })
            } else {
                animation_folder_gui.actions.children[index].label = anim_data.name
            }
        })

        loop_tasks.update_animation_mixer = (d, td) => {
            if (animation_state.disable_animations !== true) {
                animation_mixer.update(td)
                notify_render()
            }
        }
    } else {
        loop_tasks.update_animation_mixer = () => { }
    }

    scene_state.actions.forEach((action) => {
        action.enabled = true;
        action.play()
    })
}

function load_sample(sample_name) {
    load_scene(`${__dirname}/assets/samples/${ASSETS.samples[sample_name]}`)
}

function init_animation_player() {
    /** animation plauer */
    animation_folder_gui = extend_gui(panes.main.item, {
        type: 'folder',
        title: '🤹‍♀️ Animations',
        children: {
            'disable_animations': {
                type: 'input',
                bind: [animation_state, 'disable_animations'],
                label: "Pause all",
                on_change: ({ value }) => {
                    console.log(value, scene_state)
                }
            },
            'global_timescale': {
                type: 'input',
                bind: [animation_state, 'global_timescale'],
                label: "Timescale",
                min: 0,
                max: 10,
                step: 0.1,
                on_change: ({ value }) => {
                    animation_mixer.timeScale = value
                }
            },
            'actions': {
                type: 'folder',
                title: '🎛 Actions weight'
            }
        }
    })

    // panes.main.animations = animation_folder_gui.item
}

function kill_animations() {
    scene_state.actions.forEach(action => {
        action.enabled = false
        action.stop()
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