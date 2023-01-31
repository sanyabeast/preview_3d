
/** Created by @sanyabeast | 28 Jan 2023 | Kyiv, Ukraine */

import * as THREE from 'three';
import { texture_loader } from './loaders.js';
import { state } from './state.js';
import { notify_render, world, camera } from './render.js';
import { random_choice } from './util.js';
import { watch_controls } from './controls.js';

let matcap_materials = {}
let inspect_materials = {}
let torch_light
let axes_helper, grid_helper_10, grid_helper_100, grid_helper_1000

let inspect_modes = {
    "None": {
        get_material: () => null
    },
    "Albedo": {
        get_material: () => {
            let mat = inspect_materials.Albedo
            if (!mat) {
                mat = inspect_materials.mat = new THREE.MeshBasicMaterial()
                mat.override_map = 'map'
            }
            return mat
        }
    },
    "Roughness": {
        get_material: () => {
            let mat = inspect_materials.Albedo
            if (!mat) {
                mat = inspect_materials.mat = new THREE.MeshBasicMaterial()
                mat.override_map = 'roughnessMap'
            }
            return mat
        }
    },
    "Wireframe": {
        get_material: () => {
            let mat = inspect_materials.Wireframe
            if (!mat) {
                mat = inspect_materials.mat = new THREE.MeshBasicMaterial({ wireframe: true })
            }
            return mat

        }
    },
    "Matcap": {
        get_material: () => {
            if (matcap_materials[state.inspect_matcap_mode]) {
                return matcap_materials[state.inspect_matcap_mode]
            } else {
                let mat = matcap_materials[state.inspect_matcap_mode] = new THREE.MeshMatcapMaterial({
                    matcap: texture_loader.load(`${LOCAL_BASE_PATH}/assets/matcap/${state.inspect_matcap_file}`)
                })

                return mat
            }
        }
    },
    "Normal": {
        get_material: () => {
            let mat = inspect_materials.Normal
            if (!mat) {
                mat = inspect_materials.mat = new THREE.MeshNormalMaterial()
            }
            return mat

        }
    },
    "Distance": {
        get_material: () => {
            let mat = inspect_materials.Wireframe
            if (!mat) {
                mat = inspect_materials.mat = new THREE.MeshDistanceMaterial()
            }
            return mat
        }
    },
    "Lambert": {
        get_material: () => {
            let mat = inspect_materials.Wireframe
            if (!mat) {
                mat = inspect_materials.mat = new THREE.MeshLambertMaterial()
                mat.override_map = 'map'
            }
            return mat
        }
    },
    "Phong": {
        get_material: () => {
            let mat = inspect_materials.Wireframe
            if (!mat) {
                mat = inspect_materials.mat = new THREE.MeshPhongMaterial()
                mat.override_map = 'map'
            }
            return mat
        }
    }
}

function init_inspect() {
    torch_light = new THREE.PointLight()
    torch_light.intensity = 0.5
    torch_light.visible = state.torch_light
    world.add(torch_light)

    axes_helper = new THREE.AxesHelper(2);
    axes_helper.visible = state.show_gizmo
    world.add(axes_helper)

    grid_helper_10 = new THREE.GridHelper(10, 10, 0xffffff, 0xffffff);
    grid_helper_10.material.opacity = 0.1;
    grid_helper_10.material.depthWrite = false;
    grid_helper_10.material.transparent = true;
    grid_helper_10.visible = state.show_gizmo
    world.add(grid_helper_10);

    grid_helper_100 = new THREE.GridHelper(100, 10, 0xffffff, 0xffffff);
    grid_helper_100.material.opacity = 0.1;
    grid_helper_100.material.depthWrite = false;
    grid_helper_100.material.transparent = true;
    grid_helper_100.visible = state.show_gizmo
    world.add(grid_helper_100);


    grid_helper_1000 = new THREE.GridHelper(1000, 10, 0xffffff, 0xffffff);
    grid_helper_1000.material.opacity = 0.1;
    grid_helper_1000.material.depthWrite = false;
    grid_helper_1000.material.transparent = true;
    grid_helper_1000.visible = state.show_gizmo
    world.add(grid_helper_1000);

    set_matcap(random_choice(Object.keys(ASSETS.matcap)))

    watch_controls(() => {
        torch_light.position.copy(camera.position)
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
    state.inspect_mode = mode
    world.overrideMaterial = inspect_modes[mode]?.get_material() || null
    notify_render(1000)
}

const gizmo = {
    axes_helper,
    grid_helper_10,
    grid_helper_100,
    grid_helper_1000
}


export {
    init_inspect,
    inspect_modes,
    set_matcap,
    set_inspection_mode,
    gizmo,
    torch_light
}