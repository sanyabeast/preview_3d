

const _ = require('lodash')
const BUILD_CONFIG = require('./build.config.json')
const EXTENSIONS = _.map(BUILD_CONFIG.fileAssociations[0].ext, ext => `.${ext}`)

module.exports = EXTENSIONS