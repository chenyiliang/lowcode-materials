import { withGlobal } from '@/provider';
import { ButtonGroup as PureButtonGroup } from './ButtonGroup';
import type { ButtonGroupProps } from './ButtonGroup';

export const ButtonGroup = withGlobal(PureButtonGroup, {
  i18nBundleName: 'ButtonGroup',
});
export type { ButtonGroupProps };
