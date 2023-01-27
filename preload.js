const path = require('path')

let node_tools = {
    path: path
}

process.argv.forEach((arg, index) => {
    if (arg === '[*]') {
        window.file_to_open = process.argv[index + 1]
        console.log(`file to open: ${window.file_to_open}`)
    }
})



console.log(process.argv)

console.log(window, node_tools)
window.node_tools = node_tools