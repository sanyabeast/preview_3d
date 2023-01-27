const path = require('path')
const ipcRenderer = window.require('electron').ipcRenderer;
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'

window.IS_DEVELOPMENT = IS_DEVELOPMENT

let node_tools = {
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

console.log(process.argv)

console.log(window, node_tools)
window.node_tools = node_tools