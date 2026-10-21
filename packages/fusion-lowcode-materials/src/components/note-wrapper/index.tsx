import React, { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Balloon } from '@alifd/next';

const targetClass = 'render-wrapper-target';
const rootClass = 'render-wrapper-root done-note-wrapper';

interface NoteProps {
  note?: string;
  id?: string;
  children?: ReactNode;
}

/**
 * 批注容器：把批注气泡挂到被包裹子元素的真实 DOM 节点里，并给该节点打上
 * `render-wrapper-target` 样式钩子（样式见同目录 index.scss）。
 *
 * React 19 适配：
 * - 原实现用 `ReactDom.findDOMNode(innerRef)` 拿子节点 DOM —— React 19 已彻底移除
 *   `findDOMNode`，改为 cloneElement 时注入 callback ref 直接拿节点；
 * - 原实现用 `ReactDom.render(node, el)` 把气泡渲染进手工 `document.createElement` 出来的
 *   容器再 `appendChild` —— React 19 已移除 `ReactDOM.render`，改用 `createPortal`，
 *   这样气泡节点纳入 React 树，`note` 变化时自动更新，不再需要每次 render 都手动重渲；
 * - 原实现的 `el.ref = ref` 对 DOM 元素是无效赋值（DOM 上没有 ref 属性），转发给调用方的
 *   ref 实际丢失；现在与内部 callback ref 合并后一并转发。
 */
const NoteWrapper: React.ForwardRefRenderFunction<HTMLElement, NoteProps> = (props, ref) => {
  const { note, id, children } = props;
  const [container, setContainer] = useState<HTMLElement | null>(null);

  const mergedRef = useCallback(
    (node: HTMLElement | null) => {
      if (node && !node.classList.contains(targetClass)) {
        // 目标元素 position 为 static 时改成 relative，方便内层批注元素定位
        if (window.getComputedStyle(node).position === 'static') {
          node.style.position = 'relative';
        }
        node.classList.add(targetClass);
      }
      setContainer(node);

      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as { current: HTMLElement | null }).current = node;
      }
    },
    [ref],
  );

  const mapped = React.Children.map(children, (child) => {
    let node = child;
    if (typeof child === 'string') {
      node = <span>{child}</span>;
    }
    if (!React.isValidElement(node)) {
      return node;
    }
    return React.cloneElement(node as React.ReactElement<Record<string, unknown>>, {
      ref: mergedRef,
    });
  });

  const noteLayer = (
    <div className={rootClass} id={id}>
      <Balloon.Tooltip
        trigger={<div className="render-wrapper-note">N</div>}
        align="rb"
        triggerType="click"
        popupStyle={{ fontSize: '12px', lineHeight: '1.6', background: '#fff' }}
      >
        {note}
      </Balloon.Tooltip>
    </div>
  );

  return (
    <>
      {mapped ?? null}
      {container ? createPortal(noteLayer, container) : null}
    </>
  );
};

const RefNoteWrapper = React.forwardRef(NoteWrapper);

RefNoteWrapper.displayName = 'Wrapper';

export default RefNoteWrapper;
