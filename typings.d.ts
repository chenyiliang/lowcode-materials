// 样式与静态资源模块声明（Vite 环境下由 Vite 解析）。
// 用 shorthand ambient module（无 body）声明：TS 7 对「纯副作用导入」
// `import './x.scss'` 会报 TS2882 除非存在 ambient 声明，shorthand 形式即满足，
// 且与原仓库 typings.d.ts 行为一致（模块类型为 any）。
declare module '*.css';
declare module '*.less';
declare module '*.scss';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.svg';
declare module '*.webp';

// 老包从 package.json 里读 version（fusion-ui/src/index.tsx）
declare module '*/package.json' {
  export const name: string;
  export const version: string;
  const pkg: Record<string, unknown>;
  export default pkg;
}
