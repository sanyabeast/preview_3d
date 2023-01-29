


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

let prev_frame_date = +new Date()
let target_fps = 60
let camera, world, renderer, composer
let axes_helper, grid_helper_10, grid_helper_100, grid_helper_1000
let torch_light
let render_needs_update = true
let render_loop_id

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
    ssao_pass.kernelRadius = 8;
    composer = new EffectComposer(renderer);
    composer.addPass(render_pass);
    composer.addPass(bloom_pass);
    //composer.addPass(ssao_pass);

}

function set_env_texture(texture) {
    state.env_texture = texture
    texture.mapping = THREE.EquirectangularReflectionMapping;
    world.background = texture;
    world.environment = texture;
    notify_render();
}

function notify_render() {
    render_needs_update = true
}

function render() {
    render_loop_id = requestAnimationFrame(render)

    if (render_needs_update === false) return
    if (+new Date() - prev_frame_date < 1000 / target_fps) return
    prev_frame_date = +new Date()
    /** --- */
    torch_light.position.copy(camera.position)

    if (state.postfx_enabled) {
        composer.render();
    } else {
        renderer.render(world, camera);
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

    notify_render();
    setTimeout(() => {
        notify_render()
    }, 500)

    set_loader(false)
}

init_render()
init_world()
init_postfx()

const gizmo = {
    axes_helper,
    grid_helper_10,
    grid_helper_100,
    grid_helper_1000
}

export {
    camera,
    world,
    renderer,
    composer,
    torch_light,
    gizmo,
    set_env_texture,
    start_render,
    stop_render,
    notify_render,
    set_active_scene
}