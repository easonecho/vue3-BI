import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

/**
 * 单元测试配置
 *
 * 与 vite.config.ts 的差异:
 *   - 不加载 vueDevTools（调试插件在测试环境无意义且会拖慢启动）
 *   - 不加载 optimizeDeps / server 代理（测试不打真实接口）
 *   - environment 用 happy-dom，兼容依赖 window 的模块（request.ts 等）
 *
 * 测试文件与源码同目录（*.test.ts），用显式 import 而非 globals，
 * 这样 vue-tsc 的 type-check 也能覆盖测试文件。
 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
    // 不开启 globals: 测试内显式 import { describe, it, expect }
    globals: false,
  },
})
