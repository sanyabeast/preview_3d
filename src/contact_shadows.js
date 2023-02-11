

import {
    PlaneGeometry,
    MeshDepthMaterial,
    WebGLRenderTarget,
    Group,
    MeshBasicMaterial,
    Mesh,
    OrthographicCamera,
    CameraHelper,
    ShaderMaterial
} from 'three'
import { HorizontalBlurShader } from 'three/addons/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/addons/shaders/VerticalBlurShader.js';

const PLANE_WIDTH = 2;
const PLANE_HEIGHT = 2;
const CAMERA_HEIGHT = 25;

let scene, renderer, camera
let stage

const contact_shadow_state = {
    shadow: {
        blur: 1.75,
        darkness: 0.0,
        opacity: 0.3,
    },
    plane: {
        color: '#00011f',
        opacity: 0,
    },
    showWireframe: false,
};

let shadow_group, renderTarget, renderTargetBlur, shadow_camera, depthMaterial, horizontalBlurMaterial, verticalBlurMaterial;

let plane, blur_plane, fill_plane;

function init_contact_shadows(_scene, _stage, _renderer, _camera) {
    stage = _stage
    scene = _scene
    renderer = _renderer
    camera = _camera
    // the container, if you need to move the plane just move this
    contact_shadow_state.shadow.group = shadow_group = new Group();
    shadow_group.name = 'contact_shadows'
    shadow_group.position.y = -0.01;


    // the render target that will show the shadows in the plane texture
    renderTarget = new WebGLRenderTarget(512, 512);
    renderTarget.texture.generateMipmaps = false;

    // the render target that we will use to blur the first render target
    renderTargetBlur = new WebGLRenderTarget(512, 512);
    renderTargetBlur.texture.generateMipmaps = false;


    // make a plane and make it face up
    const plane_geometry = new PlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT).rotateX(Math.PI / 2);
    const plane_material = new MeshBasicMaterial({
        map: renderTarget.texture,
        color: 0x00020c,
        opacity: contact_shadow_state.shadow.opacity,
        transparent: true,
        depthWrite: false,
    });
    plane = contact_shadow_state.plane.mesh = new Mesh(plane_geometry, plane_material);
    // make sure it's rendered after the fill_plane
    plane.renderOrder = 1;
    shadow_group.add(plane);

    // the y from the texture is flipped!
    plane.scale.y = - 1;

    // the plane onto which to blur the texture
    blur_plane = new Mesh(plane_geometry);
    blur_plane.visible = false;
    shadow_group.add(blur_plane);

    // the plane with the color of the ground
    const fill_plane_material = new MeshBasicMaterial({
        color: contact_shadow_state.plane.color,
        opacity: contact_shadow_state.plane.opacity,
        transparent: true,
        depthWrite: false,
    });
    fill_plane = new Mesh(plane_geometry, fill_plane_material);
    fill_plane.rotateX(Math.PI);
    shadow_group.add(fill_plane);
    fill_plane.receiveShadow = true

    // the camera to render the depth material from
    shadow_camera = new OrthographicCamera(- PLANE_WIDTH / 2, PLANE_WIDTH / 2, PLANE_HEIGHT / 2, - PLANE_HEIGHT / 2, 0, CAMERA_HEIGHT);
    shadow_camera.render_flares = false
    shadow_camera.rotation.x = Math.PI / 2; // get the camera to look up
    shadow_group.add(shadow_camera);
    depthMaterial = new MeshDepthMaterial();
    depthMaterial.userData.darkness = { value: contact_shadow_state.shadow.darkness };

    console.log(depthMaterial)

    depthMaterial.depthTest = false;
    depthMaterial.depthWrite = false;

    horizontalBlurMaterial = new ShaderMaterial(HorizontalBlurShader);
    horizontalBlurMaterial.depthTest = false;

    verticalBlurMaterial = new ShaderMaterial(VerticalBlurShader);
    verticalBlurMaterial.depthTest = false;

    stage.add(shadow_group);

}

function render_contact_shadows() {

    // remove the background
    const initial_cloned_override_materials_disabled = scene.inspect_feature_cloned_override_material
    const init_background = scene.background;
    const init_override_material = scene.overrideMaterial;

    scene.inspect_feature_cloned_override_material = false
    scene.background = null;

    // force the depthMaterial to everything
    scene.overrideMaterial = depthMaterial;

    // set renderer clear alpha
    const init_clear_alpha = renderer.getClearAlpha();
    renderer.setClearAlpha(0);

    // render to the render target to get the depths
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, shadow_camera);

    // and reset the override material
    scene.overrideMaterial = null;

    _render_contact_shadow_blur(contact_shadow_state.shadow.blur);

    // a second pass to reduce the artifacts
    // (0.4 is the minimum blur amout so that the artifacts are gone)
    _render_contact_shadow_blur(contact_shadow_state.shadow.blur * 0.4);

    // reset and render the normal scene
    renderer.setRenderTarget(null);
    renderer.setClearAlpha(init_clear_alpha);
    scene.background = init_background;
    scene.overrideMaterial = init_override_material;
    scene.inspect_feature_cloned_override_material = initial_cloned_override_materials_disabled
}

// renderTarget --> blur_plane (horizontalBlur) --> renderTargetBlur --> blur_plane (verticalBlur) --> renderTarget
function _render_contact_shadow_blur(amount) {

    blur_plane.visible = true;

    // blur horizontally and draw in the renderTargetBlur
    blur_plane.material = horizontalBlurMaterial;
    blur_plane.material.uniforms.tDiffuse.value = renderTarget.texture;
    horizontalBlurMaterial.uniforms.h.value = amount * 1 / 256;

    renderer.setRenderTarget(renderTargetBlur);
    renderer.render(blur_plane, shadow_camera);

    // blur vertically and draw in the main renderTarget
    blur_plane.material = verticalBlurMaterial;
    blur_plane.material.uniforms.tDiffuse.value = renderTargetBlur.texture;
    verticalBlurMaterial.uniforms.v.value = amount * 1 / 256;

    renderer.setRenderTarget(renderTarget);
    renderer.render(blur_plane, shadow_camera);

    blur_plane.visible = false;
}

// render_contact_shadows = _.throttle(render_contact_shadows, 1000 / 15)

export {
    init_contact_shadows,
    render_contact_shadows,
    contact_shadow_state
}