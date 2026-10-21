/**
 * 物料 meta / view 入口生成器 —— 替代已删除的 `@alifd/build-plugin-lowcode`。
 *
 * 老插件做的事（src/index.js + src/templates/meta.js + src/templates/view.js）：
 *   1. glob 扫 `lowcode/**\/meta[@type].(js|ts|jsx|tsx)` 得到「参与打包的组件」清单；
 *   2. 按 handlebars 模板拼出一个 `.tmp/meta.js` 入口，逐个 import 上面的清单，
 *      补齐 `npm` 字段（package/version/exportName/subName/destructuring），
 *      再用 `generateComponentList` 按 category 分组排序；
 *   3. 交给 webpack 以 UMD 打包，挂到 `window[`${uniqueName}Meta`]`；
 *   4. 用 `templates/assets.json` 生成 `assets-{dev,daily,prod}.json` 给引擎加载。
 *
 * 本脚本只负责第 2、4 步里「不需要 webpack」的部分：把入口源码生成到 `lowcode/.entry/`，
 * 真正的打包交给同目录的 `vite.lowcode.config.ts`（Vite 库模式，ESM + UMD 双格式）。
 * 生成的入口内容与老模板逐条对齐，保证引擎侧读到的数据结构不变。
 *
 * 用法：node ../../scripts/build-lowcode-meta.mjs <pkgDir> [--meta-types default,design]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** 与老插件 src/constants.js 保持一致 */
const DEFAULT_GROUPS = ['精选组件', '原子组件'];
const DEFAULT_CATEGORIES = [
  '基础元素',
  '布局容器类',
  '表格类',
  '表单详情类',
  '帮助类',
  '对话框类',
  '业务类',
  '通用',
  '引导',
  '信息输入',
  '信息展示',
  '信息反馈',
];
const META_TYPES = ['', 'dev', 'web', 'mobile', 'design', 'sketch'];

/** 与老插件 src/utils/index.js 保持一致 */
function parseNpmName(npmName) {
  if (typeof npmName !== 'string') throw new TypeError('Expected a string');
  const matched =
    npmName.charAt(0) === '@' ? /(@[^/]+)\/(.+)/g.exec(npmName) : [npmName, '', npmName];
  if (!matched) throw new Error(`[parse-package-name] "${npmName}" is not a valid string`);
  const scope = matched[1];
  const name = (matched[2] || '').replace(/\s+/g, '').replace(/[-_]+([^-_])/g, (_0, $1) => $1.toUpperCase());
  const uniqueName =
    (matched[1]
      ? matched[1].charAt(1).toUpperCase() +
        matched[1].slice(2).replace(/[-_]+([^-_])/g, (_0, $1) => $1.toUpperCase())
      : '') +
    name.charAt(0).toUpperCase() +
    name.slice(1);
  return { scope, name, uniqueName };
}

const camel2Kebab = (camel) =>
  camel.replace(/[A-Z]/g, (item) => `-${item.toLowerCase()}`).replace(/^-/, '');
const kebab2Camel = (kebab) => {
  const camel = kebab.charAt(0).toUpperCase() + kebab.substr(1);
  return camel.replace(/-([a-z])/g, (_0, item) => item.toUpperCase());
};

/** 递归 glob（只扫 lowcode 目录，规模小，无需依赖 glob 包） */
function findMetaFiles(lowcodeDir, metaFilename) {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
        walk(full);
      } else {
        const base = entry.name.replace(/\.(js|ts|jsx|tsx)$/, '');
        const ext = path.extname(entry.name);
        if (base === metaFilename && ['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
          out.push(full);
        }
      }
    }
  };
  if (fs.existsSync(lowcodeDir)) walk(lowcodeDir);
  return out.sort();
}

/** 与老插件 getUsedComponentMetas 一致：目录名 → 组件名（kebab → camel），保留 `.` 分隔 */
function componentNamesFrom(metaFiles, lowcodeDir) {
  return metaFiles.map((f) => {
    const rel = path.relative(lowcodeDir, path.dirname(f));
    return kebab2Camel(rel.split(path.sep).join('-'));
  });
}

