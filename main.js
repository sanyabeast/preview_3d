
/** Created by @sanyabeast | 28 Jan 2023 | Kyiv, Ukraine */

const _ = require('lodash')
const PACKAGE_INFO = require('./package.json')
const { app, BrowserWindow, screen, ipcMain } = require('electron')
const path = require('path')
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'
const QUIT_ON_LAST_WINDOW_CLOSED = true;
const EXTENSIONS = require('./extensions.js')


let app_ready = false
let main_window = null
let got_the_lock = app.requestSingleInstanceLock()
let file_parameter = get_file_parameter(process.argv);

function get_file_parameter(list) {
    let result = null
    for (let i = 0; i < list.length; i++) {
        let extname = path.extname(list[i])
        if (EXTENSIONS.indexOf(extname) > -1) {
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

function create_window() {
    const primary_display = screen.getPrimaryDisplay()
    const { width, height } = primary_display.workAreaSize

    if (_.isString(file_parameter)) {
        process.env.file_parameter = file_parameter
    }

    main_window = new BrowserWindow({
        width: Math.floor(Math.min(width, height)),
        height: Math.floor(Math.min(width, height) / 3 * 2),
        // width,
        // height,
        webPreferences: {
            // webSecurity: false,
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
        console.log(`second instance...`)
        file_parameter = get_file_parameter(cli_parameters) || file_parameter
        open_file()
    })

    app.on('ready', () => {
        app_ready = true
        open_file()
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) create_window()
        })

        ipcMain.handle('new_window', (ev, open_parameter) => {
            console.dir(open_parameter)
        })
    })
}

const open_file = () => {
    if (main_window) {
        console.log(`single instance mode. sending open request to existing window... ${file_parameter}`)
        main_window.webContents.send('open_file', { 'path': file_parameter });
        main_window.restore()
        main_window.focus()
    } else {
        create_window()
    }
}

app.on('open-file', (event, file_path) => {
    console.log(`open file event: ${file_path}`)
    file_parameter = file_path || file_parameter
    if (app_ready) {
        open_file()
    }
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin' || QUIT_ON_LAST_WINDOW_CLOSED) app.quit()
})