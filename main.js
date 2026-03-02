// main.js - Electron 主进程核心文件
const { app, BrowserWindow, path } = require('electron');
const path = require('path');

// 解决开发环境下的路径兼容问题
const isDev = process.env.NODE_ENV === 'development';

// 创建桌面窗口的核心函数
function createWindow() {
  // 配置窗口大小、标题等参数
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'CSV可视化工具',
    webPreferences: {
      nodeIntegration: true, // 允许渲染进程使用Node.js API（按需开启）
      contextIsolation: false, // 配合nodeIntegration使用
      preload: path.join(__dirname, 'preload.js') // 可选：预加载脚本（无则注释）
    }
  });

  // 加载页面：开发环境加载Vite本地服务，生产环境加载打包后的静态文件
  if (isDev) {
    // 开发环境：Vite默认端口5173
    mainWindow.loadURL('http://127.0.0.1:5173');
    // 可选：打开开发者工具
    mainWindow.webContents.openDevTools();
  } else {
    // 生产环境：加载dist文件夹中的index.html
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  // 窗口关闭时退出应用
  mainWindow.on('closed', () => {
    app.quit();
  });
}

// Electron初始化完成后创建窗口
app.whenReady().then(() => {
  createWindow();

  // macOS兼容：窗口关闭后重新打开
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 所有窗口关闭时退出应用（Windows/Linux）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
