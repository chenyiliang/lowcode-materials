/**
 * 一次性 codemod：把 packages/<pkg>/lowcode 下物料 meta 里的 CommonJS 写法改成 ESM。
 *
 * 背景：老 `@alifd/build-plugin-lowcode` 用 webpack + babel 打包 lowcode/meta.js 入口，
 * 允许 `module.exports` / `require()`。迁到 Vite 库模式后，meta 入口由各包
 * `scripts/build-lowcode-meta.mjs` 生成、再由 Vite 打包，产物是 ESM/CJS 双格式，
 * 源文件里的 `module.exports` / `require()` 在 ESM 语境下不合法（`isolatedModules`），
 * 必须先转成 `export default` / `import`。
 *
 * 处理的三种形态（实测覆盖 lowcode 目录里 100% 的 CJS 用法）：
 *   1. 行首 `module.exports = {` / `module.exports = [`  →  `export default {` / `[`
 *   2. `require('./xxx')`（JS 模块，如 ./snippets）        →  顶部 `import __reqN__ from './xxx'`
 *   3. `require('./xxx.png')`（静态资源）                  →  顶部 `import __reqN__ from './xxx.png'`
 *      Vite 原生支持 import 图片，产物里得到 URL 字符串，语义与 webpack 的 require 一致。
 *
 * 幂等：已经是 ESM 的文件不会被重复改写。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const packagesDir = path.join(repoRoot, 'packages');

/** 递归收集 .ts/.tsx 文件 */
function collect(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      collect(full, out);
    } else if (/\.(m?tsx?|jsx?)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

let changed = 0;
const report = [];

for (const pkg of fs.readdirSync(packagesDir)) {
  const lowcodeDir = path.join(packagesDir, pkg, 'lowcode');
  if (!fs.existsSync(lowcodeDir)) continue;

  for (const file of collect(lowcodeDir)) {
    const original = fs.readFileSync(file, 'utf8');
    let code = original;

    // 1. module.exports = ...  →  export default ...
    code = code.replace(/^module\.exports\s*=\s*/gm, 'export default ');

    // 2/3. require('...')  →  import __reqN__ from '...'
    const imports = [];
    code = code.replace(/require\((['"])([^'"]+)\1\)/g, (_m, _q, spec) => {
      const name = `__req${imports.length}__`;
      imports.push(`import ${name} from '${spec}';`);
      return name;
    });

    if (imports.length) {
      // 插到文件顶部已有 import 语句之后，否则插到最前面
      const lines = code.split('\n');
      let insertAt = 0;
      for (let i = 0; i < lines.length; i++) {
        if (/^\s*import\s/.test(lines[i])) insertAt = i + 1;
      }
      lines.splice(insertAt, 0, ...imports);
      code = lines.join('\n');
    }

    if (code !== original) {
      fs.writeFileSync(file, code, 'utf8');
      changed++;
      report.push(`${path.relative(repoRoot, file)}${imports.length ? ` (+${imports.length} import)` : ''}`);
    }
  }
}

console.log(`codemod-lowcode-esm: ${changed} file(s) rewritten`);
for (const line of report) console.log(`  ${line}`);
