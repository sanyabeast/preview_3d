
/** Created by @sanyabeast | 28 Jan 2023 | Kyiv, Ukraine */

const url_helper = require('url')
const query_helper = require('querystring');
const _ = require('lodash')
const PACKAGE_INFO = require('./package.json')
const { app, BrowserWindow, screen, ipcMain } = require('electron')
const path = require('path')
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'
const QUIT_ON_LAST_WINDOW_CLOSED = false;
const EXTENSIONS = require('./extensions.js')


let app_ready = false
let windows = []
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
    const { width, height } = primary_display.workAreaSize;

    windows.forEach((win) => {
        win.webContents.send('secondary_window_mode')
    })

    if (_.isString(file_parameter)) {
        process.env.file_parameter = file_parameter
    }

    let win = new BrowserWindow({
        width: Math.floor(width * 0.8),
        height: Math.floor(Math.floor(width * 0.75) / 16 * 10),
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

    windows.push(win)
    win.setMenuBarVisibility(false)
    win.loadFile(`index.html`)

    win.on('focus', ev => win.send('window_focus'))
    win.on('blur', ev => win.send('window_blur'))

    win.on('close', (ev) => {
        let win_query_data = get_query_parameters(win.webContents.getURL())
        for (let i = 0; i < windows.length; i++) {
            if (windows[i].id == win.id) {
                windows.splice(i, 1)
                break;
            }
        }
        if (get_main_window()) {
            get_main_window().webContents.send('main_window_mode')
        }
        if (_.isString(win_query_data.file_parameter)) {
            file_parameter = win_query_data.file_parameter;
            console.log(`file parameter saved: ${file_parameter}`)
        }
    })

    if (IS_DEVELOPMENT) {
        win.webContents.openDevTools()
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
            let win_query_data = get_query_parameters(ev.sender.getURL())
            if (_.isString(win_query_data.file_parameter)) {
                file_parameter = win_query_data.file_parameter
            }
            create_window()
        })

        ipcMain.handle('quit', (ev, open_parameter) => {
            app.quit()
        })
    })
}

const get_query_parameters = (url) => {
    let url_data = url_helper.parse(url)
    let query_data = query_helper.parse(url_data.query)
    return query_data
}

const open_file = () => {
    if (get_main_window()) {
        console.log(`single instance mode. sending open request to existing window... ${file_parameter}`)
        get_main_window().webContents.send('open_file', { 'path': file_parameter });
        get_main_window().restore()
        get_main_window().focus()
    } else {
        create_window()
    }
}

function get_main_window() {
    return windows[windows.length - 1]
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