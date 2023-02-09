

/** Created by @sanyabeast | 28 Jan 2023 | Kyiv, Ukraine */

import { Notyf } from 'notyf';

import { release_page_url, update_check_url } from './data.js'
import { set_inspection_mode, set_matcap, inspect_modes, torch_light, gizmo } from './inspect.js'
import {
    world,
    camera,
    renderer,
    composer,
    notify_render,
    set_environment,
    set_fps_limit,
    set_sun_azimuth,
    set_sun_height,
    set_environment_intensity,
    set_daytime,
    set_ambient_intentsity,
    set_environment_power,
    set_resolution_scale,
    update_shadows,
    set_shadows_enabled
} from './render.js';
import { state } from './state.js';
import { load_sample } from './app.js'
import { build_gui, loge } from './util.js';

const notifications = new Notyf({
    position: {
        x: 'left',
        y: 'bottom'
    },
    types: [
        {
            type: 'error',
            background: '#e93030',
            icon: false,
            dismissable: true,
            duration: 5000
        },
        {
            type: 'warn',
            background: '#e97d30',
            icon: false,
            dismissable: true,
            duration: 5000
        },
        {
            type: 'info',
            background: '#8bc34a',
            icon: false,
            dismissable: true,
            duration: 5000
        }
    ]
});

let main_pane, file_pane, help_pane
let panes = {}

