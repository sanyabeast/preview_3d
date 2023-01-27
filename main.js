
const { app, BrowserWindow } = require('electron')
const path = require('path')

let file_to_open = path.resolve(process.cwd(), process.argv[2]);
console.log(file_to_open)

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 1600,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            devTools: true,
            contextIsolation: false,
            nodeIntegration: true,
            additionalArguments: [
                '[*]',
                file_to_open
            ]
        }
    })
    mainWindow.loadFile(`index.html`)
    mainWindow.webContents.openDevTools()
}
app.whenReady().then(() => {
    createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})