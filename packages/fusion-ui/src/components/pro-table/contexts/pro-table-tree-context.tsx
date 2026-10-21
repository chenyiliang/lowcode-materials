import * as React from 'react';

/**
 * ProTable 树形表格单元格上下文。
 *
 * 背景（React 19 适配）：老实现里 ProTableTreeCell 通过 legacy context
 * （`static contextTypes = { openTreeRowKeys, indent, onTreeNodeClick, isTree, rowSelection }`）
 * 从 @alifd/next 的 TreeTable 拿这些值 —— 但 next 是用 legacy `getChildContext` 提供的，
 * 而 React 19 已经**移除**了 legacy context（getChildContext/contextTypes 不再生效，
 * this.context 恒为 undefined）。因此树形展开箭头/点击逻辑在 React 19 下会失效。
 *
 * 迁移方案：改用 `React.createContext`，由我们自己控制的 ProTableBase 提供这些值
 * （展开状态、缩进、点击回调等），ProTableTreeCell 通过 `static contextType` 消费。
 * 不再依赖 next 的 legacy childContext。
 */
export interface ProTableTreeContextValue {
  /** 当前展开的行 key 列表 */
  openTreeRowKeys: string[];
  /** 树形缩进像素 */
  indent: number;
  /** 是否树形表格 */
  isTree?: boolean;
  /** 行选择配置（用于计算功能列偏移） */
  rowSelection?: unknown;
  /** 点击树节点展开/收起 */
  onTreeNodeClick?: (record: any) => void;
}

export const ProTableTreeContext = React.createContext<ProTableTreeContextValue>({
  openTreeRowKeys: [],
  indent: 20,
});
