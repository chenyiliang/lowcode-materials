/**
 * 物料 lowcode 构建驱动 —— 替代 `build-scripts build --config build.lowcode.js`。
 *
 * 两步：
 *   1. 调 build-lowcode-meta.mjs 扫 lowcode/ 生成 meta[.type] / view 入口到 lowcode/.entry/，
 *      并写出 dist/lowcode/assets-{dev,daily,prod}.json；
 *   2. 对每个入口调 Vite 的 build() API 单独打一次库（es + cjs + umd），
 *      产物落到 dist/lowcode/。
 *
 * 为什么每个入口单独 build：Vite lib 模式的 umd 格式只支持单入口 + 单一 name，
 * 而一个包可能有 meta / meta.design / view 多个入口，各自 UMD 全局名不同
 * （meta→`${uniqueName}Meta`，view→library）。
 *
 * 用法：node ../../scripts/build-lowcode.mjs <pkgDir>
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { buildLowcodeEntry } from './build-lowcode-meta.mjs';

/** UMD 全局名映射，对齐老插件 COMMON_EXTERNALS（engineScope=@alilc） */
const UMD_GLOBALS = {
  react: 'React',
  'react-dom': 'ReactDOM',
  'prop-types': 'PropTypes',
  '@alifd/next': 'Next',
  '@alifd/meet': 'Meet',
  moment: 'moment',
  lodash: '_',
  antd: 'antd',
  '@ant-design/icons': 'icons',
  '@antv/x6': 'X6',
  '@alilc/lowcode-engine': 'AliLowCodeEngine',
  '@ali/lowcode-engine': 'AliLowCodeEngine',
  '@alilc/lowcode-types': 'AliLowCodeEngine',
  '@alifd/lowcode-preset-plugin': 'Lowcode_PresetPlugin',
};

/**
 * 允许 external 的**精确**裸包名（= 画布 iframe 里确实存在的 window 全局）。
 * 只有这些会被 external 到全局；子路径（lodash/debounce）和其它库一律 bundle 进 UMD。
 * 依据：host.ts 往 iframe 注入 window.React / window.ReactDOM，simulator-env.ts 在父窗口挂
 * window.PropTypes / moment / _ / Next（物料 UMD 读这些全局）。
 */
const UMD_EXTERNAL_EXACT = new Set([
  'react',
  'react-dom',
  'prop-types',
  '@alifd/next',
  'moment',
  'lodash',
  'antd',
  '@ant-design/icons',
  '@antv/x6',
  '@alilc/lowcode-engine',
  '@ali/lowcode-engine',
  '@alilc/lowcode-types',
  '@alifd/lowcode-preset-plugin',
]);

