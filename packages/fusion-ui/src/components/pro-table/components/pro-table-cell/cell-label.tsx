import * as React from 'react';
// import { Ellipsis } from '@/ellipsis';
import { Balloon } from '@alifd/next';
// import { ColorType } from '@/types';
import classnames from 'classnames';
import { statusTypes } from '@/types/enum';

const { Tooltip } = Balloon;

export interface CellLabelProps extends React.HTMLProps<HTMLDivElement> {
  toolTipMode?: 'always' | 'ellipsis' | 'none';
  // color?: ColorType;
}
export const CellLabel: React.FC<CellLabelProps> = ({
  toolTipMode = 'none',
  color,
  children,
  className,
  style,
  ...props
}) => {
  const isStatusColor = statusTypes.includes(color as any);
  return (
    <div
      {...props}
      className={classnames(className, {
        [`cell-label-${color}`]: isStatusColor,
      })}
      style={{
        color: isStatusColor ? undefined : color,
        ...style,
        display: 'inline',
      }}
    >
      <CellToolTip toolTipMode={toolTipMode}>{children}</CellToolTip>
    </div>
  );
};

export interface CellToolTipProps {
  toolTipMode?: 'always' | 'ellipsis' | 'none';
  onClick?: () => void;
  // @types/react 19 起 React.FC 不再隐式包含 children，需显式声明
  children?: React.ReactNode;
}
const CellToolTip: React.FC<CellToolTipProps> = ({ toolTipMode, children }) => {
  // if (toolTipMode === 'ellipsis') {
  //   return <Ellipsis>{children}</Ellipsis>;
  // }
  if (toolTipMode === 'always') {
    return (
      // Tooltip 的 trigger 只接受 ReactElement/string，children 是更宽的 ReactNode，
      // 用 Fragment 包一层（Fragment 本身是 ReactElement），渲染结果不变。
      <Tooltip trigger={<>{children}</>}>
        <>{children}</>
      </Tooltip>
    );
  }
  return <>{children}</>;
};
