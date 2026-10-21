// 物料 meta 构建配置 —— 迁移自老的 build.lowcode.js（@alifd/build-plugin-lowcode 选项）。
// 由 scripts/build-lowcode.mjs 读取。
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default {
  // 老配置 library: 'AlilcLowcodeMaterials'（build.json），engineScope: '@alilc'
  library: 'AlilcLowcodeMaterials',
  entryPath: 'src/index.tsx',
  lowcodeDir: 'lowcode',
  categories: ['通用', '导航', '信息输入', '信息展示', '信息反馈', '常用'],
  npmInfo: { package: pkg.name, version: pkg.version },
  baseUrl: {
    prod: `https://alifd.alicdn.com/npm/${pkg.name}@${pkg.version}`,
    daily: `https://alifd.alicdn.com/npm/${pkg.name}@${pkg.version}`,
  },
  // 老配置的 builtinAssets：引擎运行期需要的第三方 UMD（moment/lodash/@alifd/next）
  builtinAssets: [
    {
      packages: [
        {
          package: 'moment',
          version: '2.24.0',
          urls: ['https://g.alicdn.com/mylib/moment/2.24.0/min/moment.min.js'],
          library: 'moment',
        },
        {
          package: 'lodash',
          library: '_',
          urls: ['https://g.alicdn.com/platform/c/lodash/4.6.1/lodash.min.js'],
        },
        {
          title: 'fusion组件库',
          package: '@alifd/next',
          version: '1.27.34',
          urls: [
            'https://g.alicdn.com/code/lib/alifd__next/1.27.34/next.min.css',
            'https://g.alicdn.com/code/lib/alifd__next/1.27.34/next-with-locales.min.js',
          ],
          library: 'Next',
        },
      ],
      components: [],
    },
  ],
};
