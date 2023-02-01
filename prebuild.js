/** Created by @sanyabeast | 28 Jan 2023 | Kyiv, Ukraine */

const directory_tree = require('directory-tree')
const path = require('path')
const jsonfile = require('jsonfile')
const fs = require('fs')

const EXTENSIONS = require('./extensions.js')

const assets_data = {
    matcap: parse_asset(directory_tree('./assets/matcap'), {}),
    samples: parse_asset(directory_tree('./assets/samples'), { keep_extname: true, only_supported_extensions: true }),
    hdr: parse_asset(directory_tree('./assets/hdr'), {}),
    texts: preload_texts(directory_tree('./assets/texts')),
}

function parse_asset(data, { keep_extname, only_supported_extensions }) {
    let r = {}
    if (data.children) {
        data.children.forEach((child, index) => {
            let file = child.name
            let alias = child.name
            let extname = path.extname(child.name)

            if (only_supported_extensions === true) {
                if (EXTENSIONS.indexOf(extname) < 0) {
                    return
                }
            }

            if (keep_extname !== true) {
                alias = alias.replace(extname, '')
            }
            r[alias] = file
        })
    }
    return r
}

function preload_texts(data) {
    let r = {}
    if (data.children) {
        data.children.forEach((child) => {
            let alias = child.name.replace(path.extname(child.name), '')
            r[alias] = fs.readFileSync(child.path, { encoding: 'utf-8' })
        })
    }
    return r
}


jsonfile.writeFileSync('./assets.json', assets_data, { spaces: 4 })