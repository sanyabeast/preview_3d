


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
    Quaternion
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

import { state } from './state.js'
import { loaders } from './loaders.js';
import { lerp, clamp, round_to, logd, extend_gui } from './util.js';
import { refresh_gui, update_title, panes } from './gui.js';
import { init_contact_shadows, render_contact_shadows, contact_shadow_state } from './contact_shadows.js';
import { frame_object, watch_controls } from './controls.js';

ShaderChunk.alphatest_fragment = ASSETS.texts.dither_alphatest_glsl

/**initializing state.scene_metrics object */
if (state.scene_metrics === null) {
    state.scene_metrics = get_object_metrics(new Group())
    console.log(state.scene_metrics)
}

const SUN_HEIGHT_MULTIPLIER = 0.666
const SUN_AZIMUTH_OFFSET = Math.PI / 1.9
const USE_LOGDEPTHBUF = false
const DISABLE_SCENE_ALIGN = false
// const USE_LOGDEPTHBUF = !IS_MACOS

let camera, world, renderer, composer, main_stage, second_stage
let render_needs_update = true
let render_loop_id
let render_timeout = +new Date()
let loop_tasks = {}
let last_render_date = +new Date()
let last_tick_date = +new Date()
let sun, amb
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

let is_document_visible = document.visibilityState === 'visible'
let bloom_pass, ssao_pass, render_pass, fxaa_pass

let contact_shadows_needs_update = true

let scene_state = {
    animations: [],
    cameras: [],
    actions: [],
    current_position: 0,
    lights: []
}

let animation_mixer

/** lod test */
let empty_lod = new Group()
empty_lod.visible = false
let sphere_lod = new Mesh(
    new SphereGeometry(1),
    new MeshLambertMaterial({ color: 0x000000 })
)
let box_lod = new Mesh(
    new BoxGeometry(1, 1, 1),
    new MeshLambertMaterial({ color: 0x000000 })
)


document.addEventListener('visibilitychange', (event) => {
    console.log(`document visibility: ${document.visibilityState}`)
    is_document_visible = document.visibilityState === 'visible'
})

