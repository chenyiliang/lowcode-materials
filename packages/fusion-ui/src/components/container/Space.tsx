import React from 'react';
import { Divider, Box } from '@alifd/next';
import { BoxProps } from '@alifd/next/types/box';

type Direction = 'ver' | 'hoz' | 'hoz-reverse';
export interface SpaceProps extends Omit<BoxProps, 'direction'> {
  /**
   * 子元素是否需要分割线
   */
  split?: boolean;
  /**
   * 子元素摆放方向
   */
  direction?: Direction;
}
// Box 组件本身的 `direction` api value 不符合语意规范
const directionMap = {
  ver: 'column',
  hoz: 'row',
  'hoz-reverse': 'row-reverse',
};
class Space extends React.Component<SpaceProps> {
  static displayName = 'Space';
  // React 19 移除了 propTypes，Space 的属性类型由 SpaceProps 描述。
  // defaultProps 对类组件在 React 19 仍生效，保留。
  // Box 的 defaultProps 在 .d.ts 里未声明（运行期可能存在），这里按可选读取后展开。
  static defaultProps = {
    ...((Box as { defaultProps?: Partial<BoxProps> }).defaultProps ?? {}),
    spacing: 8,
    direction: 'hoz' as Direction,
    split: false,
  };
  /**
   * 在子元素之间插入分隔符
   * @param {ReactNode} children Space组件子元素
   * @param {string} direction divider 方向
   * @returns React.Children
   */
  insertDividerIntoChildren = (children: React.ReactNode, direction: Direction) => {
    const withDividerChildren: React.ReactNode[] = [];
    const originalChildren = React.Children.toArray(children);
    originalChildren.forEach((item, index) => {
      withDividerChildren.push(item);
      if (index !== originalChildren.length - 1) {
        withDividerChildren.push(
          // Divider direction 跟 space 的 direction 是相反的
          <Divider
            key={index}
            direction={direction === 'ver' ? 'hoz' : 'ver'}
            style={{ opacity: 0.5, top: 0 }}
          />,
        );
      }
    });
    return withDividerChildren;
  };
  render() {
    const { split, direction = 'hoz', align, children, ...others } = this.props;
    return (
      <Box
        data-name="Space"
        {...others}
        align={align || (direction === 'ver' ? 'start' : 'center')}
        direction={directionMap[direction] as 'row' | 'column' | 'row-reverse'}
      >
        {split ? this.insertDividerIntoChildren(children, direction) : children}
      </Box>
    );
  }
}

export { Space };
