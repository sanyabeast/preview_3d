


/** Created by @sanyabeast | 28 Jan 2023 | Kyiv, Ukraine */

import * as THREE from 'three';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

import { renderer, set_environment_texture, set_active_scene } from './render.js';

/** loaders */
let texture_loader = new THREE.TextureLoader()
let ktx2Loader,
    dracoLoader,
    gltf_loader,
    fbx_loader,
    obj_loader,
    mtl_loader;

let loaders = {
    hdr: (texture_src) => {
        new RGBELoader().load(texture_src, function (texture) {
            set_environment_texture(texture)
        });
    },
    gltf: (scene_src) => {
        /** --- */
        const base_path = os_tools.path.dirname(scene_src);
        const model_path = os_tools.path.basename(scene_src);
        console.log(base_path)

        gltf_loader = gltf_loader || new GLTFLoader()
            .setDRACOLoader(dracoLoader)
            .setKTX2Loader(ktx2Loader)
            .setMeshoptDecoder(MeshoptDecoder)

        gltf_loader.load(scene_src, function (gltf) {
            set_active_scene(gltf.scene)
        });
    },
    glb: (scene_src) => loaders.gltf(scene_src),
    fbx: (scene_src) => {
        fbx_loader = fbx_loader || new FBXLoader();
        fbx_loader.load(scene_src, function (object) {
            set_active_scene(object)

        });
    },
    obj: (scene_src) => {
        let base_path = os_tools.path.dirname(scene_src)
        obj_loader = obj_loader || new OBJLoader()
        mtl_loader = mtl_loader || new MTLLoader()

        try {
            mtl_loader.load(scene_src.replace('.obj', '.mtl'), function (materials) {
                console.log(materials)
                materials.preload();
                obj_loader.setMaterials(materials)
                obj_loader.load(scene_src, function (object) {
                    set_active_scene(object)
                });
            })
        } catch (err) {
            console.error(err)
            obj_loader.load(scene_src, function (object) {
                set_active_scene(object)
            });
        }
    }
}

function init_loaders(params) {

    ktx2Loader = new KTX2Loader()
        .setTranscoderPath('lib/three/examples/jsm/libs/basis/')
        .detectSupport(renderer);

    dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('lib/three/examples/jsm/libs/draco/gltf/');
}

export {
    loaders,
    init_loaders,
    texture_loader
}