async function buildOneEntry(pkgDir, entryAbs, { fileBaseName, umdName, hasCss }) {
  const relEntry = path.relative(pkgDir, entryAbs).split(path.sep).join('/');
  await build({
    root: pkgDir,
    logLevel: 'warn',
    configFile: false,
    // jsxRuntime: 'classic' —— 与老 @alifd/build-plugin-lowcode（webpack + babel classic）一致。
    // UMD 产物在浏览器里由引擎按 window 全局加载，只有 window.React / window.Next 等，
    // 没有 `react/jsx-runtime` 这个全局；用 automatic runtime 会让 UMD 依赖一个解析不到的
    // global["react/jsx-runtime"]。classic runtime 编成 React.createElement，只依赖 window.React。
    plugins: [react({ jsxRuntime: 'classic' })],
    // UMD 产物跑在画布 iframe 里，那里没有 Node 的 process/global。
    // 依赖链里有模块在**模块顶层**读裸 process（实测 fusion-ui view.js:43624
    // `process is not defined`，加载即崩）。编译期 define 掉，与 simulator/worker 的处理一致。
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env': JSON.stringify({ NODE_ENV: 'production' }),
      process: JSON.stringify({ env: { NODE_ENV: 'production' }, browser: true }),
      global: 'globalThis',
    },
    resolve: {
      // fusion-ui 等包的源码用 `@/...` 指向自己的 src（其主 vite.config 里有同样的 alias）。
      // 这里 configFile:false，必须显式补上，否则 UMD 里会留下解析不到的 `@/components/...`。
      // 注意 key 必须是 '@/'（带斜杠）：Vite 字符串 alias 按前缀匹配，若写成 '@'，
      // 会把 `@alifd/next`、`@antv/x6` 等 scoped 包也错误重写成 src/... 。
      alias: {
        '@/': path.resolve(pkgDir, 'src') + '/',
        // bizcharts 空桩：bizcharts@4 内嵌 React16 的 react-reconciler，模块顶层初始化读
        // React.__SECRET_INTERNALS...（React19 已改名）→ 加载即崩，并带崩整个 fusion-ui view.js。
        // fusion-ui 仅 6 个图表组件用 bizcharts，其余（ProTable/ProForm 等）与 React19 兼容。
        // 桩掉后图表渲染为空（可接受降级），换取其余 fusion-ui 组件在画布/面板可用。
        bizcharts: path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'build/bizcharts-stub.js'),
      },
    },
    build: {
      lib: {
        entry: relEntry,
        formats: ['es', 'cjs', 'umd'],
        name: umdName,
        fileName: (format) => {
          if (format === 'es') return `lowcode/${fileBaseName}.mjs`;
          if (format === 'cjs') return `lowcode/${fileBaseName}.cjs`;
          return `lowcode/${fileBaseName}.js`;
        },
      },
      rollupOptions: {
        // 只把「运行环境确实以 window 全局提供」的**精确裸包名** external；
        // 其余一律打进 UMD。原因（均实测）：
        //  - 老写法 `return true`（所有裸包 external）会把两类东西错误地 external 掉：
        //    1) `@/...` 路径别名（fusion-ui 有 57 个源文件用 `@/`，UMD 里留下解析不到的
        //       `require("@/components/...")`，浏览器一加载就崩）；
        //    2) 子路径与无全局的库（`lodash/debounce`、`@antv/data-set`、`ahooks`、`bizcharts`…），
        //       iframe 里只有 window._（整个 lodash）而没有 window["lodash/debounce"]，
        //       于是 `(0, lodash_debounce.default)` 为 undefined → TypeError。
        //  - 这些库打进 UMD 才是对的：老 webpack 版 CDN 物料就是把依赖 bundle 进去的。
        // 精确匹配（不做前缀/子路径匹配）：`lodash` external 到 window._，但 `lodash/debounce`
        // 会被 bundle，两者互不干扰。
        external: (id) => UMD_EXTERNAL_EXACT.has(id),
        output: {
          globals: (id) => UMD_GLOBALS[id] || id,
          assetFileNames: `lowcode/${fileBaseName}-assets[extname]`,
          // 被 bundle 进来的依赖里可能有「webpack 时代的 UMD 包」（实测 bizcharts@4 就是）。
          // rolldown 会把它们包进 __commonJS（提供 exports/module），于是内层 UMD 走 CJS 分支、
          // 调用 require("react") / require("react-dom") —— 但浏览器 <script> 环境没有 require，
          // 抛 `require is not defined`（Edge 实测：materials/fusion-ui/view.js:65）。
          // 老 CDN 物料没这问题，因为 webpack 把 bizcharts 也一起 bundle 且 webpack 自带 require 运行时。
          // 修法：在 UMD 最前面注入一个极简 require 垫片，把 react/react-dom 映射到 iframe 全局
          // （host.ts 注入 window.React / window.ReactDOM），让内层 UMD 的 CJS 分支能取到依赖。
          intro: `
// 被 bundle 进来的依赖里可能有 webpack 时代的 UMD（如 bizcharts 桩之前的残留路径、
// 或第三方 CJS），其 CJS 分支会 require("react"/"prop-types"/"moment"/"lodash")。
// iframe 里没有 require，映射到宿主注入的全局（host.ts 注入 React/ReactDOM，
// simulator-env.ts 注入 PropTypes/moment/_/Next）。未知模块抛错而非静默 undefined，便于定位。
var require = (typeof require === 'function') ? require : function (m) {
  // 物料 UMD 跑在画布 iframe 里：host.ts 只往 iframe 注入 React/ReactDOM，
  // PropTypes/moment/_ 在**父页面**（simulator-env.ts 挂的）。iframe 与父页同源，
  // 故逐个回退到 parent 的全局，避免 'prop-types' 等取到 undefined。
  var P = (typeof window !== 'undefined' && window.parent) || {};
  var g = {
    'react': window.React || P.React,
    'react-dom': window.ReactDOM || P.ReactDOM,
    'prop-types': window.PropTypes || P.PropTypes,
    'moment': window.moment || P.moment,
    'lodash': window._ || P._
  };
  if (m in g) return g[m];
  throw new Error('[lowcode-materials] require of unknown module in bundled UMD: ' + m);
};
`,
        },
      },
      sourcemap: true,
      minify: false,
      emptyOutDir: false,
      outDir: 'dist',
      cssCodeSplit: false,
    },
  });
  console.log(`[build-lowcode] ${path.basename(pkgDir)}: 打包 ${fileBaseName} (umd=${umdName})`);
}

async function main() {
  const pkgDirArg = process.argv[2];
  if (!pkgDirArg) {
    console.error('用法: node build-lowcode.mjs <pkgDir>');
    process.exit(1);
  }
  const pkgDir = path.resolve(pkgDirArg);

  // 读取各包自己的 lowcode.config.mjs（categories / builtinAssets / library 等）
  const configFile = path.join(pkgDir, 'lowcode.config.mjs');
  let opts = {};
  if (fs.existsSync(configFile)) {
    opts = (await import(pathToFileURL(configFile).href)).default || {};
  }

  const result = await buildLowcodeEntry(pkgDir, opts);
  if (!result) return;

  const { metaExportName, library, generated, hasView } = result;

  for (const g of generated) {
    if (g.kind === 'meta') {
      const fileBaseName = g.metaType ? `meta.${g.metaType}` : 'meta';
      await buildOneEntry(pkgDir, g.entryFile, {
        fileBaseName,
        umdName: metaExportName,
        hasCss: false,
      });
    } else if (g.kind === 'view') {
      await buildOneEntry(pkgDir, g.entryFile, {
        fileBaseName: 'view',
        umdName: library,
        hasCss: true,
      });
    }
  }

  console.log(
    `[build-lowcode] ${path.basename(pkgDir)}: 完成（meta 类型 ${result.availableMetaTypes.join(',') || 'default'}，view=${hasView ? '有' : '无'}）`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
