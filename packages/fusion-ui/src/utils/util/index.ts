// React 19 + Vite 迁移说明：
// 这个目录原本内联了一份 @alifd/next 的 util 拷贝（dom/object/func/events/keycode/...
// 共 16 个 .js 文件），它们是 babel-6 时代的 CommonJS 产物，`require('babel-runtime/...')`
// 依赖的 babel-runtime 在当前依赖树里已不存在；而且在包 `"type": "module"` + Vite 下，
// `exports.* / require()` 这种 CJS 写法根本无法作为 ESM 运行。
//
// 由于这份拷贝与 @alifd/next 自带的 util 完全同源（逐函数比对一致），这里不再维护本地副本，
// 直接重新导出 @alifd/next 的 util —— 它是本包既有的硬依赖，且提供了标准 ESM + .d.ts。
// 消费方只用到了 func / obj / KEYCODE / events / pickAttrs，全部包含在内。
export {
  dom,
  env,
  events,
  func,
  log,
  obj,
  str,
  support,
  focus,
  guid,
  KEYCODE,
  htmlId,
  datejs,
  pickAttrs,
} from '@alifd/next/lib/util';
