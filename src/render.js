


/** Created by @sanyabeast | 28 Jan 2023 | Kyiv, Ukraine */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { SAOPass } from 'three/addons/postprocessing/SAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

import { state } from './state.js'
import { loaders } from './loaders.js';


const USE_LOGDEPTHBUF = true

let camera, world, renderer, composer
let render_needs_update = true
let render_loop_id
let render_timeout = +new Date()
let loop_tasks = {}
let now = +new Date()
let prev_render_time = 0

let bloom_pass, ssao_pass, render_pass

function preinit_render() {
    /** main renderer */
    const container = document.createElement('div');
    document.body.appendChild(container);
    document.body.classList.add(window.IS_DEVELOPMENT ? 'development' : 'production')
    renderer = new THREE.WebGLRenderer({
        antialias: process.platform === 'darwin' ? false : true,
        logarithmicDepthBuffer: USE_LOGDEPTHBUF
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;


    container.appendChild(renderer.domElement);
    /* main scene setup */
    camera = new THREE.PerspectiveCamera(state.camera_fov, window.innerWidth / window.innerHeight, 0.1, 1000000);
    camera.position.set(0, 100, 0);

    window.renderer = renderer
    window.camera = camera

    init_world()
    init_postfx()
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
    sun.castShadow = true
    world.add(sun)
    world.add(amb)

    window.world = world

    state.env_default_background = world.background
    state.env_default_texture = world.environment
}

function init_postfx() {
    composer = new EffectComposer(renderer);

    render_pass = new RenderPass(world, camera);
    bloom_pass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloom_pass.threshold = state.postfx_bloom_treshold;
    bloom_pass.strength = state.postfx_bloom_strength;
    bloom_pass.radius = state.postfx_bloom_radius;
    //ssao_pass = new SSAOPass(world, camera, window.innerWidth, window.innerHeight);
    //ssao_pass.kernelRadius = 16;

    composer.addPass(render_pass);

    let sao_pass = new SAOPass(world, camera, false, true)
    sao_pass.params.saoScale = 1


    //sao_pass.params.saoBlurRadius = 0
    //sao_pass.params.saoKernelRadius = 10
    // sao_pass.params.output = SAOPass.OUTPUT.SAO


    //window.sao_pass = sao_pass
    composer.addPass(sao_pass);

    composer.addPass(bloom_pass);
}

function init_render() {

    //compos
}

function set_environment_texture(texture) {
    state.env_texture = texture
    texture.mapping = THREE.EquirectangularReflectionMapping;
    world.background = texture;
    world.environment = texture;
    notify_render();
}

function set_environment(alias) {
    loaders['hdr'](`${__dirname}/assets/hdr/${ASSETS.hdr[alias]}`)
}

function notify_render(duration = 0) {
    render_timeout = +new Date() + duration
    render_needs_update = true
}


function render() {
    render_loop_id = requestAnimationFrame(render)
    now = +new Date()
    const time_delta = (now - prev_render_time) / 1000
    const delta = time_delta / (1 / 60)
    const frame_delta = time_delta / (1 / state.render_fps_limit)
    if (frame_delta > 1) {
        _.forEach(loop_tasks, task => task(delta, time_delta))
        if (render_needs_update === true || now < render_timeout) {
            if (state.postfx_enabled) {
                composer.render();
            } else {
                renderer.render(world, camera);
            }
        }
        prev_render_time = now
        render_needs_update = false
    }
}

function start_render() {
    render_loop_id = requestAnimationFrame(render)
}

function stop_render() {
    cancelAnimationFrame(render_loop_id)
}

function set_fps_limit(value) {
    state.render_fps_limit = Math.floor(value)
}

preinit_render()

export {
    camera,
    world,
    renderer,
    composer,
    loop_tasks,
    set_environment_texture,
    start_render,
    stop_render,
    notify_render,
    set_environment,
    init_render,
    set_fps_limit
}