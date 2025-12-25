const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        icon: path.join(__dirname, 'coolerbox.jpg'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        title: 'Greenspoon Box Tracker',
        autoHideMenuBar: false
    });

    // Start the backend server
    startBackendServer();

    // Wait for server to start, then load the frontend
    setTimeout(() => {
        mainWindow.loadURL('http://localhost:3000');
    }, 2000);

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

function startBackendServer() {
    const serverPath = path.join(__dirname, 'backend', 'server.js');
    
    console.log('Starting backend server from:', serverPath);
    console.log('App data directory:', app.getPath('userData'));
    
    // Set environment variable for database location
    const env = Object.assign({}, process.env);
    if (app.isPackaged) {
        env.PORTABLE_EXECUTABLE_DIR = app.getAppPath();
    }
    
    serverProcess = spawn('node', [serverPath], {
        cwd: path.join(__dirname, 'backend'),
        stdio: 'inherit',
        env: env
    });

    serverProcess.on('error', (error) => {
        console.error('Failed to start server:', error);
    });

    serverProcess.on('exit', (code) => {
        console.log(`Server process exited with code ${code}`);
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    // Kill the server process
    if (serverProcess) {
        serverProcess.kill();
    }
    
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});

app.on('before-quit', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
});
