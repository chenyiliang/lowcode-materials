import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

// 库产物：src/index.tsx → dist/index.{mjs,cjs} + dist/index.d.ts
// antd / react / @ant-design/icons / dayjs / lodash 等全部 external，交给消费方解析。
export default defineConfig({
  plugins: [
    react(),
    // 只给 src 生成类型；lowcode 物料 meta 由 build:lowcode 单独打包，不需要 .d.ts
    dts({ entryRoot: 'src', outDir: 'dist', include: ['src'], insertTypesEntry: true }),
  ],
  build: {
    lib: {
      entry: 'src/index.tsx',
      formats: ['es', 'cjs'],
      fileName: (f) => (f === 'es' ? 'index.mjs' : 'index.cjs'),
    },
    rollupOptions: {
      // rolldown(Vite 8) 对每个 id 调两次 external：先是原始 id（isResolved=false），
      // 再是解析后的绝对路径（isResolved=true）。解析后的绝对路径一定是本地文件，
      // 必须打包进来；否则相对导入会被当外部包漏出（Windows 盘符路径不以 '/' 开头，
      // 老写法 `!id.startsWith('/')` 会误判）。
      external: (id, _importer, isResolved) => {
        if (isResolved) return false;
        if (id.startsWith('.') || id.startsWith('virtual:')) return false;
        if (/^[A-Za-z]:[\\/]/.test(id)) return false; // Windows 盘符绝对路径
        return true; // 裸包（依赖 / peer / workspace）external
      },
    },
    sourcemap: true,
    minify: false,
    emptyOutDir: true,
  },
});
