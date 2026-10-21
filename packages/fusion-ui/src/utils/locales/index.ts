import ProTable from '@/components/pro-table/i18n';
import Filter from '@/components/container/i18n';
import ButtonGroup from '@/components/button-group/i18n';

export const locales = {
  ProTable,
  Filter,
  // 修复：ButtonGroup 的内置文案（more: '更多'）此前未登记，
  // 导致 useI18nBundle('ButtonGroup') 取不到文案（"更多"按钮 label 为 undefined）。
  ButtonGroup,
};