/** meta 入口：对齐 templates/meta.js（去掉 window 挂载，改为标准 ESM 导出 + UMD 全局） */
function renderMetaEntry({ metaFiles, categories, npmInfo, packageName, version, lowcodeDir, entryDir }) {
  const imports = [];
  const identifiers = [];

  for (const { componentName, file } of metaFiles) {
    const ident = componentName.includes('.')
      ? `${componentName.replace(/\./g, '')}Meta`
      : `${componentName}Meta`;
    // 入口文件在 lowcode/.entry/ 下，meta 在 lowcode/<dir>/，所以相对路径要上跳一级
    let spec = path.relative(entryDir, file).replace(/\\/g, '/').replace(/\.(ts|tsx|js|jsx)$/, '');
    if (!spec.startsWith('.')) spec = `./${spec}`;
    imports.push(`import ${ident} from '${spec}';`);
    identifiers.push(ident);
  }

  return `// 该文件由 scripts/build-lowcode-meta.mjs 自动生成，请勿手工修改。
// 作用等价于老 @alifd/build-plugin-lowcode 的 .tmp/meta.js 入口。
${imports.join('\n')}

const componentCategorySort = {};
${JSON.stringify(categories)}
  .reverse()
  .forEach((item, index) => {
    componentCategorySort[item] = ++index;
  });

function generateComponentList(components) {
  const componentList = [
    { title: '常用', icon: '', children: [] },
    { title: '容器', icon: '', children: [] },
    { title: '导航', icon: '', children: [] },
    { title: '内容', icon: '', children: [] },
    { title: 'Feedback 反馈', icon: '', children: [] },
  ];

  const groupMap = { 原子组件: true };
  const compGroup = {};

  components.forEach((comp) => {
    const category = comp.category || '其他';
    if (comp.group && !compGroup[comp.componentName]) {
      compGroup[comp.componentName] = comp.group;
    }
    if (comp.group && !groupMap[comp.group]) {
      groupMap[comp.group] = true;
    }
    let target = componentList.find((item) => item.title === category);
    if (!target) {
      target = { title: category, icon: '', children: [] };
      componentList.push(target);
    }
    if (comp.snippets && comp.snippets.length) {
      target.children.push({
        componentName: comp.componentName,
        title: comp.title || comp.componentName,
        sort: {
          category: target.title,
          group: compGroup[comp.componentName] || '原子组件',
          priority: componentCategorySort[target.title] || 0,
        },
        icon: '',
        package: comp.npm.pkg,
        snippets: comp.snippets || [],
      });
    }
  });
  return componentList;
}

function fillRealVersion(meta, packageName = ${JSON.stringify(packageName)}, version = ${JSON.stringify(version)}, basicLibraryVersion = {}) {
  if (!meta || !version) return meta;
  const { npm } = meta;
  if (!npm) return meta;
  if (typeof basicLibraryVersion === 'object' && basicLibraryVersion[npm.package]) {
    meta.npm = { ...npm, version: basicLibraryVersion[npm.package] };
  } else if (npm.package === packageName) {
    meta.npm = { ...npm, version };
  }
  return meta;
}

const componentMetas = [${identifiers.join(', ')}];
const components = [];
const npmInfo = ${JSON.stringify(npmInfo)};

componentMetas.forEach((meta) => {
  // 兼容三种形态：数组、{ components: [] }、单个 meta 对象
  const list = Array.isArray(meta)
    ? meta
    : meta && meta.components
      ? meta.components
      : [meta];

  list.forEach((item) => {
    if (!item) return;
    if (!item.npm) {
      const { componentName } = item;
      const names = String(componentName).split('.');
      const [exportName, subName] = names;
      item.npm = {
        exportName,
        main: '',
        destructuring: true,
        subName: names.length > 1 ? componentName.slice(componentName.indexOf('.') + 1) : subName,
      };
    }
    item.npm = { ...npmInfo, ...(item.npm || {}) };
    components.push(fillRealVersion(item));
  });
});

const componentList = generateComponentList(components);

// 只保留具名导出，与老插件 UMD 产物（window[metaExportName] = { components, componentList }）一致
export { components, componentList };
`;
}

/** view 入口：对齐 templates/view.js */
function renderViewEntry({ viewComponentNames, library, entryPath, srcEntry, entryDir, lowcodeDir, styleEntry }) {
  const imports = [];
  const exports = [];
  for (const raw of viewComponentNames) {
    const dirName = camel2Kebab(raw);
    const absView = path.join(lowcodeDir, dirName, 'view');
    const resolved = ['.tsx', '.ts', '.jsx', '.js'].map((e) => absView + e).find((p) => fs.existsSync(p));
    if (!resolved) continue;
    const ident = raw.includes('.') ? raw.replace(/\./g, '') : raw;
    let spec = path.relative(entryDir, resolved).replace(/\\/g, '/').replace(/\.(tsx?|jsx?)$/, '');
    if (!spec.startsWith('.')) spec = `./${spec}`;
    imports.push(`import ${ident}View from '${spec}';`);
    exports.push(`  ${JSON.stringify(raw)}: getRealComponent(${ident}View, ${JSON.stringify(raw)}),`);
  }

  const styleImport = styleEntry
    ? `import '${path.relative(entryDir, path.resolve(lowcodeDir, '..', styleEntry)).replace(/\\/g, '/')}';`
    : '';

  return `// 该文件由 scripts/build-lowcode-meta.mjs 自动生成，请勿手工修改。
// 作用等价于老 @alifd/build-plugin-lowcode 的 .tmp/view.js 入口。
import * as componentInstances from ${JSON.stringify(srcEntry)};
${styleImport}
${imports.join('\n')}

function getRealComponent(component, componentName) {
  if (component.default) return component.default;
  if (component[componentName]) return component[componentName];
  return component;
}

export * from ${JSON.stringify(srcEntry)};

const coveredComponents = {
${exports.join('\n')}
};

// 老插件 view.js：window[library] = Object.assign({__esModule:true}, componentInstances, coveredComponents)
// UMD 产物把具名导出挂到 window[library]，这里用具名导出对齐；view 默认导出合并对象。
export { componentInstances, coveredComponents };
`;
}

