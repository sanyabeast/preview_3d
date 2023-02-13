


/** Created by @sanyabeast | 28 Jan 2023 | Kyiv, Ukraine */

import {
    ShaderChunk,
    WebGLRenderer,
    PerspectiveCamera,
    Scene,
    sRGBEncoding,
    DirectionalLight,
    PMREMGenerator,
    Color,
    AmbientLight,
    Vector2,
    EquirectangularReflectionMapping,
    NormalBlending,
    VSMShadowMap,
    Group,
    Box3,
    AnimationMixer,
    SphereGeometry,
    BoxGeometry,
    MeshBasicMaterial,
    MeshLambertMaterial,
    Mesh,
    Vector3,
    Sphere,
    LOD,
    Euler,
    Quaternion,
    ShaderLib,
    PointLightHelper,
    SpotLightHelper,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { CopyShader } from 'three/addons/shaders/CopyShader.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { Lensflare, LensflareElement } from 'three/addons/objects/Lensflare.js';

import { state } from './state.js'
import { loaders, texture_loader } from './loaders.js';
import { lerp, clamp, round_to, logd, extend_gui, collect_scene_assets, get_object_metric } from './util.js';
import { refresh_gui, update_title, panes } from './gui.js';
import { init_contact_shadows, render_contact_shadows, contact_shadow_state } from './contact_shadows.js';
import { frame_object, watch_controls } from './controls.js';

/** overriding alpha test code with custom alpha dithering implementation */
ShaderChunk.alphatest_fragment = ASSETS.texts.dither_alphatest_glsl

const WIREFRAME_MAT = new MeshBasicMaterial({ wireframe: true });
const EMPTY_OBJECT = new Group()
const SPHERE_R1M = new Mesh(new SphereGeometry(1, 32, 16), WIREFRAME_MAT)
const BOX_1M = new Mesh(new BoxGeometry(1, 1, 1), WIREFRAME_MAT)

const SUN_HEIGHT_SCALE = 0.666

const USE_LOGDEPTHBUF = false
const DISABLE_SCENE_ALIGN = false
const SCENIC_LIGHTS_INTENSITY_SCALE = 0.001
const RENDER_LIGHT_NORMALIZED_INTENSITY_SCALE = 2

let user_sun_azimuth_offset = Math.PI / 1.9
let user_environment_azimuth_offset = 0.1;
// const USE_LOGDEPTHBUF = !IS_MACOS

let camera, world, world_transformed, renderer, composer, main_stage, second_stage
let render_needs_update = true
let render_loop_id
let render_timeout = +new Date()
let loop_tasks = {}
let last_render_date = +new Date()
let last_tick_date = +new Date()
let sun, amb
let is_document_visible = document.visibilityState === 'visible'
let bloom_pass, ssao_pass, render_pass, fxaa_pass
let contact_shadows_needs_update = true
let animation_mixer = null;

/** lens flare textures */
const texture_flare_0 = texture_loader.load('./assets/texture/lensflare0.png');
const texture_flare_3 = texture_loader.load('./assets/texture/lensflare3.png');


let sun_state = {
    distance: 10,
    height: 1,
    azimuth: 0.5,
    environment_multiplier: 1
}
let render_state = {
    tick_rates: [],
    avg_tick_rate_period: 8,
    average_fps: 60,
    current_computed_resolution_scale: 1,
    get render_camera() {
        return render_state.override_camera || camera
    },
    override_camera: null,
}
let scene_state = {
    /**initializing with values from empty object as defaults */
    scene: null,
    assets: collect_scene_assets(EMPTY_OBJECT),
    metric: get_object_metric(EMPTY_OBJECT),
    unit_scale: 1
}

/** procedures */
function preinit_render() {
    document.addEventListener('visibilitychange', (event) => {
        console.log(`document visibility: ${document.visibilityState}`)
        is_document_visible = document.visibilityState === 'visible'
    })
    /** main renderer */
    const container = document.createElement('div');
    document.body.appendChild(container);
    document.body.classList.add(window.IS_DEVELOPMENT ? 'development' : 'production')

    renderer = new WebGLRenderer({
        antialias: true,
        logarithmicDepthBuffer: USE_LOGDEPTHBUF,
        stencil: true,
        depth: true,
        preserveDrawingBuffer: true
    });

    renderer.setPixelRatio(window.devicePixelRatio * 1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = sRGBEncoding;
    renderer.gammaFactor = 1
    renderer.shadowMap.enabled = state.render_shadows_enabled;
    renderer.shadowMap.autoUpdate = false
    renderer.physicallyCorrectLights = true
    // renderer.shadowMap.type = VSMShadowMap

    console.log(renderer.capabilities.isWebGL2)

    container.appendChild(renderer.domElement);
    /* main scene setup */
    camera = new PerspectiveCamera(state.render_camera_fov, window.innerWidth / window.innerHeight, 0.001, 100);
    camera.position.set(0, 100, 0);

    window.renderer = renderer
    window.camera = camera

    // enable_pcss_shadows()

    init_world()
    init_contact_shadows(world, second_stage, renderer, camera)
    init_postfx()

    window.addEventListener('resize', handle_window_resized);
    handle_window_resized()
}
function init_world() {
    const environment = new RoomEnvironment();
    const pmremGenerator = new PMREMGenerator(renderer);


    world = new Scene();
    world_transformed = new Group()
    main_stage = new Group();
    second_stage = new Group();

    world.background = new Color(0xbbbbbb);
    world.environment = pmremGenerator.fromScene(environment).texture;
    world.matrixWorldAutoUpdate = false

    world.backgroundBlurriness = 1
    world.backgroundIntensity = 1

    Object.defineProperty(world, 'render_flares', {
        get() {
            return state.render_flares_enabled && state.render_flares_global_intensity > 0.01
        }
    })

    environment.dispose();

    sun = new DirectionalLight(0xffdeae)
    amb = new AmbientLight(0x889aff)
    amb.intensity = 0.2;
    sun.position.set(1000, 1000, 1000)
    sun.intensity = 1
    sun.castShadow = true

    /**sun flare */
    let sun_lensflare = _add_lens_flare(sun, 4, 4)

    // shadows
    sun.shadow.mapSize.width = 2048
    sun.shadow.mapSize.height = 2048
    sun.shadow.camera.left = -2
    sun.shadow.camera.right = 2
    sun.shadow.camera.left = -2
    sun.shadow.camera.top = -2
    sun.shadow.camera.bottom = 2
    sun.shadow.camera.near = 0.00001
    sun.shadow.radius = 8
    sun.shadow.blurSamples = 8
    sun.shadow.bias = 0.0000005

    set_sun_azimuth(0.5)
    set_sun_height(1)

    world.add(world_transformed)
    world_transformed.add(camera)
    world_transformed.add(main_stage)
    world_transformed.add(second_stage)

    second_stage.add(sun)
    second_stage.add(amb)

    window.world = world
    window.world_transformed = world_transformed
    window.main_stage = main_stage
    window.second_stage = second_stage

    state.env_default_background = world.background
    state.env_default_texture = world.environment
}

function reset_things() {

    user_sun_azimuth_offset = Math.PI / 1.9
    user_environment_azimuth_offset = 0.1;

    state.render_flares_global_intensity = 1
    state.render_emission_scale = 1
    state.render_global_timescale = 1
    state.render_disable_all_scenic_lights = false
    state.render_scenic_light_intensity_scale = 1
    state.render_environment_rotation = 0

    set_sun_azimuth(state.render_sun_azimuth)
    set_environment_rotation(state.render_environment_rotation)
    set_daytime(0.5)

    refresh_gui()
}

function set_scene(scene, animations = []) {
    console.log(scene, animations)
    main_stage.visible = false
    /** resetting some things to defaults */

    reset_things()

    if (scene_state.scene) {
        console.log('removing existing scene...')
        main_stage.remove(scene_state.scene)
        _destroy_scene(scene_state.scene)
    }

    scene_state.scene = scene
    let scene_assets = scene_state.assets = collect_scene_assets(scene, {
        animation: animations
    })

    let scene_metric = scene_state.metric = get_object_metric(scene)

    logd('set_scene', 'scene assets: ', scene_assets)
    logd('set_scene', 'scene metric: ', scene_metric)

    if (DISABLE_SCENE_ALIGN !== true) {
        _align_scene()
    }

    main_stage.add(scene);

    init_scene()
    update_shadows()
    update_title()
    frame_object()

    main_stage.visible = true
    notify_render(1000);

}
function _align_scene() {
    logd('_align_scene', 'begin aligning scene')

    let scene = scene_state.scene
    let scene_metric = scene_state.metric = get_object_metric(scene)

    scene_state.unit_scale = 1 / scene_metric.radius_b
    scene_state.scene.scale.setScalar(scene_state.unit_scale)
    /**updaing metrics after transformation! */
    scene_metric = scene_state.metric = get_object_metric(scene)

    scene_state.scene.position.y = Math.abs(scene_metric.nudge) > 0.25 ? -scene_metric.box.min.y : 0;
    if (scene_metric.box.min.y > 0) {
        scene_state.scene.position.y = -scene_metric.box.min.y
    }
    scene_state.scene.position.x = -scene_metric.center.x;
    scene_state.scene.position.z = -scene_metric.center.z;

    /**updaing metrics after transformation! */
    scene_metric = scene_state.metric = get_object_metric(scene)

    logd('set_scene', `maximum original scene scale in one dimension: ${scene_metric.radius}`)
    logd('set_scene', `computed virtual scene's scale: ${1 / scene_metric.radius}`)
    logd(`set_scene`, `computed xz-offset: [${scene_metric.center.x}:${scene_metric.center.z}]`)
    logd('set_scene', `computed vertical nudge ratio: ${scene_metric.nudge}`)
}
function init_scene() {
    /** animations */
    _init_scene_animations()

    /** materials */
    /** transaprent materials */
    scene_state.assets.material_transparent.forEach((material) => {
        material.transparent = false
        material.depthWrite = true
        material.alphaTest = 0.5;
        material.blending = NormalBlending
    })

    scene_state.assets.material_transmissive.forEach((material) => {
        material.transparent = false
        material.depthWrite = true
        material.alphaTest = 0.5;
        material.blending = NormalBlending
        if (_.isObject(material.transmissionMap)) {
            material.opacity = 1;
            material.alphaMap = material.transmissionMap
            material.transmissionMap = null
        } else {
            material.opacity = 1 - (material.transmission * 0.5)
            material.roughness = 1 - material.transmission
            material.metalness = 1
            material.env_map_intensity_scale = 0.25
        }

        material.transmission = 0
    })

    scene_state.assets.material_emissive.forEach((material) => {
        material._emissiveIntensity = material.emissiveIntensity;
        Object.defineProperty(material, 'emissiveIntensity', {
            get() {
                return material._emissiveIntensity * state.render_emission_scale
            },
            set(value) {
                material._emissiveIntensity = value
            }
        })
    })

    /** meshes */
    scene_state.assets.mesh_all.forEach((mesh) => {
        if (mesh.has_transparency !== true) {
            mesh.castShadow = true
            mesh.receiveShadow = true
        }
    })


    /** cameras */
    scene_state.assets.camera.forEach((camera, camera_index) => {
        if (!panes.main.scene_cameras_list.children[camera_index]) {
            panes.main.scene_cameras_list.addButton({
                label: '',
                title: camera.name,
                min: 0,
                max: 1,
                step: 0.1
            }).on('click', (ev) => pilot_camera(camera_index))
        } else {
            let button = panes.main.scene_cameras_list.children[camera_index]
            button.label = camera.name
        }
    })

    panes.main.scene_cameras_list.hidden = scene_state.assets.camera.length === 0;
    panes.main.scene_cameras_list.children.forEach((child, index) => {
        child.hidden = index >= scene_state.assets.camera.length
    })

    /** lights */
    let normal_light_intensity = scene_state.normal_light_intensity = Math.max(..._.map(scene_state.assets.light, l => l.intensity))
    logd('init_scene', `max found light intensity: ${normal_light_intensity}`)

    scene_state.assets.light.forEach((light, light_index) => {
        light._intensity = (light.intensity / normal_light_intensity) * RENDER_LIGHT_NORMALIZED_INTENSITY_SCALE
        light._intensity_scale = 1
        Object.defineProperty(light, 'intensity', {
            get: () => {
                if (state.render_disable_all_scenic_lights) {
                    return 0
                } else {
                    return light._intensity * light._intensity_scale * state.render_scenic_light_intensity_scale;
                }
            },
            set: (value) => {
                light._intensity = value
            }
        })

        if (!panes.main.scenic_lights_list.children[light_index]) {
            let slider_data = { intensity: light._intensity_scale }
            panes.main.scenic_lights_list.addInput(slider_data, 'intensity', {
                label: light.name,
                min: 0,
                max: 2,
                step: 0.01
            }).on('change', ({ value }) => {
                scene_state.assets.light[light_index]._intensity_scale = value
                notify_render()
            })
        } else {
            let button = panes.main.scenic_lights_list.children[light_index]
            button.label = light.name
        }
        /** flares */
        const lensflare = _add_lens_flare(light, 0, 1)
        scene_state.assets.object_disposable.push(lensflare)


    })

    panes.main.scenic_lights_folder.hidden = scene_state.assets.light.length === 0;
    panes.main.scenic_lights_list.children.forEach((child, index) => {
        child.hidden = index >= scene_state.assets.light.length
    })

    handle_window_resized()
}
let secondary_flares_map = [
    [60, 0.6],
    [70, 0.7],
    [120, 0.9],
    [70, 0.1]
]
function _add_lens_flare(light, secondary_flares = 4, intensity_scale = 1) {
    const lensflare = new Lensflare(light);
    lensflare.get_global_flares_intensity = () => state.render_flares_global_intensity * state.resolution_scale
    lensflare.addElement(new LensflareElement(texture_flare_0, 700 * intensity_scale, 0, light.color));
    for (let i = 0; i < secondary_flares; i++) {
        let flare_data = secondary_flares_map[i % secondary_flares_map.length]
        lensflare.addElement(new LensflareElement(texture_flare_3, flare_data[0] * intensity_scale, flare_data[1]));
    }
    light.add(lensflare)
    return lensflare
}
function _init_scene_animations() {
    panes.main.animations_folder.hidden = scene_state.assets.animation.length === 0;
    panes.main.animation_tracks_list.children.forEach((child, index) => {
        child.hidden = index >= scene_state.assets.animation.length
    })

    if (scene_state.assets.animation.length > 0) {
        animation_mixer = new AnimationMixer(scene_state.scene);
        scene_state.assets.animation.forEach((animation_clip, index) => {
            scene_state.assets.action[index] = animation_mixer.clipAction(animation_clip)
            if (!panes.main.animation_tracks_list.children[index]) {
                let slider_data = { weight: 1 }
                let slider = panes.main.animation_tracks_list.addInput(slider_data, 'weight', {
                    label: animation_clip.name,
                    min: 0,
                    max: 1,
                    step: 0.1,
                }).on('change', ({ value }) => {
                    scene_state.assets.action[index].enabled = value > 0
                    scene_state.assets.action[index].setEffectiveTimeScale(1);
                    scene_state.assets.action[index].setEffectiveWeight(value);
                })
                slider.slider_data = slider_data;
            } else {
                let slider = panes.main.animation_tracks_list.children[index]
                slider.label = animation_clip.name
                slider.slider_data.weight = 1
                slider.refresh()
            }
        })
        loop_tasks.update_animation_mixer = (d, td) => {
            if (state.render_disable_animations !== true) {
                animation_mixer.update(td)
                update_shadows()
                update_matrix()
                notify_render()
            }
        }
    } else {
        loop_tasks.update_animation_mixer = () => { }
    }
    scene_state.assets.action.forEach((action) => {
        action.enabled = true;
        action.play()
    })
}
function _destroy_scene(scene) {
    kill_animations()

    let things_diposed = scene_state.assets.material.length + scene_state.assets.geometry.length + scene_state.assets.texture.length

    scene_state.assets.material.forEach(item => item.dispose())
    scene_state.assets.geometry.forEach(item => item.dispose())
    scene_state.assets.texture.forEach(item => item.dispose())
    scene_state.assets.object_disposable.forEach(item => item.dispose())

    logd('_destroy_scene', `things disposed: ${things_diposed}`)
}
function init_postfx() {
    composer = new EffectComposer(renderer);

    render_pass = new RenderPass(world, camera);
    bloom_pass = new UnrealBloomPass(new Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloom_pass.threshold = state.postfx_bloom_treshold;
    bloom_pass.strength = state.postfx_bloom_strength;
    bloom_pass.radius = state.postfx_bloom_radius;

    fxaa_pass = new ShaderPass(FXAAShader);
    fxaa_pass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * window.devicePixelRatio);
    fxaa_pass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * window.devicePixelRatio);

    ssao_pass = new SSAOPass(world, camera, window.innerWidth / 2, window.innerHeight / 2);
    ssao_pass.kernelSize = 8;
    ssao_pass.kernelRadius = 0.007;
    ssao_pass.minDistance = 0.00001;
    ssao_pass.maxDistance = 0.01;
    // ssao_pass.output = SSAOPass.OUTPUT.SSAO

    let copy_pass = new ShaderPass(CopyShader); /* LinearEncoding */
    copy_pass.enabled = true;

    let rgb_shift = new ShaderPass(RGBShiftShader);
    rgb_shift.uniforms['amount'].value = 0.0015;


    composer.addPass(render_pass);
    composer.addPass(ssao_pass)
    composer.addPass(fxaa_pass);
    composer.addPass(rgb_shift);
    composer.addPass(bloom_pass);

    //bloom_pass.renderToScreen = true
}
function init_render() {
    watch_controls(() => {
        if (render_state.override_camera) {
            pilot_camera(null)
        }
    })
    /** */
    /** experiments */
    extend_gui(panes.main.experiments_folder, {
        type: 'folder',
        title: 'postprocessing',
        children: {
            'posfx_enabled': {
                type: 'input',
                bind: [state, 'postfx_enabled'],
                label: "enabled",
                on_change: notify_render
            },
            'postfx_ssao_min_distance': {
                type: 'input',
                min: 0.0000001,
                max: 0.00001,
                step: 0.0000001,
                bind: [ssao_pass, 'minDistance'],
                label: "ssao min distance",
                on_change: notify_render
            },
            'postfx_ssao_max_distance': {
                type: 'input',
                min: 0.00001,
                max: 0.001,
                step: 0.00001,
                bind: [ssao_pass, 'maxDistance'],
                label: "ssao max distance",
                on_change: notify_render
            },
            'postfx_ssao_kernel_radius': {
                type: 'input',
                min: 0.001,
                max: 0.1,
                step: 0.0001,
                bind: [ssao_pass, 'kernelRadius'],
                label: "ssao kernel radius",
                on_change: notify_render
            },
        }
    })
}
function kill_animations() {
    scene_state.assets.action.forEach(action => {
        action.enabled = false
        action.stop()
    })
}
function set_environment_texture(texture) {
    state.env_texture = texture
    texture.mapping = EquirectangularReflectionMapping;
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
function update_shadows() {
    contact_shadows_needs_update = true
    renderer.shadowMap.needsUpdate = true
    notify_render()
}
function render() {
    render_loop_id = requestAnimationFrame(render)
    if (!is_document_visible || !IS_WINDOW_FOCUSED) {
        return
    }

    if (state.render_dynamic_resolution) {
        update_dynamic_resolution()
    }

    last_tick_date = +new Date()
    const time_delta = (last_tick_date - last_render_date) / 1000
    const delta = time_delta / (1 / 60)
    const frame_delta = time_delta / (1 / state.render_fps_limit)

    if (frame_delta > 1) {
        _.forEach(loop_tasks, task => task(delta, time_delta))

        if (render_needs_update === true || last_tick_date < render_timeout) {
            if (state.postfx_enabled && window.RENDER_ONLY_MAIN !== true) {
                composer.render();
            } else {
                // wboit_pass.render(renderer)
                if (window.RENDER_ONLY_MAIN !== true) {
                    second_stage.visible = false
                    if (contact_shadows_needs_update) {
                        contact_shadows_needs_update = false
                        render_contact_shadows()
                    }
                }

                second_stage.visible = window.RENDER_ONLY_MAIN !== true
                renderer.render(world, render_state.render_camera);
            }
        }
        last_render_date = last_tick_date
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
    state.render_sun_azimuth = value
    sun.position.x = -Math.sin((value + user_sun_azimuth_offset) * Math.PI * 2) * sun_state.distance
    sun.position.z = Math.cos((value + user_sun_azimuth_offset) * Math.PI * 2) * sun_state.distance
    update_shadows()
    notify_render()
}
function set_sun_height(value) {
    state.render_sun_height = value
    sun.position.y = lerp(0, sun_state.distance * SUN_HEIGHT_SCALE, value)
    sun.intensity = value * 2
    update_shadows()
    notify_render()
}
function set_ambient_intentsity(value) {
    state.render_ambient_intensity = value
    amb.intensity = lerp(0, 1, value)
    notify_render()
}
function set_environment_intensity(value) {
    state.render_environment_intensity = value
    world.backgroundIntensity = state.render_environment_intensity
    notify_render()
}
function set_environment_influence(value) {
    state.render_environment_influence = value
    /** USED MODIFIED JS API */
    world.environment_power = state.render_environment_influence
    notify_render()
}
function set_daytime(value) {
    state.render_daytime = value
    let curved_value = Math.sin(value * Math.PI)
    curved_value = Math.pow(curved_value, 2)
    set_environment_intensity(lerp(0, 1, Math.pow(curved_value, 2)))
    set_environment_influence(lerp(5, 1, curved_value))
    set_sun_height(lerp(0.02, 1, curved_value))
    set_sun_azimuth(lerp(0, 1, value))
    set_ambient_intentsity(lerp(0.125, 0.9, curved_value))
    set_environment_rotation(value)
    notify_render()
    refresh_gui();
}
function update_matrix() {
    world.updateMatrixWorld()
    notify_render()
}
function handle_window_resized() {
    const width = Math.floor(window.innerWidth * state.resolution_scale);
    const height = Math.floor(window.innerHeight * state.resolution_scale);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    if (_.isArray(scene_state.assets.camera)) {
        scene_state.assets.camera.forEach((scene_camera) => {
            if (scene_camera.isOrthographicCamera) {
                let ortho_height = Math.abs(scene_camera.bottom - scene_camera.top)
                let aspect = width / height
                scene_camera.left = -(ortho_height * aspect) / 2;
                scene_camera.right = (ortho_height * aspect) / 2;
                scene_camera.updateProjectionMatrix();
            } else {
                scene_camera.aspect = width / height;
                scene_camera.updateProjectionMatrix();
            }
        })
    }

    /** postfx */
    fxaa_pass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * window.devicePixelRatio);
    fxaa_pass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * window.devicePixelRatio);

    renderer.setSize(width, height);
    if (composer) {
        composer.setSize(width, height);
    }

    notify_render()
}
const _dynamic_resolution_check = _.throttle(() => {
    let avg_tick_rate = 0
    for (let i = 0; i < render_state.tick_rates.length; i++) {
        avg_tick_rate += render_state.tick_rates[i]
    }

    avg_tick_rate /= render_state.tick_rates.length;
    avg_tick_rate /= Math.pow(state.resolution_scale, 2)

    if (avg_tick_rate > 1) {
        let new_resolution = round_to(lerp(1, 0.5, clamp(Math.pow((avg_tick_rate - 1), 2), 0, 1)), 0.05)
        if (state.resolution_scale !== new_resolution) {
            set_resolution_scale(new_resolution)
        }
    } else {
        if (state.resolution_scale !== 1) {
            set_resolution_scale(1)
        }
    }
}, 1000 / 4)
function update_dynamic_resolution() {
    if (render_needs_update === true || last_tick_date < render_timeout) {
        let tick_time = (+new Date() - last_tick_date)
        let fps_limit = isFinite(state.render_fps_limit) ? state.render_fps_limit : 60
        let tick_rate = tick_time / (1000 / fps_limit)
        render_state.tick_rates.unshift(tick_rate)
        render_state.tick_rates = render_state.tick_rates.splice(0, render_state.avg_tick_rate_period)
        _dynamic_resolution_check()
    }
}
function set_resolution_scale(value) {
    state.resolution_scale = value
    refresh_gui()
    handle_window_resized()
}
function set_shadows_enabled(enabled) {
    contact_shadow_state.shadow.group.visible = enabled
    state.render_shadows_enabled = enabled;
    renderer.shadowMap.enabled = enabled;
    renderer.render(world, camera);
    notify_render()
}
function pilot_camera(index) {
    logd('pilot_camera', `new piloted camera index: ${index}`)
    render_state.override_camera = _.isNumber(index) ? scene_state.assets.camera[index] : null
    notify_render()
}
function set_animations_scale(value) {
    state.render_global_timescale = value
    if (animation_mixer) {
        animation_mixer.timeScale = value
    }
}
function set_environment_rotation(value) {
    value = value % 1;
    let delta = value - state.render_environment_rotation
    state.render_environment_rotation = value
    world_transformed.rotation.y = (2 * Math.PI) * ((value + user_environment_azimuth_offset) % 1)
    //camera.position.applyAxisAngle(new Vector3(0, 1, 0), delta * Math.PI * 2 * 39)
    update_matrix()
}

function modify_environment_rotation(delta) {
    user_environment_azimuth_offset = (user_environment_azimuth_offset + delta) % 1;
    set_environment_rotation(state.render_environment_rotation)
}

function modify_sun_azimuth(delta) {
    user_sun_azimuth_offset = (user_sun_azimuth_offset + delta) % 1;
    set_sun_azimuth(state.render_sun_azimuth)
}

preinit_render()

window.scene_state = scene_state
window.render_state = render_state

export {
    camera,
    world,
    world_transformed,
    main_stage,
    second_stage,
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
    set_environment_influence,
    set_daytime,
    update_matrix,
    update_shadows,
    set_resolution_scale,
    set_shadows_enabled,
    set_scene,
    pilot_camera,
    set_animations_scale,
    collect_scene_assets,
    scene_state,
    set_environment_rotation,
    modify_environment_rotation,
    modify_sun_azimuth
}