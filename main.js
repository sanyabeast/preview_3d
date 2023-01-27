
const { app, BrowserWindow, screen } = require('electron')
const path = require('path')

let main_window = null
let got_the_lock = app.requestSingleInstanceLock()

let file_to_open = path.resolve(process.cwd(), process.argv[2]);
console.log(`file to open: ${file_to_open}`)

const create_window = (initial_opened_file) => {
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
    // main_window.webContents.openDevTools()
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