export async function buildLowcodeEntry(pkgDirAbs, opts = {}) {
  const pkgDir = path.resolve(pkgDirAbs);
  const pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
  const { name: packageName, version } = pkg;
  const { uniqueName } = parseNpmName(packageName);
  const metaExportName = `${uniqueName}Meta`;

  const lowcodeDir = path.join(pkgDir, opts.lowcodeDir || 'lowcode');
  const entryDir = path.join(lowcodeDir, '.entry');
  fs.mkdirSync(entryDir, { recursive: true });

  const categories = opts.categories || DEFAULT_CATEGORIES;
  const groups = opts.groups || DEFAULT_GROUPS;
  const npmInfo = opts.npmInfo || { package: packageName, version };
  const library = opts.library || `${uniqueName}`;

  if (!fs.existsSync(lowcodeDir)) {
    console.log(`[build-lowcode-meta] ${packageName}: 没有 lowcode 目录，跳过`);
    return null;
  }

  // 确认实际存在哪些 meta 类型（与老插件 confirmMetaTypes 一致）
  const availableMetaTypes = META_TYPES.filter(
    (t) => findMetaFiles(lowcodeDir, t ? `meta.${t}` : 'meta').length > 0,
  );

  const generated = [];

  for (const metaType of availableMetaTypes) {
    const metaFilename = metaType ? `meta.${metaType}` : 'meta';
    // 老插件的 fullbackMeta：对每个组件目录，优先用 meta.<type>，缺失时回退到 meta，
    // 两者都没有才跳过。这样 meta.design 里也会包含所有仅有 meta 的组件（用默认 meta 兜底）。
    const typedByDir = new Map(findMetaFiles(lowcodeDir, metaFilename).map((f) => [path.dirname(f), f]));
    const fallbackByDir = metaType
      ? new Map(findMetaFiles(lowcodeDir, 'meta').map((f) => [path.dirname(f), f]))
      : new Map();
    const allDirs = new Set([...typedByDir.keys(), ...fallbackByDir.keys()]);

    const metaFiles = [];
    for (const dir of allDirs) {
      const file = typedByDir.get(dir) || fallbackByDir.get(dir);
      if (!file) continue;
      const componentName = kebab2Camel(path.relative(lowcodeDir, dir).split(path.sep).join('-'));
      metaFiles.push({ file, componentName });
    }
    metaFiles.sort((a, b) => a.componentName.localeCompare(b.componentName));

    const entryName = metaType ? `meta.${metaType}` : 'meta';
    const entryFile = path.join(entryDir, `${entryName}.ts`);
    fs.writeFileSync(
      entryFile,
      renderMetaEntry({
        metaFiles,
        metaFilename,
        categories,
        npmInfo,
        packageName,
        version,
        metaExportName,
        lowcodeDir,
        entryDir,
      }),
      'utf8',
    );
    generated.push({ kind: 'meta', metaType, entryFile, count: metaFiles.length });
  }

  // view 入口。老插件**总是**生成 view（即使没有任何 view.tsx 覆盖组件，也会 re-export
  // src/index 并把 window[library] 指向组件实例集合），所以这里也无条件生成。
  const viewFiles = findMetaFiles(lowcodeDir, 'view');
  const viewComponentNames = componentNamesFrom(viewFiles, lowcodeDir);

  // 解析 src 入口真实扩展名（index.tsx / index.ts / index.jsx / index.js）
  const entryPathOpt = opts.entryPath || 'src/index.tsx';
  const resolvedEntryPath = ['.tsx', '.ts', '.jsx', '.js']
    .map((ext) => {
      const base = entryPathOpt.replace(/\.(tsx?|jsx?)$/, '');
      return path.join(pkgDir, base + ext);
    })
    .find((p) => fs.existsSync(p));
  if (!resolvedEntryPath) {
    throw new Error(`[build-lowcode-meta] 找不到 src 入口：${entryPathOpt}（包 ${packageName}）`);
  }

  const srcEntryRel = path.relative(entryDir, resolvedEntryPath).replace(/\\/g, '/');
  const viewEntryFile = path.join(entryDir, 'view.tsx');
  fs.writeFileSync(
    viewEntryFile,
    renderViewEntry({
      viewComponentNames,
      library,
      entryPath: entryPathOpt,
      srcEntry: srcEntryRel.startsWith('.') ? srcEntryRel : `./${srcEntryRel}`,
      entryDir,
      lowcodeDir,
      styleEntry: opts.styleEntry || null,
    }),
    'utf8',
  );
  generated.push({ kind: 'view', entryFile: viewEntryFile, count: viewFiles.length });

  // assets.json（对齐 templates/assets.json）
  // 只登记「实际生成了入口」的 meta 类型，避免引擎去加载不存在的 meta.design.js
  const assetsMetaTypes = generated
    .filter((g) => g.kind === 'meta')
    .map((g) => g.metaType || 'default');

  // baseUrl 既可为字符串，也可为老 build.lowcode.js 的 { prod, daily } 对象（按环境取）
  const defaultBaseUrl = `https://alifd.alicdn.com/npm/${packageName}@${version}`;
  const resolveBaseUrl = (env) => {
    const b = opts.baseUrl;
    if (!b) return defaultBaseUrl;
    if (typeof b === 'string') return b;
    return b[env] || b.prod || b.daily || defaultBaseUrl;
  };
  const assetsDir = path.join(pkgDir, opts.assetsOutDir || 'dist/lowcode');
  fs.mkdirSync(assetsDir, { recursive: true });
  for (const env of ['dev', 'daily', 'prod']) {
    const baseUrl = resolveBaseUrl(env);
    const metaUrls = {};
    const advancedMetaUrls = {};
    let metaUrl = null;
    for (const t of assetsMetaTypes) {
      const isDefault = t === 'default';
      const url = `${baseUrl}/dist/lowcode/${isDefault ? 'meta' : `meta.${t}`}.js`;
      if (!metaUrl) metaUrl = url;
      metaUrls[t] = url;
      advancedMetaUrls[t] = [url];
    }
    const urls = opts.renderUrls || [
      `${baseUrl}/dist/lowcode/view.js`,
      `${baseUrl}/dist/lowcode/view.css`,
    ];
    const assets = {
      packages: [
        {
          package: packageName,
          version,
          library,
          urls,
          editUrls: opts.editUrls || urls,
          advancedUrls: { default: urls },
          advancedEditUrls: { default: opts.editUrls || urls },
        },
      ],
      components: [
        {
          exportName: metaExportName,
          npm: { package: packageName, version },
          url: metaUrl,
          urls: metaUrls,
          advancedUrls: advancedMetaUrls,
        },
      ],
      sort: { groupList: groups, categoryList: categories },
      groupList: groups,
      ignoreComponents: opts.ignoreComponents || {},
    };
    // builtinAssets 里的第三方 UMD（moment/lodash/antd/next…）合并进 packages，
    // 与老插件 bundleAssets 的 mergeWith 行为一致（按 package 名去重）
    if (Array.isArray(opts.builtinAssets)) {
      const merged = [...assets.packages];
      for (const bundle of opts.builtinAssets) {
        for (const p of bundle.packages || []) {
          if (!merged.some((m) => m.package === p.package)) merged.push(p);
        }
      }
      assets.packages = merged;
    }
    fs.writeFileSync(path.join(assetsDir, `assets-${env}.json`), JSON.stringify(assets, null, 2), 'utf8');
  }

  console.log(
    `[build-lowcode-meta] ${packageName}: 生成 ${generated.length} 个入口 ` +
      `(${generated.map((g) => `${g.kind}:${g.metaType || ''}×${g.count}`).join(', ')})`,
  );

  return { metaExportName, library, generated, entryDir, uniqueName, availableMetaTypes, hasView: !!viewEntryFile };
}

// CLI
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const pkgDir = process.argv[2];
  if (!pkgDir) {
    console.error('用法: node build-lowcode-meta.mjs <pkgDir>');
    process.exit(1);
  }
  const configFile = path.join(path.resolve(pkgDir), 'lowcode.config.mjs');
  let opts = {};
  if (fs.existsSync(configFile)) {
    opts = (await import(pathToFileURL(configFile).href)).default || {};
  }
  await buildLowcodeEntry(path.resolve(pkgDir), opts);
}
