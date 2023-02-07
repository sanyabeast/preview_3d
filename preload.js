/** Created by @sanyabeast | 28 Jan 2023 | Kyiv, Ukraine */

const directory_tree = require('directory-tree')
const jsonfile = require('jsonfile')

const path = require('path')
const ipcRenderer = window.require('electron').ipcRenderer;
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'
const PACKAGE_INFO = require('./package.json')
const ASSETS = require('./assets.json')
const EXTENSIONS = require('./extensions.js')
const shell = require('electron').shell;

window.IS_MAIN_WINDOW = true
window.IS_WINDOW_FOCUSED = true
window.IS_MACOS = process.platform === 'darwin'

window.open_browser = (url) => {
    shell.openExternal(url)
}

window.new_window = () => {
    ipcRenderer.invoke('new_window')
}

window.ipc_invoke = (event_name, payload) => {
    ipcRenderer.invoke(event_name, payload)
}

window.ipc_on = (event_name, callback) => {
    ipcRenderer.on(event_name, callback)
}

if (!window.location.href.startsWith('file://')) {
    open_browser(window.location.href);
    window.open(`${__dirname}/index.html`)
} else {
    let OS_TOOLS = {
        path: path,
        directory_tree: directory_tree,
        jsonfile
    }

    window.PACKAGE_INFO = PACKAGE_INFO
    window.IS_DEVELOPMENT = IS_DEVELOPMENT
    window.ASSETS = ASSETS
    window.EXTENSIONS = EXTENSIONS
    window.OS_TOOLS = OS_TOOLS

    ipcRenderer.on('open_file', function (evt, message) {
        console.log(`nwe file open request: ${message.path}`)
        if ('load_file' in window) {
            window.load_file(message.path)
        }
    });

    ipcRenderer.on('secondary_window_mode', function (evt, message) {
        window.IS_MAIN_WINDOW = false;
        if (_.isFunction(window.handle_secondary_window_mode)) {
            window.handle_secondary_window_mode()
        }
    });

    ipcRenderer.on('main_window_mode', function (evt, message) {
        window.IS_MAIN_WINDOW = true;
        if (_.isFunction(window.handle_secondary_window_mode)) {
            window.handle_main_window_mode()
        }
    });

    ipcRenderer.on('window_focus', function (evt, message) {
        window.IS_WINDOW_FOCUSED = true;
    });

    ipcRenderer.on('window_blur', function (evt, message) {
        window.IS_WINDOW_FOCUSED = false;
    });

}