
const { app, BrowserWindow, screen } = require('electron')
const path = require('path')

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'

let main_window = null
let got_the_lock = app.requestSingleInstanceLock()


let open_parameter = get_open_parameter(process.argv);
let file_to_open

if (open_parameter) {
    console.log(`open parameter: ${open_parameter}`)
    file_to_open = path.resolve(process.cwd(), open_parameter);
} else {
    file_to_open = ''
}

console.log(`file to open: ${file_to_open}`)

function get_open_parameter(list) {
    let ready
    for (let i = 0; i < list.length; i++) {
        console.log(list[i])
    }
}

function create_window(initial_opened_file) {
    const primary_display = screen.getPrimaryDisplay()
    const { width, height } = primary_display.workAreaSize
    console.log(`display dimensions: ${width}:${height}`)
    main_window = new BrowserWindow({
        width: Math.floor(width / 3 * 2),
        height: Math.floor(height / 3 * 2),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            devTools: true,
            contextIsolation: false,
            nodeIntegration: true,
            additionalArguments: [
                '[*]',
                initial_opened_file
            ]
        }
    })
    main_window.loadFile(`index.html`)
    if (IS_DEVELOPMENT) {
        main_window.webContents.openDevTools()
    }
}

if (!got_the_lock) {
    app.quit()
} else {
    app.on('second-instance', (event, cli_parameters, working_dir) => {
        let file_to_open = cli_parameters[cli_parameters.length - 1]
        console.log(`new window file: ${file_to_open}`)
        // Someone tried to run a second instance, we should focus our window.
        if (main_window) {
            console.log(main_window)
            main_window.webContents.send('open_file', { 'path': file_to_open });
            main_window.restore()
            main_window.focus()
        } else {
            create_window(file_to_open)
        }
    })

    // Create main_window, load the rest of the app, etc...
    app.on('ready', () => {
        create_window(file_to_open)
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) create_window(file_to_open)
        })
    })
}


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})