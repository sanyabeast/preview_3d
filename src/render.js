


/** Created by @sanyabeast | 28 Jan 2023 | Kyiv, Ukraine */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

import { state } from './state.js'
import { set_loader, update_title } from './gui.js';
import { frame_object } from './controls.js';
import { loaders } from './loaders.js';

let camera, world, renderer, composer

let render_needs_update = true
let render_loop_id
let render_timeout = +new Date()

function init_render() {
    /** main renderer */
    const container = document.createElement('div');
    document.body.appendChild(container);
    document.body.classList.add(window.IS_DEVELOPMENT ? 'development' : 'production')
    renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);
    /* main scene setup */
    camera = new THREE.PerspectiveCamera(state.camera_fov, window.innerWidth / window.innerHeight, 0.1, 1000000);
    camera.position.set(0, 100, 0);
}

function init_world() {
    const environment = new RoomEnvironment();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);

    world = new THREE.Scene();
    world.background = new THREE.Color(0xbbbbbb);
    world.environment = pmremGenerator.fromScene(environment).texture;
    environment.dispose();

    let sun = new THREE.DirectionalLight()
    let amb = new THREE.AmbientLight()
    amb.intensity = 0.2;
    sun.position.set(1000, 1000, 1000)
    sun.intensity = 1
    world.add(sun)
    world.add(amb)




    state.env_default_background = world.background
    state.env_default_texture = world.environment
}

function init_postfx() {
    const render_pass = new RenderPass(world, camera);
    const bloom_pass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloom_pass.threshold = state.postfx_bloom_treshold;
    bloom_pass.strength = state.postfx_bloom_strength;
    bloom_pass.radius = state.postfx_bloom_radius;
    const ssao_pass = new SSAOPass(world, camera, window.innerWidth, window.innerHeight);
    ssao_pass.kernelRadius = 1;
    composer = new EffectComposer(renderer);
    composer.addPass(render_pass);
    composer.addPass(ssao_pass);
    composer.addPass(bloom_pass);
    

}

function set_environment_texture(texture) {
    state.env_texture = texture
    texture.mapping = THREE.EquirectangularReflectionMapping;
    world.background = texture;
    world.environment = texture;
    notify_render();
}

function set_environment(alias) {
    console.log(`${LOCAL_BASE_PATH}/assets/hdr/${ASSETS.hdr[alias]}`)
    loaders['hdr'](`${LOCAL_BASE_PATH}/assets/hdr/${ASSETS.hdr[alias]}`)
}

function notify_render(duration = 0) {
    render_timeout = +new Date() + duration
    render_needs_update = true
}

function render() {
    render_loop_id = requestAnimationFrame(render)

    if (render_needs_update === true || +new Date() < render_timeout) {
        
        if (state.postfx_enabled) {
            composer.render();
        } else {
            renderer.render(world, camera);
        }
    }
    render_needs_update = false
}

function start_render() {
    render_loop_id = requestAnimationFrame(render)
}

function stop_render() {
    cancelAnimationFrame(render_loop_id)
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

init_render()
init_world()
init_postfx()


export {
    camera,
    world,
    renderer,
    composer,
    set_environment_texture,
    start_render,
    stop_render,
    notify_render,
    set_active_scene,
    set_environment
}