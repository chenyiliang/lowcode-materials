import { withGlobal } from '@/provider';
import { Menu as PureMenu } from './Menu';

export const Menu = withGlobal(PureMenu, {
  i18nBundleName: 'Menu',
});
export type { MenuProps, MenuItemProps } from './Menu';
