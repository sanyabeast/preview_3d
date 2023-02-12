
/** Created by @sanyabeast | 28 Jan 2023 | Kyiv, Ukraine */

import {
    MeshBasicMaterial,
    MeshPhongMaterial,
    MeshNormalMaterial,
    MeshMatcapMaterial,
    MeshLambertMaterial,
    PointLight,
    SpotLight,
    DirectionalLight,
    AxesHelper,
    GridHelper,
} from 'three';
import { texture_loader } from './loaders.js';
import { state } from './state.js';
import { notify_render, second_stage, camera, update_matrix, world } from './render.js';
import { random_choice } from './util.js';
import { watch_controls } from './controls.js';
import { refresh_gui } from './gui.js';

let matcap_materials = {}
let inspect_materials = {}
let torch_light
let axes_helper, grid_helper
let gizmo = {}

let inspect_modes = {
    "None (PBR)": {
        get_material: () => null
    },
    "Albedo": {
        get_material: () => {
            let mat = inspect_materials.Albedo
            if (!mat) {
                mat = inspect_materials.mat = new MeshBasicMaterial()
                mat.override_map = 'map'
            }
            return mat
        }
    },
    "Roughness": {
        get_material: () => {
            let mat = inspect_materials.Albedo
            if (!mat) {
                mat = inspect_materials.mat = new MeshBasicMaterial()
                mat.override_map = 'roughnessMap'
            }
            return mat
        }
    },
    "Wireframe": {
        get_material: () => {
            let mat = inspect_materials.Wireframe
            if (!mat) {
                mat = inspect_materials.mat = new MeshNormalMaterial({ wireframe: true })
            }
            return mat

        }
    },
    "Matcap": {
        get_material: () => {
            if (matcap_materials[state.inspect_matcap_mode]) {
                return matcap_materials[state.inspect_matcap_mode]
            } else {
                let mat = matcap_materials[state.inspect_matcap_mode] = new MeshMatcapMaterial({
                    matcap: texture_loader.load(`${__dirname}/assets/matcap/${state.inspect_matcap_file}`)
                })

                return mat
            }
        }
    },
    "Normal": {
        get_material: () => {
            let mat = inspect_materials.Normal
            if (!mat) {
                mat = inspect_materials.mat = new MeshNormalMaterial()
            }
            return mat

        }
    },
    "Lambert": {
        get_material: () => {
            let mat = inspect_materials.Wireframe
            if (!mat) {
                mat = inspect_materials.mat = new MeshLambertMaterial()
                mat.override_map = 'map'
            }
            return mat
        }
    },
    "Phong": {
        get_material: () => {
            let mat = inspect_materials.Wireframe
            if (!mat) {
                mat = inspect_materials.mat = new MeshPhongMaterial()
                mat.override_map = 'map'
            }
            return mat
        }
    }
}

function init_inspect() {
    torch_light = new PointLight(0xffffff, 0.6666, 1, 1, 128)
    // torch_light.intensity = 2
    torch_light.visible = state.torch_light
    // torch_light.castShadow = true
    second_stage.add(torch_light)

    axes_helper = new AxesHelper(0.1);
    axes_helper.position.set(0.5, 0, 0.5)
    second_stage.add(axes_helper)

    grid_helper = new GridHelper(1, 10, 0xffffff, 0xffffff);
    grid_helper.material.opacity = 0.1;
    grid_helper.material.depthWrite = false;
    grid_helper.material.transparent = true;
    second_stage.add(grid_helper);

    gizmo.axes_helper = axes_helper
    gizmo.grid_helper = grid_helper

    set_matcap(random_choice(Object.keys(ASSETS.matcap)))

    watch_controls(() => {
        torch_light.position.copy(camera.position)
        update_matrix()
    })
}

function set_matcap(alias) {
    let file_name = ASSETS.matcap[alias]
    state.inspect_matcap_mode = alias
    state.inspect_matcap_file = file_name
    if (state.inspect_mode === 'Matcap') {
        set_inspection_mode('Matcap')
        notify_render(1000)
    }

}

function set_inspection_mode(mode) {
    if (!_.isString(mode)) {
        mode = 'None (PBR)'
    }
    state.inspect_mode = mode
    if (mode !== "None (PBR)") {
        state.postfx_enabled = false
        refresh_gui()
    }

    world.overrideMaterial = inspect_modes[mode]?.get_material() || null
    world.inspect_feature_cloned_override_material = mode !== "None (PBR)"
    window.RENDER_ONLY_MAIN = mode !== "None (PBR)"
    window.RENDER_SKIP_BACKGROUND_RENDERING = mode !== "None (PBR)"
    window.RENDER_SKIP_SHADOWMAP_RENDERING = mode !== "None (PBR)"
    state.render_flares_enabled = mode === "None (PBR)"
    notify_render(1000)
}


export {
    init_inspect,
    inspect_modes,
    set_matcap,
    set_inspection_mode,
    gizmo,
    torch_light
}