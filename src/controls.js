
/** Created by @sanyabeast | 28 Jan 2023 | Kyiv, Ukraine */

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { camera, renderer, notify_render } from './render.js';
import { state } from './state.js';
import { collapse_gui } from './gui.js';

let controls
let file_input = document.body.querySelector('#file_input')
file_input.setAttribute("accept", EXTENSIONS.join(', '))
let load_scene

file_input.onchange = e => {
    load_scene(e.target.files[0].path)
}

function init_controls(params) {
    load_scene = params.load_scene
    window.addEventListener('dragenter', handle_drag_and_drop, false)
    window.addEventListener('dragleave', handle_drag_and_drop, false)
    window.addEventListener('dragover', handle_drag_and_drop, false)
    window.addEventListener('drop', handle_drag_and_drop, false)

    window.addEventListener("keydown", async (event) => {
        console.log(`keycode: ${event.keyCode}`)
        switch (event.keyCode) {
            case 70: {
                event.preventDefault()
                frame_object();
                break;
            }
            case 32: {
                event.preventDefault()
                frame_object();
                break;
            }
            case 110: {
                event.preventDefault()
                frame_object();
                break;
            }
            case 220: {
                event.preventDefault()
                frame_object();
                break;
            }
            case 82: {
                event.preventDefault()
                if (event.ctrlKey || event.metaKey) {
                    window.navigation.reload()
                } else {
                    await load_scene()
                }
                break;
            }
            case 27: {
                event.preventDefault()
                collapse_gui()
                break;
            }
            case 78: {
                event.preventDefault()
                if (event.metaKey || event.ctrlKey) {
                    new_window()
                }
                break;
            }
            case 79: {
                event.preventDefault()
                file_input.click()
                break;
            }
            case 8: {
                event.preventDefault()
                collapse_gui()
                break;
            }
            default: {
                console.log(`keycode: ${event.keyCode}`)
            }
        }
    }, false)

    controls = new OrbitControls(camera, renderer.domElement);
    watch_controls(notify_render)
    controls.minDistance = 0;
    controls.maxDistance = Infinity;
    controls.target.set(0, 0, 0);
    controls.object.position.set(0, 256, 512)
    controls.update();

    // renderer.domElement.addEventListener("mousedown", collapse_gui)
}

function frame_object() {
    let max_value = Math.max(
        Math.abs(state.scene_aabb.min.x),
        Math.abs(state.scene_aabb.min.y),
        Math.abs(state.scene_aabb.min.z),
        Math.abs(state.scene_aabb.max.x),
        Math.abs(state.scene_aabb.max.y),
        Math.abs(state.scene_aabb.max.z)
    )

    controls.target.set(
        (state.scene_aabb.min.x + state.scene_aabb.max.x) / 2,
        (state.scene_aabb.min.y + state.scene_aabb.max.y) / 2,
        (state.scene_aabb.min.z + state.scene_aabb.max.z) / 2
    );
    // grid_helper.scale.setScalar(max_value / 2)
    console.log(max_value)
    controls.object.position.set(0, max_value * 1.5, max_value * 3)
    controls.saveState()
    controls.reset()
}

async function handle_drag_and_drop(event) {
    event.preventDefault()
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
        let file_path = event.dataTransfer.files[0].path
        await load_scene(file_path)
    }
}

function watch_controls(handle_change) {
    controls.addEventListener('change', handle_change); // use if there is no animation loop

}


export {
    init_controls,
    frame_object,
    watch_controls
}