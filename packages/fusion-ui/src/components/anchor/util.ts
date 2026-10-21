import { events } from '@/utils/util';
import debounce from 'lodash/debounce';
import type { LinkItemData } from './index';

/** 监听容器：可以是任意可滚动元素（Element/HTMLElement），也可以是 window */
export type AnchorContainer = Element | HTMLElement | Window;
/** 返回监听容器的函数（未挂载时可能为 null） */
export type AnchorContainerGetter = () => AnchorContainer | null | undefined;
/** 锚点变化时的回调 */
export type AnchorChangeCallback = (htmlId: string) => void;
/** 额外参数，例如 offsetY */
export interface AnchorExternalParams {
  offsetY?: number;
}

let timeout: number | null = null;
/**
 * 用于监听当前页面到达哪一个锚点
 * @param dataSource 数据源
 * @param container 函数，返回监听容器
 * @param cb 锚点改变时触发
 * @param external 放置额外参数，例如 offsetY
 */
export const startListen = (
  dataSource: LinkItemData[],
  container: AnchorContainerGetter,
  cb: AnchorChangeCallback,
  external: AnchorExternalParams,
  doNotUpdate = false,
) => {
  if (!doNotUpdate) {
    updateNodePosition(dataSource, container, cb, external);
  }
  timeout = window.setTimeout(() => {
    setEventHandlerForContainer(dataSource, container, cb, external);
  });
};
export const setEventHandlerForContainer = (
  dataSource: LinkItemData[],
  container: AnchorContainerGetter,
  cb?: AnchorChangeCallback,
  external?: AnchorExternalParams,
) => {
  const affixContainer = container();
  if (affixContainer) {
    // 用零参箭头函数包一层：既满足 events 的 ListenerCallback 类型，
    // 又避免把 Event 对象当成 cb/external 传进 updateNodePosition。
    const handler = () => {
      updateNodePosition(dataSource, container, cb, external);
    };
    events.on(affixContainer as EventTarget, 'scroll', handler, false);
    events.on(affixContainer as EventTarget, 'resize', handler, false);
  }
};

/**
 * 解除 startListen 带来的监听功能
 */
export const removeListen = (dataSource: LinkItemData[], container: AnchorContainerGetter) => {
  if (timeout) {
    clearTimeout(timeout);
    timeout = null;
  }
  removeEventHandlerForContainer(dataSource, container);
};
const removeEventHandlerForContainer = (
  dataSource: LinkItemData[],
  container: AnchorContainerGetter,
) => {
  const affixContainer = container();
  if (affixContainer) {
    // 与 setEventHandlerForContainer 对称地用零参函数满足 ListenerCallback 类型。
    const handler = () => {
      updateNodePosition(dataSource, container);
    };
    events.off(affixContainer as EventTarget, 'scroll', handler);
    events.off(affixContainer as EventTarget, 'resize', handler);
  }
};

/**
 * 获取节点已经滚动的距离
 */
export function getScroll(node: AnchorContainer, isVertical: boolean): number {
  if (typeof window === 'undefined') {
    return 0;
  }
  const windowProp = isVertical ? 'pageYOffset' : 'pageXOffset';
  const elementProp = isVertical ? 'scrollTop' : 'scrollLeft';
  // window 上读 pageYOffset/pageXOffset，元素上读 scrollTop/scrollLeft
  if (node === window) {
    return window[windowProp as 'pageYOffset' | 'pageXOffset'];
  }
  return (node as HTMLElement)[elementProp as 'scrollTop' | 'scrollLeft'];
}

/**
 * 滚动时触发，判断所有在页面中的节点中的”第一个“，并通过 cb 返回此 htmlId
 */
export const updateNodePosition = debounce(
  (
    dataSource: LinkItemData[],
    container: AnchorContainerGetter,
    cb?: AnchorChangeCallback,
    external?: AnchorExternalParams,
  ) => {
    const { offsetY = 0 } = external || {};
    const affixContainer = container();

    if (affixContainer) {
      const containerScrollTop = getScroll(affixContainer, true); // 容器在垂直位置上的滚动 offset
      let findEl: string | undefined;
      const predicateItem = (item?: LinkItemData) => {
        const el = item?.htmlId && document.getElementById(item.htmlId);
        if (el) {
          if (el.offsetTop >= containerScrollTop + offsetY) {
            findEl = item.htmlId;
            return true;
          }
        }
        return false;
      };
      dataSource.some((item) => {
        const status = predicateItem(item);
        if (!status && Array.isArray(item.children)) {
          item.children.some((subItem) => {
            const subStatus = predicateItem(subItem);
            return subStatus;
          });
        }

        return !!findEl;
      });
      if (findEl) {
        cb && cb(findEl);
      }
    }
  },
  100,
);

/**
 * 用于在特定容器内跳转到对应的锚点位置
 * 增加 offsetY，用于跳转的偏移，防止部分元素 fixed 遮挡锚点
 */
export const jumpToNode = (htmlId: string) => {
  const el = htmlId ? document.getElementById(htmlId) : null;
  el?.scrollIntoView({ behavior: 'smooth' });
};
