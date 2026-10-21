// 样式/静态资源副作用导入的环境声明（vite-plugin-dts 用 include:['src'] 编译，
// 看不到仓库根 typings.d.ts，故在 src 下放一份，避免 `import './x.scss'` 报 TS2882）。
declare module '*.css';
declare module '*.less';
declare module '*.scss';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.svg';
declare module '*.webp';
