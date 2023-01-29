import { Notyf } from 'notyf';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

import data from './data.js'
import { loaders, setup_loaders, texture_loader } from './loaders.js'

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
let camera, global_scene, renderer;
let torch_light
let axes_helper, grid_helper_10, grid_helper_100, grid_helper_1000
let composer
let main_pane, file_pane, help_pane
let new_version_pane_item
let file_input = document.body.querySelector('#file_input')
let render_loop_id
let render_needs_update = true

file_input.onchange = e => {
    load_scene(e.target.files[0].path)
}

let params = {
    ...data.default_params
}



/** inspection materials */
let matcaps = {
    'AAA': '0A0A0A_A9A9A9_525252_747474-512px',
    'AAB': '0F0F0F_4B4B4B_1C1C1C_2C2C2C-512px',
    'AAC': '1A2461_3D70DB_2C3C8F_2C6CAC-512px',
    'AAD': '1B1B1B_515151_7E7E7E_6C6C6C-512px',
    'AAE': '2D2D2A_74716E_8F8C8C_92958E-512px',
    'AAF': '2D2D2F_C6C2C5_727176_94949B-512px',
    'AAG': '2E763A_78A0B7_B3D1CF_14F209-512px',
    'AAH': '2EAC9E_61EBE3_4DDDD1_43D1C6-512px',
    'AAJ': '0404E8_0404B5_0404CB_3333FC-512px',
    'AAK': '15100F_241D1B_292424_2C2C27-512px',
    'AAL': '191514_6D5145_4E3324_3B564D-512px'
}


let override_materials = {
    wireframe: new THREE.MeshBasicMaterial({ wireframe: true }),
    matcap: new THREE.MeshMatcapMaterial({
        matcap: texture_loader.load(`./assets/matcap/${matcaps.AAA}.png`)
    }),
    normal: new THREE.MeshNormalMaterial()
}


init();
render_needs_update = true;

function init() {
    if (inited) return
    inited = true
    const width = window.innerWidth;
    const height = window.innerHeight;
    const container = document.createElement('div');
    document.body.appendChild(container);
    document.body.classList.add(window.IS_DEVELOPMENT ? 'development' : 'production')

    /** main renderer */
    renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);
    /* main scene setup */
    camera = new THREE.PerspectiveCamera(params.camera_fov, window.innerWidth / window.innerHeight, 0.1, 1000000);
    camera.position.set(0, 100, 0);

    setup_global_scene()
    setup_postfx()
    setup_controls()
    setup_loaders({ renderer, set_active_scene, set_env_texture })
    setup_gui()

    /* loading assets */
    loaders['hdr'](params.env_texture_src)
    load_scene()

    render_loop_id = requestAnimationFrame(render)

    if (params.check_updates === true && Math.random() < 0.25) {
        setTimeout(check_updates, 1000)
    }
}

function set_active_scene(scene) {
    if (scene.isObject3D) {
        if (params.active_scene) {
            console.log('removing scene...')
            global_scene.remove(params.active_scene)
        }

        params.active_scene = scene
        params.scene_aabb = new THREE.Box3();
        params.scene_aabb.setFromObject(scene);
        frame_object()
        console.log('spawning scene...')
        console.log(scene)
        global_scene.add(scene);
        update_title()
    }

    render_needs_update = true;
    setTimeout(() => {
        render_needs_update = true
    }, 500)

    set_loader(false)
}

function handle_drag_and_drop(event) {
    event.preventDefault()
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
        let file_path = event.dataTransfer.files[0].path
        params.scene_src = os_tools.path.resolve(file_path)
        load_scene()
    }
}

function setup_global_scene() {
    const environment = new RoomEnvironment();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);

    global_scene = new THREE.Scene();
    global_scene.background = new THREE.Color(0xbbbbbb);
    global_scene.environment = pmremGenerator.fromScene(environment).texture;
    environment.dispose();

    let sun = new THREE.DirectionalLight()
    let amb = new THREE.AmbientLight()
    amb.intensity = 0.2;
    sun.position.set(1000, 1000, 1000)
    sun.intensity = 1
    global_scene.add(sun)
    global_scene.add(amb)
    torch_light = new THREE.PointLight()
    torch_light.intensity = 0.5
    torch_light.visible = params.torch_light
    global_scene.add(torch_light)

    axes_helper = new THREE.AxesHelper(2);
    axes_helper.visible = params.show_gizmo
    global_scene.add(axes_helper)

    grid_helper_10 = new THREE.GridHelper(10, 10, 0xffffff, 0xffffff);
    grid_helper_10.material.opacity = 0.1;
    grid_helper_10.material.depthWrite = false;
    grid_helper_10.material.transparent = true;
    grid_helper_10.visible = params.show_gizmo
    global_scene.add(grid_helper_10);

    grid_helper_100 = new THREE.GridHelper(100, 10, 0xffffff, 0xffffff);
    grid_helper_100.material.opacity = 0.1;
    grid_helper_100.material.depthWrite = false;
    grid_helper_100.material.transparent = true;
    grid_helper_100.visible = params.show_gizmo
    global_scene.add(grid_helper_100);


    grid_helper_1000 = new THREE.GridHelper(1000, 10, 0xffffff, 0xffffff);
    grid_helper_1000.material.opacity = 0.1;
    grid_helper_1000.material.depthWrite = false;
    grid_helper_1000.material.transparent = true;
    grid_helper_1000.visible = params.show_gizmo
    global_scene.add(grid_helper_1000);

    params.env_default_background = global_scene.background
    params.env_default_texture = global_scene.environment
}

