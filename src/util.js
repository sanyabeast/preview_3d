import {
    Box3,
    Sphere,
    Vector3
} from 'three'

let _original_window_open = window.location.open
window.location.open = function () {
    console.log(_original_window_open)
}
function random_choice(data) {
    if (_.isArray(data)) {
        return data[Math.floor(Math.random() * data.length)]
    } else if (_.isObject(data)) {
        return data[random_choice(Object.keys(data))]
    } else {
        return data
    }
}
function write_url(parameter, name) {
    let host = window.location.pathname
    let url_params = new URLSearchParams(window.location.search)

    if (url_params.get(parameter) !== name) {
        url_params.set(parameter, name)
        window.history.pushState(parameter, parameter, `${host}?${url_params.toString()}`);
    }
}
function read_url(parameter) {
    return new URLSearchParams(window.location.search).get(parameter)
}
function build_gui(layout, props, item_data) {
    let item = null
    item_data = item_data || {}

    switch (layout.type) {
        case 'pane': {
            item = new Tweakpane.Pane()
            console.log(Tweakpane, item)
            item.registerPlugin(TweakpaneEssentialsPlugin);
            item.registerPlugin(TweakpaneInfodumpPlugin)
            item.element.parentElement.classList.add('pane')
            break;
        }
        case 'folder': {
            item = item_data.item.addFolder({
                title: layout.title,
                expanded: layout.expanded || false,
                hidden: layout.hidden
            })
            break;
        }
        case 'input': {
            item = item_data.item.addInput(layout.bind[0], layout.bind[1], {
                label: layout.label,
                min: layout.min,
                max: layout.max,
                step: layout.step,
                options: _.isString(layout.options) ? props[layout.options] : layout.options,
                hidden: layout.hidden
            })
            break;
        }
        case 'button': {
            item = item_data.item.addButton({
                label: layout.label,
                title: layout.title,
                hidden: layout.hidden,
            })
            break;
        }
        case 'blade': {
            item = item_data.item.addBlade({
                view: layout.view,
                label: layout.label,
                ...layout
            })

            break;
        }
        default: {
            console.log(`[panes] unknown item type: ${layout.type}`, layout)
        }
    }
    if (layout.class_list && item.element) {
        layout.class_list.forEach(class_name => item.element.parentElement.classList.add(layout.class_list))
    }
    if (_.isFunction(layout.on_click)) item.on('click', layout.on_click)
    if (_.isString(layout.on_click)) item.on('click', props[layout.on_click])
    if (_.isFunction(layout.on_change)) item.on('change', layout.on_change)
    if (_.isString(layout.on_change)) item.on('change', props[layout.on_change])

    if (_.isObject(layout.children)) {
        _.forEach(layout.children, (child_layout, ref) => {
            item_data.item = item
            if (ref in item_data) {
                loge('utils/build_gui', `gui item reference duplicate: "${ref}"`, layout)
            }
            let child_item_data = build_gui(child_layout, props, item_data)
            item_data[ref] = child_item_data.item

        })
    }

    item_data.item = item

    return item_data
}
function extend_gui(parent, layout, props) {
    return build_gui(layout, props, {
        item: parent
    })
}
function loge(topic, ...args) {
    console.log(`%c[preview_3d] %c[!] %c[${topic}]: `, 'color: #4caf50', 'color: #f44336;', 'color: #cddc39', ...args)
}
function logd(topic, ...args) {
    console.log(`%c[preview_3d] %c[i] %c[${topic}]: `, 'color: #4caf50', 'color: #8bc34a;', 'color: #cddc39', ...args)
}
function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end
}
function clamp(start, min, max) {
    return Math.max(Math.min(start, max), min)
}
function round_to(num, div) {
    return div * Math.ceil(num / div)
}
function collect_scene_assets(scene, extension) {
    let scene_assets = {
        geometry: [],
        material: [],
        material_transparent: [],
        material_transmissive: [],
        material_opaque: [],
        material_non_opaque: [],
        texture: [],
        camera: [],
        animation: [],
        action: [],
        mesh: [],
        group: [],
        bone: [],
        light: []
    }
    scene.traverse((object) => {
        let category_name = object.type.toLowerCase();
        scene_assets[category_name] = scene_assets[category_name] || []
        scene_assets[category_name].push(object)
        if (object.isMesh) {
            let mats = _.isArray(object.material) ? object.material : [object.material]
            mats.forEach((mat) => {
                if (!_.find(scene_assets.material, _mat => _mat.uuid === mat.uuid)) {
                    mat._original_mesh = object
                    scene_assets.material.push(mat)
                }
            })
            if (_.isObject(object.geometry)) {
                object.geometry._original_mesh = object
                scene_assets.geometry.push(object.geometry)
            }
        }
    })

    scene_assets.material.forEach((mat) => {
        for (let k in mat) {
            if (_.isObject(mat[k]) && mat[k].isTexture === true) {
                if (!_.find(scene_assets.texture, t => t.uuid === mat[k].uuid)) {
                    scene_assets.texture.push(mat[k])
                }
            }
        }

        if (mat.transmission > 0) {
            scene_assets.material_transmissive.push(mat)
            scene_assets.material_non_opaque.push(mat)
            mat._original_mesh.has_transparency = true
        } else if (mat.transparent) {
            scene_assets.material_transparent.push(mat)
            scene_assets.material_non_opaque.push(mat)
            mat._original_mesh.has_transparency = true
        } else {
            scene_assets.material_opaque.push(mat)
        }
    })

    scene_assets.light = scene_assets.light.concat(scene_assets.pointlight || [])
    scene_assets.light = scene_assets.light.concat(scene_assets.spotlight || [])
    scene_assets.camera = scene_assets.camera.concat(scene_assets.perspectivecamera || [])
    scene_assets.camera = scene_assets.camera.concat(scene_assets.orthographiccamera || [])
    scene_assets.mesh_all = (scene_assets.mesh || []).concat(scene_assets.skinnedmesh || [])

    if (_.isObject(extension)) {
        scene_assets = {
            ...scene_assets,
            ...extension
        }
    }

    return scene_assets;
}
function get_object_metric(object) {
    let bounding_box = new Box3();
    let bounding_sphere = new Sphere()
    let object_center = new Vector3()
    let object_size = new Vector3()
    let nudge = 0

    bounding_box.setFromObject(object);
    bounding_box.getBoundingSphere(bounding_sphere)
    bounding_box.getCenter(object_center)
    bounding_box.getSize(object_size)

    nudge = bounding_box.min.y / object_size.y;

    return {
        center: object_center,
        size: object_size,
        box: bounding_box,
        sphere: bounding_sphere,
        radius: bounding_sphere.radius,
        nudge
    }
}

function blender_watts_to_lumens(watt) {
    return (683 * watt) / (4 * Math.PI);
}

export {
    random_choice,
    write_url,
    read_url,
    build_gui,
    extend_gui,
    loge,
    logd,
    lerp,
    round_to,
    clamp,
    collect_scene_assets,
    get_object_metric,
    blender_watts_to_lumens
}