/** Created by @sanyabeast | 28 Jan 2023 | Kyiv, Ukraine */

const path = require('path')
const ipcRenderer = window.require('electron').ipcRenderer;
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'
const package = require('./package.json')
const ASSETS = require('./assets.json')
const shell = require('electron').shell;

window.PACKAGE_INFO = package
window.IS_DEVELOPMENT = IS_DEVELOPMENT
window.ASSETS = ASSETS
window.open_browser = (url) => {
    shell.openExternal(url)
}
window.LOCAL_BASE_PATH = IS_DEVELOPMENT ? '.' : './resources/app'

let os_tools = {
    path: path
}

process.argv.forEach((arg, index) => {
    if (arg === '[*]') {
        window.file_to_open = process.argv[index + 1]
        console.log(`file to open: ${window.file_to_open}`)
    }
})

ipcRenderer.on('open_file', function (evt, message) {
    console.log(`nwe file open request: ${message.path}`)
    if ('load_file' in window) {
        window.load_file(message.path)
    }
});

window.os_tools = os_tools