

/** Created by @sanyabeast | 28 Jan 2023 | Kyiv, Ukraine */

import { Notyf } from 'notyf';

import { release_page_url, update_check_url } from './data.js'
import { set_inspection_mode, set_matcap, inspect_modes, torch_light, gizmo } from './inspect.js'
import { world, camera, renderer, composer, notify_render, set_environment } from './render.js';
import { state } from './state.js';
import { load_sample } from './app.js'
import { build_gui } from './util.js';

let notyf = new Notyf({
    position: {
        x: 'left',
        y: 'bottom'
    }
});

let main_pane, file_pane, help_pane
let update_available_banner
let panes = {}

function init_gui(params) {
    if (state.check_updates === true && Math.random() < 1) {
        setTimeout(check_updates, 15000)
    }

    panes.main = create_file_pane()
    panes.file = create_main_pane()
    panes.help = create_help_pane()

    window.addEventListener('resize', handle_window_resized);
    handle_window_resized()
}

function create_main_pane() {

    main_pane = build_gui(
        {
            type: 'pane',
            class_list: ['main'],
            children: {
                'viewport_settings_folder': {
                    type: 'folder',
                    title: "👁️‍🗨️ Viewport",
                    expanded: false,
                    children: {
                        'postfx_enabled': {
                            type: 'input',
                            bind: [state, 'postfx_enabled'],
                            label: '✨ Postfx',
                            on_change: 'on_postfx_changed'
                        },
                        'env_enabled': {
                            type: 'input',
                            bind: [state, 'env_enabled'],
                            label: '🏜 Environment',
                            on_change: 'on_env_enabled_changed'
                        },
                        'environment_map_select_folder': {
                            type: 'folder',
                            title: "🗺 Environment texture",
                            expanded: false,
                            children: {
                                'env_map_select_blade': {
                                    type: 'blade',
                                    view: 'buttongrid',
                                    size: [1, Object.keys(ASSETS.hdr).length],
                                    cells: (x, y) => ({
                                        title: _.map(Object.keys(ASSETS.hdr), item => [item])[y][x],
                                    }),
                                    label: 'Samples',
                                    on_change: 'handle_env_map_select_change'
                                }
                            }
                        },
                        'camera_fov': {
                            type: 'input',
                            bind: [state, 'camera_fov'],
                            label: "👁 Camera FOV",
                            min: 1,
                            max: 120,
                            step: 1,
                            on_change: 'on_camera_fov_changed'
                        },
                        'resolution_scale': {
                            type: 'input',
                            bind: [state, 'resolution_scale'],
                            min: 0.5, max: 1, step: 0.05,
                            label: "🧇 Resolution",
                            on_change: 'on_resolution_scale_changed'
                        },
                        'torchlight': {
                            type: 'input',
                            bind: [state, 'torch_light'],
                            label: "💡 Torchlight",
                            on_change: 'on_torchlight_changed'
                        },
                    }
                },
                'inspect_folder': {
                    type: 'folder',
                    title: "🔍 Inspect",
                    expanded: false,
                    children: {
                        'show_gizmo': {
                            type: 'input',
                            bind: [state, 'show_gizmo'],
                            label: "📐 Gizmo",
                            on_change: 'on_show_gizmo_changed'
                        },
                        'inspect_mode': {
                            type: 'input',
                            bind: [state, 'inspect_mode'],
                            label: "🎲 Mode",
                            options: _generate_list_keys(inspect_modes),
                            on_change: 'on_inspect_mode_changed'
                        },
                        'inspect_matcap_mode': {
                            type: 'input',
                            bind: [state, 'inspect_matcap_mode'],
                            label: "🔮 Matcap",
                            options: _generate_list_keys(ASSETS.matcap),
                            on_change: 'on_inspect_matcap_mode_changed'
                        },
                    }
                }
            }
        },
        {
            on_postfx_changed: ({ value }) => notify_render(),
            on_env_enabled_changed: ({ value }) => {
                if (value) {
                    world.background = state.env_texture;
                    world.environment = state.env_texture;
                } else {
                    world.background = state.env_default_background;
                    world.environment = state.env_default_texture;
                }
                notify_render()
            },
            handle_env_map_select_change({ cell }) {
                set_environment(cell.title)
            },
            on_camera_fov_changed: ({ value }) => {
                camera.fov = value
                camera.updateProjectionMatrix()
                notify_render()
            },
            on_resolution_scale_changed: ({ value }) => {
                handle_window_resized()
                notify_render()
            },
            on_torchlight_changed: ({ value }) => {
                torch_light.visible = value
                notify_render()
            },
            on_show_gizmo_changed: ({ value }) => {
                gizmo.axes_helper.visible = value
                gizmo.grid_helper.visible = value
                notify_render()
            },
            on_inspect_mode_changed: ({ value }) => {
                console.log(value)
                set_inspection_mode(value)
            },
            on_inspect_matcap_mode_changed: ({ value }) => {
                set_matcap(value)
            },
        }
    )
    return main_pane
}

function create_file_pane() {
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
    return file_pane

}

function create_help_pane() {
    /** about tab */
    help_pane = new Tweakpane.Pane()
    help_pane.registerPlugin(TweakpaneInfodumpPlugin)
    help_pane.element.parentElement.classList.add('pane')
    help_pane.element.parentElement.classList.add('about')

    let help_folder = help_pane.addFolder({ title: "☂️ Help", expanded: false })
    update_available_banner = help_folder.addButton({ title: 'Update', hidden: true }).on('click', () => {
        window.open_browser(release_page_url)
    })

    let info_folder = help_folder.addFolder({ title: "📃 Info", expanded: false })

    info_folder.addBlade({
        view: "infodump",
        content: ASSETS.texts.info,
        border: false,
        markdown: true,
    }).element.classList.add('ff-monospace');

    let credits_folder = help_folder.addFolder({ title: "🕴 About", expanded: false })

    let credits_blade = credits_folder.addBlade({
        view: "infodump",
        content: ASSETS.texts.about,
        border: false,
        markdown: true,
    }).element.classList.add('ff-monospace');

    info_folder.on('click', () => {
        credits_folder.expanded = false
    })
    credits_folder.on('click', () => {
        info_folder.expanded = false
    })
    return help_folder

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
    set_loader,
    panes
}