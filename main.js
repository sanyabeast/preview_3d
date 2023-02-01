
/** Created by @sanyabeast | 28 Jan 2023 | Kyiv, Ukraine */

const _ = require('lodash')
const PACKAGE_INFO = require('./package.json')
const { app, BrowserWindow, screen } = require('electron')
const path = require('path')
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'
const QUIT_ON_LAST_WINDOW_CLOSED = true;

let main_window = null
let got_the_lock = app.requestSingleInstanceLock()
let open_parameter = get_open_parameter(process.argv);

function get_open_parameter(list) {
    let result
    for (let i = 0; i < list.length; i++) {
        let extname = path.extname(list[i])
        if (PACKAGE_INFO.extensions.indexOf(extname) > -1) {
            console.log(`file format ${extname} is supported. opening...`)
            result = list[i]
            break
        } else {
            console.log(`unsupported file format ${extname}. ignoring open request`)
        }
    }
    console.log(`searching for open parameter done. result: ${result}`)
    return result
}

function create_window(initial_opened_file) {
    const primary_display = screen.getPrimaryDisplay()
    const { width, height } = primary_display.workAreaSize

    if (_.isString(open_parameter)) {
        process.env.open_parameter = initial_opened_file
    }

    main_window = new BrowserWindow({
        width: Math.floor(Math.min(width, height)),
        height: Math.floor(Math.min(width, height) / 3 * 2),
        // width,
        // height,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            devTools: true,
            contextIsolation: false,
            nodeIntegration: true
        }
    })
    main_window.setMenuBarVisibility(false)
    main_window.loadFile(`index.html`)
    if (IS_DEVELOPMENT) {
        main_window.webContents.openDevTools()
    }
}

if (!got_the_lock) {
    app.quit()
} else {
    app.on('second-instance', (event, cli_parameters, working_dir) => {
        let open_parameter = get_open_parameter(cli_parameters)
        console.log(`new window file: ${open_parameter}`)
        // Someone tried to run a second instance, we should focus our window.
        if (main_window) {
            main_window.webContents.send('open_file', { 'path': open_parameter });
            main_window.restore()
            main_window.focus()
        } else {
            create_window(open_parameter)
        }
    })

    // Create main_window, load the rest of the app, etc...
    app.on('ready', () => {
        if (process.platform === 'darwin') {
            app.on('open-file', (event) => {
                console.log(event)
            })
        } else {
            create_window(open_parameter)
        }

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) create_window(open_parameter)
        })
    })
}


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin' || QUIT_ON_LAST_WINDOW_CLOSED) app.quit()
})