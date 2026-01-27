import { defineConfig } from 'vite';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import path from 'path';

export default defineConfig({
  // 开发服务器配置
  server: {
    port: 3000,
    open: true // 启动时自动打开浏览器
  },
  base: '/vite/', // 必须和仓库名一致，不能错！
  // 构建配置
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      plugins: [
        nodeResolve({
          preferBuiltins: false // 优先使用浏览器端实现
        })
      ],
      // 兼容 iconv-lite
      external: [],
      output: {
        globals: {
          'iconv-lite': 'iconv'
        }
      }
    }
  },
  // 优化依赖
  optimizeDeps: {
    include: ['iconv-lite']
  },
  // 别名配置（可选）
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
