// 物料 meta 构建配置 —— 迁移自老的 build.lowcode.js（@alifd/build-plugin-lowcode 选项）。
// 由 scripts/build-lowcode.mjs 读取。
const pkg = JSON.parse(
  await import('node:fs').then((fs) =>
    fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
  ),
);

export default {
  // 老配置：library: 'AntdLowcode'
  library: 'AntdLowcode',
  entryPath: 'src/index.tsx',
  lowcodeDir: 'lowcode',
  categories: ['通用', '导航', '信息输入', '信息展示', '信息反馈'],
  npmInfo: { package: pkg.name, version: pkg.version },
  baseUrl: {
    prod: `https://alifd.alicdn.com/npm/${pkg.name}@${pkg.version}`,
    daily: `https://alifd.alicdn.com/npm/${pkg.name}@${pkg.version}`,
  },
  // 老配置的 builtinAssets：引擎运行期需要的第三方 UMD（moment/lodash/icons/antd）
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
          package: 'iconfont-icons',
          urls: ['//at.alicdn.com/t/font_2369445_ukrtsovd92r.js'],
        },
        {
          package: '@ant-design/icons',
          version: '4.7.0',
          urls: ['//g.alicdn.com/code/npm/@ali/ant-design-icons-cdn/4.5.0/index.umd.min.js'],
          library: 'icons',
        },
        {
          package: 'antd',
          version: '4.23.0',
          urls: [
            '//g.alicdn.com/code/lib/antd/4.23.0/antd.min.js',
            '//g.alicdn.com/code/lib/antd/4.23.0/antd.min.css',
          ],
          library: 'antd',
        },
      ],
      components: [],
    },
  ],
};
