
const directory_tree = require('directory-tree')
const path = require('path')
const jsonfile = require('jsonfile')

const assets_data = {
    matcap: parse_asset(directory_tree('./assets/matcap')),
    examples: parse_asset(directory_tree('./assets/example')),
    hdr: parse_asset(directory_tree('./assets/hdr')),
}

function parse_asset(data) {
    let r = {}
    if (data.children) {
        data.children.forEach((child, index) => {
            let file = child.name
            let alias = child.name.replace(path.extname(child.name), '')
            r[alias] = file
        })
    }
    return r
}

jsonfile.writeFileSync('./assets.json', assets_data, { spaces: 4 })