
/** Created by @sanyabeast | 28 Jan 2023 | Kyiv, Ukraine */

import * as THREE from 'three';
import { texture_loader } from './loaders.js';
import { state } from './state.js';
import { notify_render, world } from './render.js';
import { random_choice } from './util.js';

import { create_shader as create_albedo_shader } from './shaders/albedo.js';

let inspect_modes = {
    "None": {
        material: null
    },
    "Albedo": {
        material: create_albedo_shader()
    },
    "Wireframe": {
        material: new THREE.MeshBasicMaterial({ wireframe: true })
    },
    "Matcap": {
        material: new THREE.MeshMatcapMaterial()
    },
    "Normal": {
        material: new THREE.MeshNormalMaterial()
    }
}

function init_inspect() {
    set_matcap(random_choice(Object.keys(ASSETS.matcap)))
}

function set_matcap(alias) {
    let file_name = ASSETS.matcap[alias]
    state.inspect_matcap_mode = alias
    state.inspect_matcap_file = file_name
    inspect_modes["Matcap"].material.matcap = texture_loader.load(`./assets/matcap/${file_name}`)
    notify_render(1000)
}

function set_inspection_mode(mode) {
    world.overrideMaterial = inspect_modes[mode]?.material || null
    notify_render(1000)
}

export {
    init_inspect,
    inspect_modes,
    set_matcap,
    set_inspection_mode
}