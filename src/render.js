


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
import { lerp } from './util.js';
import { refresh_gui } from './gui.js';


const MIN_DAYTIME_LIGHT_INTENSITY = 0.01
const SUN_HEIGHT_MULTIPLIER = 1.5
const SUN_AZIMUTH_OFFSET = Math.PI / 2
const USE_LOGDEPTHBUF = true

let camera, world, renderer, composer
let render_needs_update = true
let render_loop_id
let render_timeout = +new Date()
let loop_tasks = {}
let now = +new Date()
let prev_render_time = 0
let sun, amb
let sun_state = {
    distance: 100,
    height: 1,
    azimuth: 0.5,
    environment_multiplier: 1
}

let is_document_visible = document.visibilityState === 'visible'
let bloom_pass, ssao_pass, render_pass

document.addEventListener('visibilitychange', (event) => {
    console.log(`document visibility: ${document.visibilityState}`)
    is_document_visible = document.visibilityState === 'visible'
})


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

    world.backgroundBlurriness = 0.5
    world.backgroundIntensity = 1

    environment.dispose();

    sun = new THREE.DirectionalLight()
    amb = new THREE.AmbientLight()
    amb.intensity = 0.2;
    sun.position.set(1000, 1000, 1000)
    sun.intensity = 1
    sun.castShadow = true

    set_sun_azimuth(0.5)
    set_sun_height(1)

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
    if (!is_document_visible || !IS_WINDOW_FOCUSED) {
        return
    }
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

function set_sun_azimuth(value) {
    value += SUN_AZIMUTH_OFFSET
    state.render_sun_azimuth = value
    sun.position.x = Math.sin(value * Math.PI * 2) * sun_state.distance
    sun.position.z = Math.cos(value * Math.PI * 2) * sun_state.distance
    notify_render()
}

function set_sun_height(value) {
    state.render_sun_height = value
    sun.position.y = lerp(0, sun_state.distance * SUN_HEIGHT_MULTIPLIER, value)
    sun.intensity = value
    notify_render()
}

function set_ambient_intentsity(value) {
    state.render_ambient_intensity = value
    amb.intensity = lerp(0, sun.intensity, value)
    notify_render()
}

function set_environment_intensity(value) {
    state.env_intensity = value
    world.backgroundIntensity = state.env_intensity
    notify_render()
}

function set_environment_power(value) {
    state.env_power = value
    /** USED MODIFIED THREE.JS API */
    world.environment_power = state.env_power
    notify_render()
}


function set_daytime(value) {
    state.render_daytime = value
    let curved_value = Math.sin(value * Math.PI)
    curved_value = Math.pow(curved_value, 2)
    set_environment_intensity(lerp(0, 1, Math.pow(curved_value, 2)))
    set_environment_power(lerp(5, 1, curved_value))
    set_sun_height(lerp(0.02, 1, curved_value))
    set_sun_azimuth(lerp(0, 1, value))
    set_ambient_intentsity(lerp(0, 0.9, curved_value))
    notify_render()
    refresh_gui();
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
    set_fps_limit,
    set_sun_azimuth,
    set_sun_height,
    set_ambient_intentsity,
    set_environment_intensity,
    set_environment_power,
    set_daytime
}