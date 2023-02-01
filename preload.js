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

window.open_browser = (url) => {
    shell.openExternal(url)
}

window.new_window = (open_parameter) => {
    console.log(open_parameter)
    ipcRenderer.invoke('new_window', open_parameter)
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
}