function preinit_render() {
    /** main renderer */
    const container = document.createElement('div');
    document.body.appendChild(container);
    document.body.classList.add(window.IS_DEVELOPMENT ? 'development' : 'production')

    renderer = new WebGLRenderer({
        antialias: true,
        logarithmicDepthBuffer: USE_LOGDEPTHBUF,
        stencil: true,
        depth: true,
        // preserveDrawingBuffer: true
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
    main_stage = new Group();
    second_stage = new Group();
    world.add(main_stage)
    world.add(second_stage)
    world.background = new Color(0xbbbbbb);
    world.environment = pmremGenerator.fromScene(environment).texture;
    world.matrixWorldAutoUpdate = false

    world.backgroundBlurriness = 1
    world.backgroundIntensity = 1

    environment.dispose();

    sun = new DirectionalLight(0xffdeae)
    amb = new AmbientLight(0x889aff)
    amb.intensity = 0.2;
    sun.position.set(1000, 1000, 1000)
    sun.intensity = 1
    sun.castShadow = true

    // shadows
    sun.shadow.mapSize.width = 2048
    sun.shadow.mapSize.height = 2048
    sun.shadow.camera.left = -0.5
    sun.shadow.camera.right = 0.5
    sun.shadow.camera.left = -0.5
    sun.shadow.camera.top = -0.5
    sun.shadow.camera.bottom = 0.5
    sun.shadow.camera.near = 0.00001
    sun.shadow.radius = 8
    sun.shadow.blurSamples = 8
    sun.shadow.bias = 0.0000005

    set_sun_azimuth(0.5)
    set_sun_height(1)

    second_stage.add(sun)
    second_stage.add(amb)

    window.world = world
    window.main_stage = main_stage
    window.second_stage = second_stage

    state.env_default_background = world.background
    state.env_default_texture = world.environment
}

function get_object_metrics(object) {
    let bounding_box = new Box3();
    let bounding_sphere = new Sphere()
    let object_center = new Vector3()
    let object_size = new Vector3()
    let nudge = new Vector3()

    bounding_box.setFromObject(object);
    bounding_box.getBoundingSphere(bounding_sphere)
    bounding_box.getCenter(object_center)
    bounding_box.getSize(object_size)

    nudge.set(
        (object_center.x / object_size.x) || 0,
        (object_center.y / object_size.y) || 0,
        (object_center.z / object_size.z) || 0,
    )

    return {
        center: object_center,
        size: object_size,
        box: bounding_box,
        sphere: bounding_sphere,
        radius: bounding_sphere.radius,
        nudge
    }
}

function set_scene(scene, animations = []) {
    console.log(scene, animations)
    main_stage.visible = false
    /** resetting some things to defaults */
    set_daytime(0.5)

    scene_state.scene = scene
    scene_state.animations = animations
    scene_state.current_position = 0
    scene_state.actions = []
    scene_state.cameras = []
    scene_state.lights = []

    kill_animations()

    if (state.active_scene) {
        console.log('removing scene...')
        main_stage.remove(state.active_scene)
        _destroy_scene(state.active_scene)
    }

    state.active_scene = scene
    let scene_metrics = state.scene_metrics = get_object_metrics(scene)

    console.log(scene_metrics)

    logd('set_scene', `maximum original scene scale in one dimension: ${scene_metrics.radius}`)
    logd('set_scene', `computed virtual scene's scale: ${1 / scene_metrics.radius}`)

    if (DISABLE_SCENE_ALIGN !== true) {
        scene_state.unit_scale = 1 / scene_metrics.radius
        state.active_scene.scale.setScalar(scene_state.unit_scale)
        /**updaing metrics after transformation! */
        scene_metrics = state.scene_metrics = get_object_metrics(scene)
        logd(`set_scene`, `computed xz-offset: [${scene_metrics.center.x}:${scene_metrics.center.z}]`)
        logd('set_scene', `computed vertical nudge ratio: ${scene_metrics.nudge.y}`)
        state.active_scene.position.y = Math.abs(scene_metrics.nudge.y) > 0.25 ? -scene_metrics.box.min.y : 0;
        if (scene_metrics.box.min.y > 0) {
            state.active_scene.position.y = -scene_metrics.box.min.y
        }
        state.active_scene.position.x = -scene_metrics.center.x;
        state.active_scene.position.z = -scene_metrics.center.z;

        /**updaing metrics after transformation! */
        scene_metrics = state.scene_metrics = get_object_metrics(scene)
    }

    console.log('spawning scene...')
    console.log(scene, scene_metrics.box)

    main_stage.add(scene);

    init_scene()
    update_shadows()
    update_title()
    frame_object()

    main_stage.visible = true
    notify_render(1000);
    
}


function init_scene() {
    /** animations */
    panes.main.animations_folder.hidden = scene_state.animations.length === 0;
    panes.main.animation_tracks_list.children.forEach((child, index) => {
        child.hidden = index >= scene_state.animations.length
    })

    if (scene_state.animations.length > 0) {
        animation_mixer = new AnimationMixer(state.active_scene);
        scene_state.animations.forEach((animation_clip, index) => {
            scene_state.actions[index] = animation_mixer.clipAction(animation_clip)
            if (!panes.main.animation_tracks_list.children[index]) {
                let slider_data = { weight: 1 }
                let slider = panes.main.animation_tracks_list.addInput(slider_data, 'weight', {
                    label: animation_clip.name,
                    min: 0,
                    max: 1,
                    step: 0.1
                }).on('change', ({ value }) => {
                    scene_state.actions[index].enabled = value > 0
                    scene_state.actions[index].setEffectiveTimeScale(1);
                    scene_state.actions[index].setEffectiveWeight(value);
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
    scene_state.actions.forEach((action) => {
        action.enabled = true;
        action.play()
    })


    /**traverse */
    let camera_index = 0
    main_stage.traverse((object) => {
        logd('init_scene', `found ${object.type} "${object.name}"`)
        if (object.isMesh) {
            if (!object.material) return;
            let materials = Array.isArray(object.material) ? object.material : [object.material];
            let object_has_transparency = false
            for (let i = 0; i < materials.length; i++) {
                let material = materials[i]
                // console.log(material)
                if (!material._original_material_settings) {
                    material._original_material_settings = {
                        transparent: material.transparent,
                        alphaTest: material.alphaTest,
                        depthWrite: material.depthWrite
                    }
                }

                if (material.transparent) {
                    object_has_transparency = true
                    material.transparent = false
                    material.depthWrite = true
                    material.alphaTest = 0.5;
                    material.blending = NormalBlending
                    //logd('init_scene', `found transparent material "${material.name}". Material is set up for dithered transparency rendering`,)
                } else {
                    //logd('init_scene', `found opaque material "${material.name}"`)
                }
            }
            if (!object_has_transparency) {
                object.castShadow = true
                object.receiveShadow = true
            } else {
                object.has_transparency = true
            }

        }
        if (object.isCamera) {
            scene_state.cameras.push(object)
            if (!panes.main.scene_cameras_list.children[camera_index]) {
                let bound_camera_index = camera_index
                let button = panes.main.scene_cameras_list.addButton({
                    label: '',
                    title: object.name,
                    min: 0,
                    max: 1,
                    step: 0.1
                }).on('click', (ev) => pilot_camera(bound_camera_index))
            } else {
                let button = panes.main.scene_cameras_list.children[camera_index]
                button.label = object.name
            }

            camera_index++
        }
        if (object.isLight) {
            scene_state.lights.push(object)
            console.log(object.intensity)
            object.intensity *= scene_state.unit_scale / 1000
        }
        // if (object.isMesh || object.isGroup || object.isLight) {
        //     object.metrics = get_object_metrics(object)
        // }
    });

    handle_window_resized()

    /**reset camera helper gui */
    panes.main.scene_cameras_list.hidden = scene_state.cameras.length === 0;
    panes.main.scene_cameras_list.children.forEach((child, index) => {
        child.hidden = index >= scene_state.cameras.length
    })
}

function _destroy_scene(scene) {
    let things_diposed = 0
    scene.traverse((object) => {
        if (object.isMesh) {
            let materials = _.isArray(object.material) ? object.material : [object.material]
            materials.forEach((mat) => {
                if (mat) {
                    mat.dispose()
                    things_diposed++
                }
            })
            if (object.geometry) {
                object.geometry.dispose()
                things_diposed++
            }
        }
    })

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
    ssao_pass.kernelRadius = 0.1;
    ssao_pass.minDistance = 0.0000001;
    ssao_pass.maxDistance = 0.001;
    ssao_pass.output = SSAOPass.OUTPUT.Default

    let copy_pass = new ShaderPass(CopyShader); /* LinearEncoding */
    copy_pass.enabled = true;

    let rgb_shift = new ShaderPass(RGBShiftShader);
    rgb_shift.uniforms['amount'].value = 0.0015;


    composer.addPass(render_pass);
    // composer.addPass(ssao_pass)
    composer.addPass(fxaa_pass);
    // composer.addPass(rgb_shift);
    composer.addPass(bloom_pass);

    //bloom_pass.renderToScreen = true
}

function init_render() {
    init_animation_player()
    init_camera_helper()

    watch_controls(() => {
        if (render_state.override_camera) {
            pilot_camera(null)
        }
    })
    /** */
}

function init_animation_player() {
    // panes.main.animations_folder = extend_gui(panes.main.item, )
}


function kill_animations() {
    scene_state.actions.forEach(action => {
        action.enabled = false
        action.stop()
    })
}

function init_camera_helper() {

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
    value += SUN_AZIMUTH_OFFSET
    state.render_sun_azimuth = value
    sun.position.x = -Math.sin(value * Math.PI * 2) * sun_state.distance
    sun.position.z = Math.cos(value * Math.PI * 2) * sun_state.distance
    update_shadows()
    notify_render()
}

function set_sun_height(value) {
    state.render_sun_height = value
    sun.position.y = lerp(0, sun_state.distance * SUN_HEIGHT_MULTIPLIER, value)
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
    state.env_brightness = value
    world.backgroundIntensity = state.env_brightness
    notify_render()
}

function set_environment_power(value) {
    state.env_influence = value
    /** USED MODIFIED JS API */
    world.environment_power = state.env_influence
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
    set_ambient_intentsity(lerp(0.125, 0.9, curved_value))
    notify_render()
    refresh_gui();
}

function update_matrix() {
    world.updateMatrixWorld()
}

function handle_window_resized() {
    const width = Math.floor(window.innerWidth * state.resolution_scale);
    const height = Math.floor(window.innerHeight * state.resolution_scale);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    scene_state.cameras.forEach((scene_camera) => {
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
    render_state.override_camera = _.isNumber(index) ? scene_state.cameras[index] : null
    notify_render()
}

function set_animations_scale(value) {
    state.render_global_timescale = value
    if (animation_mixer) {
        animation_mixer.timeScale = value
    }
}

preinit_render()

window.scene_state = scene_state
window.render_state = render_state

export {
    camera,
    world,
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
    set_environment_power,
    set_daytime,
    update_matrix,
    update_shadows,
    set_resolution_scale,
    set_shadows_enabled,
    set_scene,
    pilot_camera,
    set_animations_scale
}