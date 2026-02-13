import { defineConfig } from 'vite';

export default defineConfig({
  // 开发服务器配置
  server: {
    port: 5173,
    open: true // 启动时自动打开浏览器
  },
  base: './', // 使用相对路径
  // 构建配置
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    cssCodeSplit: true,
    assetsInlineLimit: 4096
  }
});
