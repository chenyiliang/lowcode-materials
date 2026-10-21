import * as React from 'react';

import { VerAnchor } from './components/VerAnchor';
import { HozAnchor } from './components/HozAnchor';
import { AffixProps as NextAffixProps } from '@alifd/next/types/affix';

export interface LinkItemData {
  // 跳转的 htmlId
  htmlId: string;
  // 链接文案
  label: string;
  /**
   * 嵌套层级
   * 仅在 direction="ver" 生效，且最大层级不超过二级
   */
  children?: LinkItemData[];
}

export interface AnchorProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /**
   * 自定义样式名
   */
  className?: string;
  /**
   * 自定义样式
   */
  style?: React.CSSProperties;
  /**
   * 锚点方向
   * 水平方向 dataSource 不支持属性
   */
  direction?: 'ver' | 'hoz';
  /**
   * 锚点列表数据源
   */
  dataSource: LinkItemData[];
  /**
   * 设置是否为财鲸页面的锚点
   * 设置后会修改 container 为 () => document.querySelector('#fusion-ui-page > div.fusion-ui-page-content-wrapper');
   */
  isWhalePageAnchor?: boolean;
  /**
   * 容器，默认是 window
   */
  // 修正：原类型写的是 React.ReactElement（虚拟元素），但实现里 getScrollElement 返回的是
  // 真实 DOM Element，且找不到可滚动元素时回退为 window。按真实返回类型声明为 Element | Window。
  container?: () => Element | Window;
  /**
   * direction="hoz" 生效
   * 开启可在滚动超出屏幕后固定在屏幕
   */
  hasAffix?: boolean;
  /**
   * hasAffix={true} 后使用
   * 用于覆盖 Affix 的属性值
   */
  affixProps?: NextAffixProps;
  /**
   * 点击不同锚点时的自定义触发函数
   * 默认跳转到对应 htmlId 节点
   * 可返回布尔值，如返回 false，则阻止默认跳转操作
   */
  onChange?: (htmlId: string) => boolean;
  /**
   * 垂直跳转偏移量
   */
  offsetY?: number;
  /**
   * [方向垂直可用]
   * 用于设定悬浮锚点的菜单是否默认展开
   * @default true
   */
  defaultVisible?: boolean;
  /**
   * 自定义滚动到页首的方法
   */
  scrollTop?: () => void;

  containerRef?: any;
}

function getScrollElement(element: HTMLElement | null): HTMLElement | null {
  if (!element) return element;
  if (elementCanScroll(element)) {
    return element;
  }
  return getScrollElement(element.parentElement);
}

function elementCanScroll(element: any) {
  if (!element || !(element instanceof HTMLElement)) {
    console.log('invalid element');
    return false;
  }
  if (element.scrollTop > 0) {
    return true;
  } else {
    element.scrollTop++;
    const top = element.scrollTop;
    top && (element.scrollTop = 0);
    return top > 0;
  }
}

export class Anchor extends React.Component<AnchorProps> {
  static displayName = 'Anchor';
  static defaultProps = {
    direction: 'ver',
    isWhalePageAnchor: false,
    offsetY: 0,
    scrollTop: () => {
      const container =
        getScrollElement(document.querySelector('[class^="fusion-ui-anchor"]')) ||
        document.documentElement;
      if (container) {
        container.scrollIntoView({ behavior: 'smooth' });
      }
    },
  };

  // React 19 要求 createRef 传类型参数
  ref = React.createRef<HTMLElement>();

  render() {
    const { direction, isWhalePageAnchor, ...otherProps } = this.props;

    otherProps.container = otherProps.container
      ? otherProps.container
      : () => {
          const scrollElement = getScrollElement(
            this.ref?.current ?? (document.querySelector('[class^="fusion-ui-anchor"]') as HTMLElement | null),
          );
          // 找不到可滚动元素（或就是文档根）时回退为 window，与 Affix container 契约一致
          let container: Element | Window = scrollElement ?? document.documentElement;
          if (!container || container === document.documentElement) {
            container = window;
          }
          return container;
        };

    if (direction === 'hoz') {
      return <HozAnchor containerRef={this.ref} {...otherProps} />;
    }

    return <VerAnchor containerRef={this.ref} {...otherProps} />;
  }
}
