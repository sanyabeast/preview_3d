

/** Created by @sanyabeast | 28 Jan 2023 | Kyiv, Ukraine */

import { Notyf } from 'notyf';

import { release_page_url, update_check_url } from './data.js'
import { set_inspection_mode, set_matcap, inspect_modes, torch_light } from './inspect.js'
import {
    world,
    camera,
    notify_render,
    set_environment,
    set_fps_limit,
    set_sun_azimuth,
    set_sun_height,
    set_environment_intensity,
    set_daytime,
    set_ambient_intentsity,
    set_environment_influence,
    set_resolution_scale,
    set_shadows_enabled,
    pilot_camera,
    set_animations_scale,
    set_environment_rotation
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

let main_pane, file_pane
let panes = {}
let is_loading = false

function init_gui(params) {
    if (state.check_updates === true) {
        setTimeout(check_updates, 15000)
    }
    panes.file = create_file_pane()
    panes.main = create_main_pane()
}
function create_main_pane() {
    main_pane = build_gui(
        {
            type: 'pane',
            class_list: ['main'],
            children: {
                'viewport_settings_folder': {
                    type: 'folder',
                    title: "👁️‍🗨️ Rendering",
                    children: {
                        'postfx_enabled': {
                            type: 'input',
                            bind: [state, 'postfx_enabled'],
                            label: '✨ Postfx',
                            hidden: true,
                            on_change: 'on_postfx_changed'
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
                            min: 0.5, max: 1, step: 0.001,
                            label: "🧇 Resolution",
                            on_change: ({ value }) => set_resolution_scale(value)
                        },
                        'shadows_enabled': {
                            type: 'input',
                            bind: [state, 'render_shadows_enabled'],
                            label: '🌚 Shadows',
                            on_change: ({ value }) => {
                                set_shadows_enabled(value)
                            }
                        },
                        'viewport_extra_settings': {
                            type: 'folder',
                            title: 'more settings',
                            children: {
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
                                    label: 'FPS Cap',
                                    on_click: ({ cell }) => set_fps_limit(cell.title)
                                },
                            }
                        },
                    }
                },
                'camera_settings_folder': {
                    type: 'folder',
                    title: '📽 Camera',
                    children: {
                        'render_camera_fov': {
                            type: 'input',
                            bind: [state, 'render_camera_fov'],
                            label: "fov",
                            min: 5,
                            max: 120,
                            step: 1,
                            on_change: ({ value }) => {
                                camera.fov = value
                                camera.updateProjectionMatrix()
                                pilot_camera(null)
                            },
                        },
                        'scene_cameras_list': {
                            type: 'folder',
                            title: '📋 scenic cameras',
                            expanded: true
                        }
                    }
                },
                'lights_folder': {
                    type: 'folder',
                    title: '☀️ Light',
                    children: {
                        'daytime': {
                            type: 'input',
                            bind: [state, 'render_daytime'],
                            label: "🌗 Daytime",
                            min: 0,
                            max: 1,
                            step: 0.001,
                            on_change: ({ value }) => set_daytime(value)
                        },
                        'flares': {
                            type: 'input',
                            bind: [state, 'render_flares_global_intensity'],
                            label: "✨ flares",
                            min: 0,
                            max: 10,
                            step: 0.001,
                            on_change: notify_render
                        },
                        'scenic_lights_folder': {
                            type: 'folder',
                            title: '💡 Scenic Lights',
                            expanded: false,
                            children: {
                                'disable_lights': {
                                    type: 'input',
                                    bind: [state, 'render_disable_all_scenic_lights'],
                                    label: "⛔️ disable all",
                                    on_change: notify_render
                                },
                                'scenic_lighst_intensity_scale': {
                                    type: 'input',
                                    bind: [state, 'render_scenic_light_intensity_scale'],
                                    label: "🔆 overall intensity",
                                    min: 0,
                                    max: 10,
                                    step: 0.001,
                                    on_change: notify_render
                                },
                                'scenic_lights_list': {
                                    type: 'folder',
                                    title: 'lights list',
                                    expanded: true
                                }
                            }
                        },
                        'environtment_settings_folder': {
                            type: 'folder',
                            title: '🏜 environment and more',
                            children: {
                                'env_enabled': {
                                    type: 'input',
                                    bind: [state, 'env_enabled'],
                                    label: 'env. enabled',
                                    on_change: 'on_env_enabled_changed'
                                },
                                'env_blur': {
                                    type: 'input',
                                    bind: [world, 'backgroundBlurriness'],
                                    label: "💧 Env. Blur",
                                    min: 0,
                                    max: 1,
                                    step: 0.001,
                                    on_change: notify_render
                                },
                                'env_rotation': {
                                    type: 'input',
                                    bind: [state, 'render_environment_rotation'],
                                    label: "💫 env. rotation",
                                    min: 0,
                                    max: 1,
                                    step: 0.001,
                                    on_change: ({ value }) => set_environment_rotation(value)
                                },
                                'env_map_select_folder': {
                                    type: 'folder',
                                    title: '🖼 Texture',
                                    expanded: true,
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
                                        'render_environment_intensity': {
                                            type: 'input',
                                            bind: [state, 'render_environment_intensity'],
                                            label: "env. brightness",
                                            min: 0,
                                            max: 1,
                                            step: 0.001,
                                            on_change: ({ value }) => set_environment_intensity(value)
                                        },
                                        'render_environment_influence': {
                                            type: 'input',
                                            bind: [state, 'render_environment_influence'],
                                            label: "env. influence",
                                            min: 0,
                                            max: 5,
                                            step: 0.001,
                                            on_change: ({ value }) => set_environment_influence(value)
                                        },
                                        'ambient_intensity': {
                                            type: 'input',
                                            bind: [state, 'render_ambient_intensity'],
                                            label: "Amb. intensity",
                                            min: 0,
                                            max: 1,
                                            step: 0.001,
                                            on_change: ({ value }) => set_ambient_intentsity(value)
                                        },
                                        'sun_height': {
                                            type: 'input',
                                            bind: [state, 'render_sun_height'],
                                            label: "sun elevation",
                                            min: 0,
                                            max: 1,
                                            step: 0.001,
                                            on_change: ({ value }) => set_sun_height(value)
                                        },
                                        'sun_azimuth': {
                                            type: 'input',
                                            bind: [state, 'render_sun_azimuth'],
                                            label: "Sun azimuth",
                                            min: 0,
                                            max: 1,
                                            step: 0.001,
                                            on_change: ({ value }) => set_sun_azimuth(value)
                                        },
                                        'emission_scale': {
                                            type: 'input',
                                            bind: [state, 'render_emission_scale'],
                                            label: "Emission boost",
                                            min: 0,
                                            max: 10,
                                            step: 0.001,
                                            on_change: ({ value }) => notify_render
                                        },
                                        'torchlight': {
                                            type: 'input',
                                            bind: [state, 'torch_light'],
                                            label: "🔦 flashlight",
                                            on_change: 'on_torchlight_changed'
                                        },
                                    }
                                },
                            }
                        },
                    }
                },
                'animations_folder': {
                    type: 'folder',
                    title: '🤹‍♀️ Animations',
                    hidden: true,
                    children: {
                        'disable_animations': {
                            type: 'input',
                            bind: [state, 'render_disable_animations'],
                            label: "⛔️ Pause all"
                        },
                        'render_global_timescale_input': {
                            type: 'input',
                            bind: [state, 'render_global_timescale'],
                            label: "🕑 Timescale",
                            min: 0,
                            max: 10,
                            step: 0.001,
                            on_change: ({ value }) => set_animations_scale(value)
                        },
                        'animation_tracks_list': {
                            type: 'folder',
                            title: '📋 Actions weight',
                            expanded: true
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
            on_resolution_scale_changed: ({ value }) => {
                handle_window_resized()
                notify_render()
            },
            on_torchlight_changed: ({ value }) => {
                torch_light.visible = value
                notify_render()
            },
            on_inspect_show_gizmo_changed: ({ value }) => {
                world.render_gizmo = value
                notify_render()
            },
            on_inspect_mode_changed: ({ value }) => {
                console.log(value)
                set_inspection_mode(value)
            },
            on_inspect_matcap_mode_changed: ({ value }) => {
                set_inspection_mode('Matcap')
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
                title: "📝 file",
                children: {
                    open_button: {
                        type: 'button',
                        bind: [state, 'scene_src'],
                        label: "📎 Current",
                        title: "Open",
                        on_click: () => file_input.click()
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
                }
            },
            'help_folder': {
                type: 'folder',
                title: "☂️ help",
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

    return file_pane

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
    _collapse_gui_item(main_pane, true)
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
            file_pane.update_available_banner.title = `Update: ${remote_package.version}`
            file_pane.update_available_banner.hidden = false
        } else {
            file_pane.update_available_banner.hidden = true
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
    is_loading = visible
    let loader = document.getElementById("loader")
    if (visible) {
        loader.classList.add('active')
    } else {
        loader.classList.remove('active')
    }
}
function get_loader_state(){ return is_loading }

function _generate_list_keys(data, mode = 0) {
    let result = {}
    for (let k in data) {
        result[k] = k
    }
    return result
}
const refresh_gui = _.throttle(() => {
    main_pane.item.refresh();
    file_pane.item.refresh();
}, 1000 / 2)

window.handle_secondary_window_mode = update_title
window.handle_main_window_mode = update_title
window.set_loader = set_loader

update_title()

export {
    init_gui,
    collapse_gui,
    check_updates,
    update_title,
    set_loader,
    panes,
    refresh_gui,
    notifications,
    get_loader_state
}