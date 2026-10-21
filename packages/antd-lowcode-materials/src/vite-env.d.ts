// 样式/静态资源副作用导入的环境声明。
// vite-plugin-dts 用 include: ['src'] 编译，看不到仓库根的 typings.d.ts，
// 所以在 src 下放一份，保证 dts 生成时不对 `import './x.scss'` 报 TS2882。
// shorthand ambient module（无 body）：类型为 any，纯副作用导入即满足。
declare module '*.css';
declare module '*.less';
declare module '*.scss';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.svg';
declare module '*.webp';
