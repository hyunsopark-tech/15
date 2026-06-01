const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs   = require('fs');
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#f0f4f8',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../public/logo192.png'),
  });

  if (isDev) {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../build/index.html'));
  }

  buildMenu(win);
  return win;
}

function buildMenu(win) {
  const template = [
    {
      label: 'DentBooks',
      submenu: [
        { label: 'About DentBooks', role: 'about' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'Reports',
      submenu: [
        {
          label: 'Upload Appointment List…',
          accelerator: 'CmdOrCtrl+1',
          click: () => openFilePicker(win, 'appointments'),
        },
        {
          label: 'Upload Daily Production…',
          accelerator: 'CmdOrCtrl+2',
          click: () => openFilePicker(win, 'production'),
        },
        {
          label: 'Upload A/R Aging…',
          accelerator: 'CmdOrCtrl+3',
          click: () => openFilePicker(win, 'aging'),
        },
        {
          label: 'Upload New Patients…',
          accelerator: 'CmdOrCtrl+4',
          click: () => openFilePicker(win, 'newPatients'),
        },
        {
          label: 'Upload Payments…',
          accelerator: 'CmdOrCtrl+5',
          click: () => openFilePicker(win, 'payments'),
        },
        { type: 'separator' },
        {
          label: 'Upload All Reports…',
          accelerator: 'CmdOrCtrl+Shift+U',
          click: () => win.webContents.send('navigate', 'Upload Data'),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Dashboard', accelerator: 'CmdOrCtrl+D', click: () => win.webContents.send('navigate', 'Dashboard') },
        { label: 'Appointments', accelerator: 'CmdOrCtrl+A', click: () => win.webContents.send('navigate', 'Appointments') },
        { type: 'separator' },
        { label: 'Reload', role: 'reload' },
        { label: 'Toggle Full Screen', role: 'togglefullscreen' },
        ...(isDev ? [{ label: 'Dev Tools', role: 'toggleDevTools' }] : []),
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function openFilePicker(win, reportKey) {
  const result = await dialog.showOpenDialog(win, {
    title: `Select Open Dental CSV — ${reportKey}`,
    filters: [{ name: 'CSV / Text', extensions: ['csv', 'txt'] }],
    properties: ['openFile'],
  });
  if (result.canceled || !result.filePaths.length) return;
  const filePath = result.filePaths[0];
  const csv = fs.readFileSync(filePath, 'utf-8');
  win.webContents.send('od-report', { key: reportKey, filename: path.basename(filePath), csv });
}

// IPC: renderer asks main to open file picker
ipcMain.handle('pick-file', async (event, reportKey) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  await openFilePicker(win, reportKey);
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
