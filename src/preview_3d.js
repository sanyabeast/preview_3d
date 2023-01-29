import { Notyf } from 'notyf';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

import { state } from './data.js'
import { loaders, init_loaders } from './loaders.js'
import { init_gui, set_loader, collapse_gui, update_title } from './gui.js'

console.log(state)

let inited = false
let notyf = new Notyf({
    position: {
        x: 'left',
        y: 'bottom'
    }
});

let prev_frame_date = +new Date()
let target_fps = 60
let os_tools = window.os_tools
let controls
let camera, world, renderer;
let torch_light
let axes_helper, grid_helper_10, grid_helper_100, grid_helper_1000
let composer
let file_input = document.body.querySelector('#file_input')
let render_loop_id
let render_needs_update = true

file_input.onchange = e => {
    load_scene(e.target.files[0].path)
}

init();
notify_render();

function init() {
    if (inited) return
    inited = true

    init_renderer()
    init_world()
    init_postfx()
    init_controls()
    init_loaders({ renderer, set_active_scene, set_env_texture })
    init_gui({ state, camera, renderer, composer, notify_render })

    /* loading assets */
    loaders['hdr'](state.env_texture_src)
    load_scene()

    render_loop_id = requestAnimationFrame(render)

    if (state.check_updates === true && Math.random() < 0.25) {
        setTimeout(check_updates, 1000)
    }
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
        frame_object()
        console.log('spawning scene...')
        console.log(scene)
        world.add(scene);
        update_title()
    }

    notify_render();
    setTimeout(() => {
        notify_render()
    }, 500)

    set_loader(false)
}

function handle_drag_and_drop(event) {
    event.preventDefault()
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
        let file_path = event.dataTransfer.files[0].path
        state.scene_src = os_tools.path.resolve(file_path)
        load_scene()
    }
}

function init_renderer() {
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

function init_controls() {
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
    axes_helper.scale.setScalar(max_value / 2)
    // grid_helper.scale.setScalar(max_value / 2)
    console.log(max_value)
    controls.object.position.set(0, max_value * 1.5, -max_value * 3)
    controls.saveState()
    controls.reset()
}

function load_scene(scene_src) {
    set_loader(true)
    collapse_gui();
    if (scene_src !== undefined) {
        state.scene_src = os_tools.path.resolve(scene_src)
    }

    let model_format = os_tools.path.extname(state.scene_src).replace(".", '')
    try {
        loaders[model_format](state.scene_src)
    } catch (error) {
        console.error(error)
        notify_error(error.message)
        set_loader(false)
    }
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

function set_env_texture(texture) {
    state.env_texture = texture
    texture.mapping = THREE.EquirectangularReflectionMapping;
    world.background = texture;
    world.environment = texture;
    notify_render();
}

window.load_file = function (file_path) {
    load_scene(file_path)
}