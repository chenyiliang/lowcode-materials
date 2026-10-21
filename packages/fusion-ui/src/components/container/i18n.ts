export default {
  'zh-CN': {
    expand: '展开',
    hidden: '收起',
    primaryBtnText: '查询',
    secondaryBtnText: '重置',
  },
  // 修复：这里原本写成 `en`，与 LanguageType（'zh-CN' | 'en-US'）及 pro-table/i18n.ts
  // 不一致，导致英文文案永远取不到（getI18nBundleBase 按 'en-US' 索引）。统一为 'en-US'。
  'en-US': {
    expand: 'More',
    hidden: 'Hide',
    primaryBtnText: 'Query',
    secondaryBtnText: 'Reset',
  },
};
