const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const url = require('url');

// 声明窗口实例，避免被垃圾回收
let mainWindow;

// 创建内置HTTP服务器，加载Vite构建的dist静态资源
function createServer() {
// 静态资源根目录（指向你的Vite项目dist文件夹，无需修改路径）
const staticRoot = path.join(__dirname, 'dist');
// 创建服务器，监听本地随机可用端口（避免端口占用）
const server = http.createServer((req, res) => {
// 解析请求路径，默认加载index.html（解决前端路由刷新404）
let reqPath = url.parse(req.url).pathname;
reqPath = reqPath === '/' ? '/index.html' : reqPath;
const filePath = path.join(staticRoot, reqPath);

// 读取静态文件并返回（适配你的项目静态资源，如text-encoding依赖相关资源）
fs.readFile(filePath, (err, data) => {
if (err) {
// 404时返回index.html，适配前端路由
fs.readFile(path.join(staticRoot, 'index.html'), (err2, data2) => {
res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
res.end(data2);
});
return;
}
// 根据文件后缀设置响应头（适配你的项目所有静态资源格式）
const ext = path.extname(filePath);
const contentTypeMap = {
'.html': 'text/html; charset=utf-8',
'.css': 'text/css',
'.js': 'application/javascript',
'.png': 'image/png',
'.jpg': 'image/jpeg',
'.svg': 'image/svg+xml',
'.ico': 'image/x-icon'
};
res.writeHead(200, { 'Content-Type': contentTypeMap[ext] || 'application/octet-stream' });
res.end(data);
});
});
// 监听3000端口（可修改为其他端口，如8080，避免与本地其他服务冲突）
server.listen(3000, '127.0.0.1', () => {
console.log('内置服务器启动：http://127.0.0.1:3000');
});
return `http://127.0.0.1:3000`;
}

// 创建Electron窗口
function createWindow() {
// 启动内置服务器，获取访问地址
const appUrl = createServer();
// 创建浏览器窗口（可根据你的项目界面需求调整大小）
mainWindow = new BrowserWindow({
width: 1200,  // 窗口默认宽度
height: 800,  // 窗口默认高度
webPreferences: {
nodeIntegration: false,  // 安全配置，禁止Node.js集成
contextIsolation: true   // 开启上下文隔离，提升安全性
}
});
// 加载内置服务器的Vite项目地址
mainWindow.loadURL(appUrl);
// 关闭开发者工具（打包前注释，方便调试；打包时打开）
// mainWindow.webContents.closeDevTools();
// 窗口关闭时销毁实例
mainWindow.on('closed', () => {
mainWindow = null;
});
}

// Electron应用就绪后创建窗口和服务器
app.whenReady().then(() => {
createWindow();
// macOS下，应用窗口关闭后保留进程，点击dock图标重新创建窗口
app.on('activate', () => {
if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
});

// 所有窗口关闭时退出应用（macOS除外）
app.on('window-all-closed', () => {
if (process.platform !== 'darwin') app.quit();
});