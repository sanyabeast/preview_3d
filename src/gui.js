

/** Created by @sanyabeast | 28 Jan 2023 | Kyiv, Ukraine */

import { Notyf } from 'notyf';

import { release_page_url, update_check_url, texts } from './data.js'
import { set_inspection_mode, set_matcap, inspect_modes, torch_light, gizmo } from './inspect.js'
import { world, camera, renderer, composer, notify_render, set_environment } from './render.js';
import { state } from './state.js';
import { load_sample } from './app.js'

let notyf = new Notyf({
    position: {
        x: 'left',
        y: 'bottom'
    }
});

let main_pane, file_pane, help_pane
let update_available_banner

function init_gui(params) {
    if (state.check_updates === true && Math.random() < 1) {
        setTimeout(check_updates, 1000)
    }

    main_pane = new Tweakpane.Pane()
    main_pane.registerPlugin(TweakpaneEssentialsPlugin);
    main_pane.element.parentElement.classList.add('pane')
    main_pane.element.parentElement.classList.add('main')

    let viewport_settings_folder = main_pane.addFolder({
        title: "👁️‍🗨️ Viewport",
        expanded: false
    })

    /* main tab */
    viewport_settings_folder.addInput(state, 'postfx_enabled', { label: '✨ Postfx' }).on('change', ({ value }) => {
        notify_render()
    });
    viewport_settings_folder.addInput(state, 'env_enabled', { label: '🏜 Environment' }).on('change', ({ value }) => {
        if (value) {
            world.background = state.env_texture;
            world.environment = state.env_texture;
        } else {
            world.background = state.env_default_background;
            world.environment = state.env_default_texture;
        }
        notify_render()
    });

    let environment_map_select_folder = viewport_settings_folder.addFolder({
        title: "🗺 Environment texture",
        expanded: false
    })

    console.log(_.chunk(Object.keys(ASSETS.hdr), 3))
    environment_map_select_folder.addBlade({
        view: 'buttongrid',
        size: [1, Object.keys(ASSETS.hdr).length],
        cells: (x, y) => ({
            title: _.map(Object.keys(ASSETS.hdr), item => [item])[y][x],
        }),
        label: 'Samples',
    }).on('click', (ev) => {
        set_environment(ev.cell.title)
        console.log(ev);
    });
    viewport_settings_folder.addInput(state, 'camera_fov', { label: "👁 Camera FOV", min: 1, max: 120, step: 1 }).on('change', ({ value }) => {
        camera.fov = value
        camera.updateProjectionMatrix()
        notify_render()
    });
    viewport_settings_folder.addInput(state, 'resolution_scale', { label: "🧇 Resolution", min: 0.5, max: 1, step: 0.05 }).on('change', ({ value }) => {
        handle_window_resized()
        notify_render()
    });


    viewport_settings_folder.addInput(state, 'torch_light', { label: "💡 Torchlight" }).on('change', ({ value }) => {
        torch_light.visible = value
        notify_render()
    });

    let inspect_folder = main_pane.addFolder({ title: "🔍 Inspect", expanded: false })

    inspect_folder.addInput(state, 'show_gizmo', { label: "📐 Gizmo" }).on('change', ({ value }) => {
        gizmo.axes_helper.visible = value
        gizmo.grid_helper_10.visible = value
        gizmo.grid_helper_100.visible = value
        gizmo.grid_helper_1000.visible = value
        notify_render()
    });

    inspect_folder.addInput(state, 'inspect_mode', {
        label: "🎲 Mode", options: _generate_list_keys(inspect_modes)
    }).on('change', ({ value }) => {
        set_inspection_mode(value)
    });

    inspect_folder.addInput(state, 'inspect_matcap_mode', { label: "🔮 Matcap", options: _generate_list_keys(ASSETS.matcap) }).on('change', ({ value }) => {
        set_matcap(value)
    });

    /** about tab */
    help_pane = new Tweakpane.Pane()
    help_pane.element.parentElement.classList.add('pane')
    help_pane.element.parentElement.classList.add('about')



    let help_folder = help_pane.addFolder({ title: "☂️ Help", expanded: false })
    update_available_banner = help_folder.addButton({ title: 'Update', hidden: true }).on('click', () => {
        window.open_browser(release_page_url)
    })

    let info_folder = help_folder.addFolder({ title: "📃 Info", expanded: false })
    info_folder.addMonitor(texts, 'info_text', {
        label: '📃', multiline: true,
        lineCount: 32,
    })

    let credits_folder = help_folder.addFolder({ title: "🕴 About", expanded: false })
    credits_folder.addMonitor(texts, 'about_text', {
        label: '🕴', multiline: true,
        lineCount: 32,
    })

    info_folder.on('click', () => {
        credits_folder.expanded = false
    })
    credits_folder.on('click', () => {
        info_folder.expanded = false
    })

    /* file pane */
    file_pane = new Tweakpane.Pane()
    file_pane.registerPlugin(TweakpaneEssentialsPlugin);
    file_pane.element.parentElement.classList.add('pane')
    file_pane.element.parentElement.classList.add('inspect')

    let file_folder = file_pane.addFolder({ title: "📝 File", expanded: false })
    file_folder.addMonitor(state, 'scene_src', { label: "📎 Current" })
    file_folder.addButton({ title: "📀 Open" }).on('click', () => {
        file_input.click()
    })

    let samples_folder = file_folder.addFolder({ title: "🏷 Load sample", expanded: false })

    samples_folder.addBlade({
        view: 'buttongrid',
        size: [1, Object.keys(ASSETS.samples).length],
        cells: (x, y) => ({
            title: _.map(Object.keys(ASSETS.samples), item => [item])[y][x],
        }),
        label: 'Samples',
    }).on('click', (ev) => {
        load_sample(ev.cell.title)
        console.log(ev);
    });

    window.addEventListener('resize', handle_window_resized);
    handle_window_resized()
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


function check_updates() {
    try {
        let xhr = new XMLHttpRequest()
        xhr.open('get', update_check_url, false)
        xhr.send()
        let remote_package = JSON.parse(xhr.responseText)

        if (window.PACKAGE_INFO.version !== remote_package.version) {
            state.application_has_updates = remote_package.version
            update_available_banner.title = `Update: ${remote_package.version}`
            update_available_banner.hidden = false
        } else {
            update_available_banner.hidden = true
        }
    } catch (err) {
        console.error(err)
    }
}
function update_title() {
    document.querySelector('head title').innerHTML = `preview_3d ${PACKAGE_INFO.version} | ${state.scene_src}`
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

function set_loader(visible, progress) {
    let loader = document.getElementById("loader")
    if (visible) {
        loader.classList.add('active')
    } else {
        loader.classList.remove('active')
    }
}

function handle_window_resized() {
    const width = Math.floor(window.innerWidth * state.resolution_scale);
    const height = Math.floor(window.innerHeight * state.resolution_scale);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    if (composer) {
        composer.setSize(width, height);
    }
    notify_render()
}


function _generate_list_keys(data, mode = 0) {
    let result = {}
    for (let k in data) {
        result[k] = k
    }
    return result
}


export {
    init_gui,
    collapse_gui,
    check_updates,
    update_title,
    notify_error,
    set_loader
}