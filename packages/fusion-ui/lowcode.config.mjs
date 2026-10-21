// 物料 meta 构建配置 —— 迁移自老的 build.lowcode.js（@alifd/build-plugin-lowcode 选项）。
// 由 scripts/build-lowcode.mjs 读取。
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default {
  // 老配置 library: 'AlifdFusionUi'（build.json），engineScope: '@alilc'
  library: 'AlifdFusionUi',
  entryPath: 'src/index.tsx',
  lowcodeDir: 'lowcode',
  // 老 build.lowcode.js 未指定 categories，沿用插件默认分类
  npmInfo: { package: pkg.name, version: pkg.version },
  baseUrl: {
    prod: `https://alifd.alicdn.com/npm/${pkg.name}@${pkg.version}`,
    daily: `https://alifd.alicdn.com/npm/${pkg.name}@${pkg.version}`,
  },
  // 老配置 renderUrls：引擎按此加载 view 产物
  renderUrls: [
    `https://alifd.alicdn.com/npm/${pkg.name}@${pkg.version}/dist/AlifdFusionUi.js`,
    `https://alifd.alicdn.com/npm/${pkg.name}@${pkg.version}/dist/AlifdFusionUi.css`,
  ],
};
