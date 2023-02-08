

import * as THREE from 'three'
import { HorizontalBlurShader } from 'three/addons/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/addons/shaders/VerticalBlurShader.js';

const PLANE_WIDTH = 10;
const PLANE_HEIGHT = 10;
const CAMERA_HEIGHT = 2;

let scene, renderer, camera

const state = {
    shadow: {
        blur: 0.1,
        darkness: 1,
        opacity: 1,
    },
    plane: {
        color: '#000000',
        opacity: 0,
    },
    showWireframe: false,
};

let shadowGroup, renderTarget, renderTargetBlur, shadowCamera, cameraHelper, depthMaterial, horizontalBlurMaterial, verticalBlurMaterial;

let plane, blurPlane, fillPlane;

function init_contact_shadows(_scene, _renderer, _camera) {
    scene = _scene
    renderer = _renderer
    camera = _camera
    // the container, if you need to move the plane just move this
    state.shadow.group = shadowGroup = new THREE.Group();
    shadowGroup.name = 'contact_shadows'
    shadowGroup.position.y = 0;
    scene.add(shadowGroup);

    // the render target that will show the shadows in the plane texture
    renderTarget = new THREE.WebGLRenderTarget(512, 512);
    renderTarget.texture.generateMipmaps = false;

    // the render target that we will use to blur the first render target
    renderTargetBlur = new THREE.WebGLRenderTarget(512, 512);
    renderTargetBlur.texture.generateMipmaps = false;


    // make a plane and make it face up
    const planeGeometry = new THREE.PlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT).rotateX(Math.PI / 2);
    const planeMaterial = new THREE.MeshBasicMaterial({
        map: renderTarget.texture,
        opacity: state.shadow.opacity,
        transparent: true,
        depthWrite: false,
    });
    plane = contact_shadow_state.plane.mesh = new THREE.Mesh(planeGeometry, planeMaterial);
    // make sure it's rendered after the fillPlane
    plane.renderOrder = 1;
    shadowGroup.add(plane);

    // the y from the texture is flipped!
    plane.scale.y = - 1;

    // the plane onto which to blur the texture
    blurPlane = new THREE.Mesh(planeGeometry);
    blurPlane.visible = false;
    shadowGroup.add(blurPlane);

    // the plane with the color of the ground
    const fillPlaneMaterial = new THREE.MeshBasicMaterial({
        color: state.plane.color,
        opacity: state.plane.opacity,
        transparent: true,
        depthWrite: false,
    });
    fillPlane = new THREE.Mesh(planeGeometry, fillPlaneMaterial);
    fillPlane.rotateX(Math.PI);
    shadowGroup.add(fillPlane);

    // the camera to render the depth material from
    shadowCamera = new THREE.OrthographicCamera(- PLANE_WIDTH / 2, PLANE_WIDTH / 2, PLANE_HEIGHT / 2, - PLANE_HEIGHT / 2, 0, CAMERA_HEIGHT);
    shadowCamera.rotation.x = Math.PI / 2; // get the camera to look up
    shadowGroup.add(shadowCamera);

    cameraHelper = new THREE.CameraHelper(shadowCamera);

    // like MeshDepthMaterial, but goes from black to transparent
    depthMaterial = new THREE.MeshDepthMaterial();
    depthMaterial.userData.darkness = { value: state.shadow.darkness };
    depthMaterial.onBeforeCompile = function (shader) {

        shader.uniforms.darkness = depthMaterial.userData.darkness;
        shader.fragmentShader = /* glsl */`
            uniform float darkness;
            ${shader.fragmentShader.replace(
            'gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );',
            'gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * darkness );'
        )}
        `;

    };

    depthMaterial.depthTest = false;
    depthMaterial.depthWrite = false;

    horizontalBlurMaterial = new THREE.ShaderMaterial(HorizontalBlurShader);
    horizontalBlurMaterial.depthTest = false;

    verticalBlurMaterial = new THREE.ShaderMaterial(VerticalBlurShader);
    verticalBlurMaterial.depthTest = false;

}

function render_contact_shadows() {
    // remove the background
    const initialBackground = scene.background;
    scene.background = null;

    // force the depthMaterial to everything
    cameraHelper.visible = false;
    scene.overrideMaterial = depthMaterial;

    // set renderer clear alpha
    const initialClearAlpha = renderer.getClearAlpha();
    renderer.setClearAlpha(0);

    // render to the render target to get the depths
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, shadowCamera);

    // and reset the override material
    scene.overrideMaterial = null;
    cameraHelper.visible = true;

    blurShadow(state.shadow.blur);

    // a second pass to reduce the artifacts
    // (0.4 is the minimum blur amout so that the artifacts are gone)
    blurShadow(state.shadow.blur * 0.4);

    // reset and render the normal scene
    renderer.setRenderTarget(null);
    renderer.setClearAlpha(initialClearAlpha);
    scene.background = initialBackground;
}

// renderTarget --> blurPlane (horizontalBlur) --> renderTargetBlur --> blurPlane (verticalBlur) --> renderTarget
function blurShadow(amount) {

    blurPlane.visible = true;

    // blur horizontally and draw in the renderTargetBlur
    blurPlane.material = horizontalBlurMaterial;
    blurPlane.material.uniforms.tDiffuse.value = renderTarget.texture;
    horizontalBlurMaterial.uniforms.h.value = amount * 1 / 256;

    renderer.setRenderTarget(renderTargetBlur);
    renderer.render(blurPlane, shadowCamera);

    // blur vertically and draw in the main renderTarget
    blurPlane.material = verticalBlurMaterial;
    blurPlane.material.uniforms.tDiffuse.value = renderTargetBlur.texture;
    verticalBlurMaterial.uniforms.v.value = amount * 1 / 256;

    renderer.setRenderTarget(renderTarget);
    renderer.render(blurPlane, shadowCamera);

    blurPlane.visible = false;
}

const contact_shadow_state = state

export {
    init_contact_shadows,
    render_contact_shadows,
    contact_shadow_state
}