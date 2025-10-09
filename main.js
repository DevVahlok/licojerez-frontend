const { app, BrowserWindow } = require("electron");
const path = require("path");

let appWin;
const isDev = process.env.NODE_ENV === "development";

createWindow = () => {
    appWin = new BrowserWindow({
        width: 1920,
        height: 1080,
        title: "Licojerez",
        resizable: true,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true
        },
        icon: path.join(__dirname, 'electron', 'icon.ico')
    });

    if (isDev) {
        appWin.loadURL('http://localhost:4200');
        appWin.webContents.openDevTools();
    } else {
        appWin.loadFile(path.join(__dirname, '/dist/index.html'));
        appWin.maximize();
    }

    appWin.setMenu(null);

    appWin.on("closed", () => {
        appWin = null;
    });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});