function setup_postfx() {
    const render_pass = new RenderPass(global_scene, camera);
    const bloom_pass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloom_pass.threshold = params.postfx_bloom_treshold;
    bloom_pass.strength = params.postfx_bloom_strength;
    bloom_pass.radius = params.postfx_bloom_radius;
    const ssao_pass = new SSAOPass(global_scene, camera, window.innerWidth, window.innerHeight);
    ssao_pass.kernelRadius = 8;
    composer = new EffectComposer(renderer);
    composer.addPass(render_pass);
    composer.addPass(bloom_pass);
    //composer.addPass(ssao_pass);

}

function setup_gui() {
    main_pane = new Tweakpane.Pane()
    main_pane.element.parentElement.classList.add('pane')
    main_pane.element.parentElement.classList.add('main')

    let viewport_settings_folder = main_pane.addFolder({
        title: "Viewport",
        expanded: false
    })

    /* main tab */
    viewport_settings_folder.addInput(params, 'postfx_enabled', { label: 'Postprocessing' }).on('change', ({ value }) => {
        render_needs_update = true
    });
    viewport_settings_folder.addInput(params, 'env_enabled', { label: 'Environment' }).on('change', ({ value }) => {
        if (value) {
            global_scene.background = params.env_texture;
            global_scene.environment = params.env_texture;
        } else {
            global_scene.background = params.env_default_background;
            global_scene.environment = params.env_default_texture;
        }
        render_needs_update = true
    });
    viewport_settings_folder.addInput(params, 'camera_fov', { label: "Camera FOV", min: 1, max: 120, step: 1 }).on('change', ({ value }) => {
        camera.fov = value
        camera.updateProjectionMatrix()
        render_needs_update = true
    });
    viewport_settings_folder.addInput(params, 'resolution_scale', { label: "Resolution", min: 0.5, max: 1, step: 0.05 }).on('change', ({ value }) => {
        handle_window_resized()
        render_needs_update = true
    });


    viewport_settings_folder.addInput(params, 'torch_light', { label: "Torchlight" }).on('change', ({ value }) => {
        torch_light.visible = value
        render_needs_update = true
    });

    let inspect_folder = main_pane.addFolder({ title: "Inspect", expanded: false })

    inspect_folder.addInput(params, 'show_gizmo', { label: "Gizmo" }).on('change', ({ value }) => {
        axes_helper.visible = value
        grid_helper_10.visible = value
        grid_helper_100.visible = value
        grid_helper_1000.visible = value
        render_needs_update = true
    });

    inspect_folder.addInput(params, 'inspect_mode', {
        label: "Mode", options: {
            'Final Render': 'final_render',
            'Wireframe': 'wireframe',
            'Matcap': 'matcap',
            'Normal': 'normal'
        }
    }).on('change', ({ value }) => {
        console.log(`new preview mode: ${value}`)
        global_scene.overrideMaterial = override_materials[value] || null
        console.log(global_scene.overrideMaterial)
        render_needs_update = true
    });

    let matcaps_options = {}
    _.forEach(matcaps, (name, id) => {
        matcaps_options[id] = id
    })
    inspect_folder.addInput(params, 'inspect_matcap_mode', { label: "Matcap", options: matcaps_options }).on('change', ({ value }) => {
        override_materials.matcap.matcap = texture_loader.load(`./assets/matcap/${matcaps[value]}.png`);
        render_needs_update = true
        setTimeout(() => {
            render_needs_update = true
        }, 500)
    });

    /** about tab */
    help_pane = new Tweakpane.Pane()
    help_pane.element.parentElement.classList.add('pane')
    help_pane.element.parentElement.classList.add('about')

    let help_folder = help_pane.addFolder({ title: "Help", expanded: false })

    new_version_pane_item = help_folder.addMonitor(params, 'application_has_updates', { label: 'new version', hidden: true })

    let info_folder = help_folder.addFolder({ title: "Info", expanded: false })
    info_folder.addMonitor(data, 'info_text', {
        label: 'Info', multiline: true,
        lineCount: 32,
    })

    let credits_folder = help_folder.addFolder({ title: "About", expanded: false })
    credits_folder.addMonitor(data, 'about_text', {
        label: 'About', multiline: true,
        lineCount: 32,
    })

    /* file pane */
    file_pane = new Tweakpane.Pane()
    file_pane.element.parentElement.classList.add('pane')
    file_pane.element.parentElement.classList.add('inspect')

    let file_folder = file_pane.addFolder({ title: "File", expanded: false })
    file_folder.addMonitor(params, 'scene_src', { label: "Current" })
    file_folder.addButton({ title: '', title: "Open" }).on('click', () => {
        file_input.click()
    })
}

