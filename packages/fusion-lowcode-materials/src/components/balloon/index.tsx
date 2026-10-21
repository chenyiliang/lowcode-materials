import type { ReactNode } from 'react';
import { Balloon } from '@alifd/next';

const { Tooltip } = Balloon;

interface BalloonWrapperProps {
  __designMode?: string;
  defaultVisible?: boolean;
  visible?: boolean;
  mode?: string;
  children?: ReactNode;
  [key: string]: unknown;
}

export default (props: BalloonWrapperProps = {}) => {
  const { __designMode, defaultVisible, visible, mode, children, ...otherProps } = props || {};
  console.log('props: ', props);
  const RealComponent = mode === 'Tooltip' ? Tooltip : Balloon;
  const finalValue = __designMode === 'design' ? defaultVisible : visible;
  const finalProps: Record<string, unknown> = { ...otherProps };
  if (typeof finalValue !== 'undefined') {
    finalProps.visible = finalValue;
  }
  if (typeof defaultVisible !== 'undefined') {
    finalProps.defaultVisible = defaultVisible;
  }

  return <RealComponent {...finalProps}>{children}</RealComponent>;
};