function init_gui(params) {
    if (state.check_updates === true) {
        setTimeout(check_updates, 15000)
    }
    panes.file = create_file_pane()
    panes.main = create_main_pane()
    panes.help = create_help_pane()
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
                    children: {
                        'postfx_enabled': {
                            type: 'input',
                            bind: [state, 'postfx_enabled'],
                            label: '✨ Postfx',
                            hidden: true,
                            on_change: 'on_postfx_changed'
                        },
                        'shadows_enabled': {
                            type: 'input',
                            bind: [state, 'render_shadows_enabled'],
                            label: '🌚 Shadows',
                            on_change: ({ value }) => {
                                set_shadows_enabled(value)
                            }
                        },
                        'dynamic_resoltuion': {
                            type: 'input',
                            bind: [state, 'render_dynamic_resolution'],
                            label: 'Dynamic Resolution',
                            hidden: true,
                            on_change: ({ value }) => {
                                //set_resolution_scale(state.resolution_scale)
                            }
                        },
                        'resolution_scale': {
                            type: 'input',
                            bind: [state, 'resolution_scale'],
                            min: 0.5, max: 1, step: 0.05,
                            label: "🧇 Resolution",
                            on_change: ({ value }) => set_resolution_scale(value)
                        },
                        'render_camera_fov': {
                            type: 'input',
                            bind: [state, 'render_camera_fov'],
                            label: "📽 Camera FOV",
                            min: 1,
                            max: 120,
                            step: 1,
                            on_change: 'on_render_camera_fov_changed'
                        },
                        'environment': {
                            type: 'folder',
                            title: '🏝 Environment settings',
                            expanded: true,
                            children: {
                                'env_enabled': {
                                    type: 'input',
                                    bind: [state, 'env_enabled'],
                                    label: '🎚 Enabled',
                                    on_change: 'on_env_enabled_changed'
                                },
                                'env_blur': {
                                    type: 'input',
                                    bind: [world, 'backgroundBlurriness'],
                                    label: "💧 Blurriness",
                                    min: 0,
                                    max: 1,
                                    step: 0.01,
                                    on_change: notify_render
                                },
                                'daytime': {
                                    type: 'input',
                                    bind: [state, 'render_daytime'],
                                    label: "🔆 Daytime",
                                    min: 0,
                                    max: 1,
                                    step: 0.01,
                                    on_change: ({ value }) => set_daytime(value)
                                },
                                'env_map_select_folder': {
                                    type: 'folder',
                                    title: '🖼 Texture',
                                    children: {
                                        'env_map_select_blade': {
                                            type: 'blade',
                                            view: 'buttongrid',
                                            size: [1, Object.keys(ASSETS.hdr).length],
                                            cells: (x, y) => ({
                                                title: _.map(Object.keys(ASSETS.hdr), item => [item])[y][x],
                                            }),
                                            label: '',
                                            on_click: ({ cell }) => {
                                                console.log(cell)
                                                set_environment(cell.title)
                                            }
                                        },
                                    }
                                },
                                'env_settings_folder': {
                                    type: 'folder',
                                    title: '🔧 More settings...',
                                    children: {
                                        'env_intensity': {
                                            type: 'input',
                                            bind: [state, 'env_intensity'],
                                            label: "env. intensity",
                                            min: 0,
                                            max: 1,
                                            step: 0.01,
                                            on_change: ({ value }) => set_environment_intensity(value)
                                        },
                                        'env_power': {
                                            type: 'input',
                                            bind: [state, 'env_power'],
                                            label: "env. power",
                                            min: 0,
                                            max: 5,
                                            step: 0.1,
                                            on_change: ({ value }) => set_environment_power(value)
                                        },
                                        'ambient_intensity': {
                                            type: 'input',
                                            bind: [state, 'render_ambient_intensity'],
                                            label: "Ambient light",
                                            min: 0,
                                            max: 1,
                                            step: 0.01,
                                            on_change: ({ value }) => set_ambient_intentsity(value)
                                        },
                                        'sun_height': {
                                            type: 'input',
                                            bind: [state, 'render_sun_height'],
                                            label: "Sun height",
                                            min: 0,
                                            max: 1,
                                            step: 0.01,
                                            on_change: ({ value }) => set_sun_height(value)
                                        },
                                        'sun_azimuth': {
                                            type: 'input',
                                            bind: [state, 'render_sun_azimuth'],
                                            label: "Sun azimuth",
                                            min: 0,
                                            max: 1,
                                            step: 0.01,
                                            on_change: ({ value }) => set_sun_azimuth(value)
                                        },

                                    }
                                },

                            }
                        },
                        'rendering_settings_extra_folder': {
                            type: 'folder',
                            title: '🎛 Extra settings',
                            children: {
                                'torchlight': {
                                    type: 'input',
                                    bind: [state, 'torch_light'],
                                    label: "💡 Torchlight",
                                    on_change: 'on_torchlight_changed'
                                },
                                'fps_limit': {
                                    type: 'blade',
                                    view: 'buttongrid',
                                    size: [2, 2],
                                    cells: (x, y) => ({
                                        title: [
                                            [15, 30],
                                            [60, Infinity]
                                        ][y][x],
                                    }),
                                    label: 'FPS Limit',
                                    on_click: ({ cell }) => set_fps_limit(cell.title)
                                },
                            }
                        }
                    }
                },
                'inspect_folder': {
                    type: 'folder',
                    title: "🔍 Inspect",
                    children: {
                        'inspect_show_gizmo': {
                            type: 'input',
                            bind: [state, 'inspect_show_gizmo'],
                            label: "📏 Gizmo",
                            on_change: 'on_inspect_show_gizmo_changed'
                        },
                        'inspect_mode': {
                            type: 'input',
                            bind: [state, 'inspect_mode'],
                            label: "👓 Mode",
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
                },
                // 'extra_settings_folder': {
                //     title: '🎛 Extra settings',
                //     type: 'folder'
                // }
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
            on_render_camera_fov_changed: ({ value }) => {
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
            on_inspect_show_gizmo_changed: ({ value }) => {
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
    file_pane = build_gui({
        type: 'pane',
        class_list: ['inspect'],
        children: {
            file_folder: {
                type: 'folder',
                title: "📝 File",
                children: {
                    open_button: {
                        type: 'button',
                        bind: [state, 'scene_src'],
                        label: "📎 Current",
                        title: "Open",
                        on_click: () => file_input.click()
                    },
                    samples_folder: {
                        type: 'folder',
                        title: "🗃 Load sample",
                        children: {
                            samples_selector: {
                                type: 'blade',
                                view: 'buttongrid',
                                size: [1, Object.keys(ASSETS.samples).length],
                                cells: (x, y) => ({
                                    title: _.map(Object.keys(ASSETS.samples), item => [item])[y][x],
                                }),
                                label: 'Samples',
                                on_click: ({ cell }) => load_sample(cell.title)
                            }
                        }
                    },
                    app_control: {
                        type: 'blade',
                        view: 'buttongrid',
                        size: [2, 1],
                        cells: (x, y) => ({
                            title: [
                                ['🐑 Clone', '🪦 Quit']
                            ][y][x],
                        }),
                        label: '🪬 App',
                        on_click: ({ cell }) => {
                            switch (cell.title) {
                                case '🐑 Clone': {
                                    ipc_invoke('new_window')
                                    break;
                                }
                                case '🪦 Quit': {
                                    ipc_invoke('quit')
                                    break;
                                }
                            }
                            console.log(cell)
                        }
                    }
                }
            }
        }
    })
    return file_pane

}
function create_help_pane() {
    help_pane = build_gui({
        type: 'pane',
        class_list: ['about'],
        children: {
            'help_folder': {
                type: 'folder',
                title: "☂️ Help",
                children: {
                    'update_available_banner': {
                        type: 'button',
                        title: 'Update',
                        hidden: true,
                        on_click: () => {
                            window.open_browser(release_page_url)
                        }
                    },
                    'info_folder': {
                        type: 'folder',
                        title: "📃 Info",
                        on_click: () => help_pane.credits_folder.expanded = false,
                        children: {
                            info_text: {
                                type: 'blade',
                                view: 'infodump',
                                class_list: ['ff-monospace'],
                                content: ASSETS.texts.info_md,
                                border: false,
                                markdown: true,
                            }
                        }
                    },
                    'credits_folder': {
                        type: 'folder',
                        title: "🕴 About",
                        on_click: () => help_pane.info_folder.expanded = false,
                        children: {
                            about_text: {
                                type: 'blade',
                                view: 'infodump',
                                class_list: ['ff-monospace'],
                                content: ASSETS.texts.about_md,
                                border: false,
                                markdown: true,
                            }
                        }
                    },
                }
            }
        }
    })
    return help_pane
}
function _collapse_gui_item(item_data, skip_item) {
    _.forEach(item_data, (item, alias) => {
        if (_.isBoolean(item.expanded)) {
            if (skip_item === true && alias === 'item') {
                //pass
            } else {
                item.expanded = false
            }
        }
    })
}
function collapse_gui() {
    console.log(main_pane, help_pane, file_pane)
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
            help_pane.update_available_banner.title = `Update: ${remote_package.version}`
            help_pane.update_available_banner.hidden = false
        } else {
            help_pane.update_available_banner.hidden = true
        }
    } catch (err) {
        loge('gui/check_updates', err.message)
    }
}
function update_title() {
    let prefix = IS_MAIN_WINDOW ? '[*] ' : ''
    let sep = state.scene_src && state.scene_src.length ? '|' : ''
    document.querySelector('head title').innerHTML = `${prefix} preview_3d ${PACKAGE_INFO.version} ${sep} ${state.scene_src} | renderer: three.js`
}
function set_loader(visible, progress) {
    let loader = document.getElementById("loader")
    if (visible) {
        loader.classList.add('active')
    } else {
        loader.classList.remove('active')
    }
}

function _generate_list_keys(data, mode = 0) {
    let result = {}
    for (let k in data) {
        result[k] = k
    }
    return result
}
const refresh_gui = _.throttle(() => {
    main_pane.item.refresh();
    help_pane.item.refresh();
    file_pane.item.refresh();
}, 1000 / 2)

window.handle_secondary_window_mode = update_title
window.handle_main_window_mode = update_title

update_title()

export {
    init_gui,
    collapse_gui,
    check_updates,
    update_title,
    set_loader,
    panes,
    refresh_gui,
    notifications
}