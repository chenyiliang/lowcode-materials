import React, { CSSProperties, forwardRef } from 'react';
import type { ReactNode } from 'react';

interface DivProps {
  className?: string;
  style?: CSSProperties;
  // @types/react 19 起 React.FC / 函数组件不再隐式包含 children，需显式声明
  children?: ReactNode;
}

const Div = forwardRef<HTMLDivElement, DivProps>((props, ref) => {
  const { className, style, children } = props;
  return (
    <div className={className} style={style} ref={ref}>
      {children}
    </div>
  );
});

Div.displayName = 'Div';

export default Div;