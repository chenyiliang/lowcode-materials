/**
 * 一次性 codemod：把 packages/<pkg>/lowcode 下物料 meta 里的老 lowcode 类型写法迁到当前
 * `@alilc/lowcode-types`（workspace 本地包）的导出名。
 *
 * 两处不兼容：
 *
 * 1. 包名 `@ali/lowcode-types` 是内网老 scope，npm / workspace 里都不存在，
 *    统一改成对外的 `@alilc/lowcode-types`。
 *
 * 2. 引擎 1.0 之后所有对外类型都加了 `IPublicType*` 前缀，老名字
 *    （ComponentMetadata / Snippet / FieldConfig / ...）已被删除。
 *    本脚本按固定映射表逐个改名，同时改写 import 语句里的名字。
 *
 * 另外 `@alilc/lowcode-engine` 只 re-export 了 IPublicTypeNodeSchema 一个类型
 * （见 lowcode-engine/packages/engine/src/modules/lowcode-types.ts），
 * 从它那里 import 其它类型名是拿不到的，所以把「纯类型 import」重定向到
 * `@alilc/lowcode-types`；runtime 值（如 `material`）保持从 engine import。
 *
 * 只在非注释行做替换，避免把注释里的说明文字改乱。
 * 幂等。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const packagesDir = path.join(repoRoot, 'packages');

/** 老类型名 → 当前 @alilc/lowcode-types 导出名 */
const TYPE_RENAMES = {
  ComponentMetadata: 'IPublicTypeComponentMetadata',
  TransformedComponentMetadata: 'IPublicTypeTransformedComponentMetadata',
  Snippet: 'IPublicTypeSnippet',
  FieldConfig: 'IPublicTypeFieldConfig',
  PropConfig: 'IPublicTypePropConfig',
  PropType: 'IPublicTypePropType',
  SetterType: 'IPublicTypeSetterType',
  OneOf: 'IPublicTypeOneOf',
  ObjectOf: 'IPublicTypeObjectOf',
  ArrayOf: 'IPublicTypeArrayOf',
};

/** 只从 types 包重定向：engine 不 re-export 这些 */
const TYPE_ONLY_SOURCE_FIX = '@alilc/lowcode-types';

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

const isCommentLine = (line) => /^\s*(\/\/|\/\*|\*)/.test(line);

let changed = 0;
const report = [];

for (const pkg of fs.readdirSync(packagesDir)) {
  const lowcodeDir = path.join(packagesDir, pkg, 'lowcode');
  if (!fs.existsSync(lowcodeDir)) continue;

  for (const file of collect(lowcodeDir)) {
    const original = fs.readFileSync(file, 'utf8');
    const lines = original.split('\n');
    let touched = false;

    // 1. 包名 scope 修正（import 行内）
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('@ali/lowcode-types')) {
        lines[i] = lines[i].split('@ali/lowcode-types').join('@alilc/lowcode-types');
        touched = true;
      }
    }

    // 2. 类型改名（跳过注释行）
    for (let i = 0; i < lines.length; i++) {
      if (isCommentLine(lines[i])) continue;
      for (const [oldName, newName] of Object.entries(TYPE_RENAMES)) {
        const re = new RegExp(`\\b${oldName}\\b`, 'g');
        if (re.test(lines[i])) {
          lines[i] = lines[i].replace(re, newName);
          touched = true;
        }
      }
    }

    // 3. 把「只 import 类型」的 engine import 重定向到 types 包
    const renamedTargets = new Set(Object.values(TYPE_RENAMES));
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^\s*import\s+(type\s+)?\{([^}]*)\}\s+from\s+['"]@alilc\/lowcode-engine['"]/);
      if (!m) continue;
      const names = m[2].split(',').map((s) => s.replace(/\btype\s+/, '').trim()).filter(Boolean);
      const allTypes = names.length > 0 && names.every((n) => renamedTargets.has(n) || n.startsWith('IPublicType'));
      if (allTypes) {
        lines[i] = lines[i].replace(/(['"])@alilc\/lowcode-engine\1/, `'${TYPE_ONLY_SOURCE_FIX}'`);
        touched = true;
      }
    }

    const code = lines.join('\n');
    if (code !== original) {
      fs.writeFileSync(file, code, 'utf8');
      changed++;
      report.push(path.relative(repoRoot, file));
    }
  }
}

console.log(`codemod-lowcode-types: ${changed} file(s) rewritten`);
for (const line of report) console.log(`  ${line}`);