function _collapse_gui_item(item, skip_item) {
    if (skip_item != true && 'expanded' in item) {
        item.expanded = false
    }
    if ('children' in item) {
        item.children.forEach((child) => {
            _collapse_gui_item(child)
        })
    }
}

function collapse_gui() {
    _collapse_gui_item(main_pane, true)
    _collapse_gui_item(help_pane, true)
    _collapse_gui_item(file_pane, true)
}

function setup_controls() {
    document.body.addEventListener('dragenter', handle_drag_and_drop, false)
    document.body.addEventListener('dragleave', handle_drag_and_drop, false)
    document.body.addEventListener('dragover', handle_drag_and_drop, false)
    document.body.addEventListener('drop', handle_drag_and_drop, false)
    renderer.domElement.addEventListener('mousedown', () => {
        _collapse_gui_item(help_pane, true)
    })

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
        render_needs_update = true
    }); // use if there is no animation loop
    controls.minDistance = 0;
    controls.maxDistance = Infinity;
    controls.target.set(0, 0, 0);
    controls.object.position.set(0, 256, 512)
    controls.update();
    window.addEventListener('resize', handle_window_resized);
    handle_window_resized()
}

function frame_object() {
    let max_value = Math.max(
        Math.abs(params.scene_aabb.min.x),
        Math.abs(params.scene_aabb.min.y),
        Math.abs(params.scene_aabb.min.z),
        Math.abs(params.scene_aabb.max.x),
        Math.abs(params.scene_aabb.max.y),
        Math.abs(params.scene_aabb.max.z)
    )

    controls.target.set(
        (params.scene_aabb.min.x + params.scene_aabb.max.x) / 2,
        (params.scene_aabb.min.y + params.scene_aabb.max.y) / 2,
        (params.scene_aabb.min.z + params.scene_aabb.max.z) / 2
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
        params.scene_src = os_tools.path.resolve(scene_src)
    }

    let model_format = os_tools.path.extname(params.scene_src).replace(".", '')
    try {
        loaders[model_format](params.scene_src)
    } catch (error) {
        console.error(error)
        notify_error(error.message)
        set_loader(false)
    }
}

function handle_window_resized() {
    const width = Math.floor(window.innerWidth * params.resolution_scale);
    const height = Math.floor(window.innerHeight * params.resolution_scale);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    if (composer) {
        composer.setSize(width, height);
    }
    render_needs_update = true
}

function render() {
    render_loop_id = requestAnimationFrame(render)

    if (render_needs_update === false) return
    if (+new Date() - prev_frame_date < 1000 / target_fps) return
    prev_frame_date = +new Date()
    /** --- */
    torch_light.position.copy(camera.position)

    if (params.postfx_enabled) {
        composer.render();
    } else {
        renderer.render(global_scene, camera);
    }

    render_needs_update = false
}

function update_title() {
    document.querySelector('head title').innerHTML = `preview_3d ${PACKAGE_INFO.version} | ${params.scene_src}`
}

function check_updates() {
    try {
        console.log('checking for updates...')
        let xhr = new XMLHttpRequest()
        xhr.open('get', 'https://raw.githubusercontent.com/sanyabeast/preview_3d/main/package.json', false)
        xhr.send()
        let remote_package = JSON.parse(xhr.responseText)
        if (window.PACKAGE_INFO.version !== remote_package.version) {
            console.log(`preview_3d update available: ${remote_package.version}`)
            params.application_has_updates = remote_package.version
            new_version_pane_item.hidden = false
        } else {
            console.log(`preview_3d - latest version`)
            new_version_pane_item.hidden = true
        }
    } catch (err) {
        console.error(err)
    }
}

function notify_error(message) {
    switch (true) {
        case message === "loaders[model_format] is not a function": {
            notyf.error('Unsupported file format');
            break;
        }
        default: {
            notyf.error('message');
            break;
        }
    }
}

function set_env_texture(texture) {
    params.env_texture = texture
    texture.mapping = THREE.EquirectangularReflectionMapping;
    global_scene.background = texture;
    global_scene.environment = texture;
    render_needs_update = true;
}

function set_loader(visible, progress) {
    let loader = document.getElementById("loader")
    if (visible) {
        loader.classList.add('active')
    } else {
        loader.classList.remove('active')
    }
}

window.load_file = function (file_path) {
    load_scene(file_path)
}