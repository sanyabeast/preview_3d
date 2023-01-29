



import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { camera, renderer, notify_render } from './render.js';
import { state } from './data.js';

let controls
let file_input = document.body.querySelector('#file_input')
let load_scene

file_input.onchange = e => {
    load_scene(e.target.files[0].path)
}

function init_controls(params) {
    load_scene = params.load_scene

    document.body.addEventListener('dragenter', handle_drag_and_drop, false)
    document.body.addEventListener('dragleave', handle_drag_and_drop, false)
    document.body.addEventListener('dragover', handle_drag_and_drop, false)
    document.body.addEventListener('drop', handle_drag_and_drop, false)

    window.addEventListener("keydown", (event) => {
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
            case 13: {
                event.preventDefault()
                file_input.click()
                break;
            }
            case 82: {
                event.preventDefault()
                load_scene()
                break;
            }
            case 27: {
                event.preventDefault()
                collapse_gui()
                break;
            }
            default: {
                console.log(`keycode: ${event.keyCode}`)
            }
        }
    })

    controls = new OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', () => {
        notify_render()
    }); // use if there is no animation loop
    controls.minDistance = 0;
    controls.maxDistance = Infinity;
    controls.target.set(0, 0, 0);
    controls.object.position.set(0, 256, 512)
    controls.update();
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
    controls.object.position.set(0, max_value * 1.5, -max_value * 3)
    controls.saveState()
    controls.reset()
}

function handle_drag_and_drop(event) {
    event.preventDefault()
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
        let file_path = event.dataTransfer.files[0].path
        load_scene(file_path)
    }
}


export {
    init_controls,
    frame_object
}