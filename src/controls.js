
/** Created by @sanyabeast | 28 Jan 2023 | Kyiv, Ukraine */

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { camera, renderer, notify_render, pilot_camera } from './render.js';
import { state } from './state.js';
import { collapse_gui } from './gui.js';
import { set_inspection_mode } from './inspect.js';

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
                panic_escape()
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
    controls.enablePan = false
    watch_controls(notify_render)
    controls.minDistance = 0;
    controls.maxDistance = 8;

    controls.target.set(0, 0, 0);
    controls.object.position.set(0, 1, 2)
    controls.update();

    // renderer.domElement.addEventListener("mousedown", collapse_gui)
}

function panic_escape() {
    pilot_camera(null)
    set_inspection_mode(null)
    collapse_gui()
}

function frame_object() {
    controls.target.set(
        scene_state.metric.center.x,
        scene_state.metric.center.y,
        scene_state.metric.center.z,
    );
    controls.object.position.set(0, 1, 2)
    controls.saveState()
    controls.reset()
    pilot_camera(null)
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