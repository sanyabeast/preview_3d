/** Created by @sanyabeast | 28 Jan 2023 | Kyiv, Ukraine */
import * as THREE from 'three';
import { AnimationMixer } from 'three'

import { notify_render, start_render, init_render, loop_tasks, set_daytime, update_matrix } from './render.js';
import { loaders, init_loaders } from './loaders.js'
import { init_gui, set_loader, notifications, panes, update_title } from './gui.js'
import { init_controls, frame_object } from './controls.js'
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
    set_daytime(0.5)
    console.log(`[load_scene] prepare to load: `, scene_src, state.scene_src)
    scene_src = _.isString(scene_src) ? scene_src : state.scene_src
    if (_.isString(scene_src) && scene_src.length > 0) {
        set_loader(true)
        state.scene_src = scene_src;
        write_url('file_parameter', scene_src)
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
            set_active_scene(scene_state.scene)
            setup_scene()
        }

    } else {
        console.log(`load_scene: attempt to load invalid src: ${scene_src}`)
    }
}


function set_active_scene(scene) {
    if (scene.isObject3D) {
        if (state.active_scene) {
            console.log('removing scene...')
            world.remove(state.active_scene)
        }

        state.active_scene = scene
        state.scene_aabb = new THREE.Box3();
        state.scene_aabb.setFromObject(scene);
        console.log('spawning scene...')
        console.log(scene)
        world.add(scene);
        update_title()
        frame_object()
    }

    notify_render(1000);
    set_loader(false)
}


function setup_scene() {
    /** animations */
    animation_folder_gui.item.hidden = scene_state.animations.length === 0;
    animation_folder_gui.actions.children.forEach((child, index) => {
        child.hidden = index >= scene_state.animations.length
    })
    if (scene_state.animations.length > 0) {
        animation_mixer = new AnimationMixer(state.active_scene);
        scene_state.animations.forEach((animation_clip, index) => {
            scene_state.actions[index] = animation_mixer.clipAction(animation_clip)
            if (!animation_folder_gui.actions.children[index]) {
                let slider_data = { weight: 1 }
                let slider = animation_folder_gui.actions.addInput(slider_data, 'weight', {
                    label: animation_clip.name,
                    min: 0,
                    max: 1,
                    step: 0.1
                }).on('change', ({ value }) => {
                    scene_state.actions[index].enabled = value > 0
                    scene_state.actions[index].setEffectiveTimeScale(1);
                    scene_state.actions[index].setEffectiveWeight(value);
                })
                slider.slider_data = slider_data;
            } else {
                let slider = animation_folder_gui.actions.children[index]
                slider.label = animation_clip.name
                slider.slider_data.weight = 1
                slider.refresh()
            }
        })
        loop_tasks.update_animation_mixer = (d, td) => {
            if (animation_state.disable_animations !== true) {
                animation_mixer.update(td)
                update_matrix()
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
    /** shadows */
    scene_state.scene.traverse((node) => {
        if (node.isMesh) {
            node.receiveShadow = true
            node.castShadow = true
        }
    })
}

function load_sample(sample_name) {
    load_scene(`${__dirname}/assets/samples/${ASSETS.samples[sample_name]}`)
}
function init_animation_player() {
    animation_folder_gui = extend_gui(panes.main.item, {
        type: 'folder',
        title: '🤹‍♀️ Animations',
        children: {
            'disable_animations': {
                type: 'input',
                bind: [animation_state, 'disable_animations'],
                label: "⛔️ Pause all",
                on_change: ({ value }) => {
                    console.log(value, scene_state)
                }
            },
            'global_timescale': {
                type: 'input',
                bind: [animation_state, 'global_timescale'],
                label: "🕑 Timescale",
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
    state,
    set_active_scene
}