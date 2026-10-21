import React, { ReactNode, ReactElement } from 'react'

interface ColumnChildProps {
  children?: ReactNode;
  title?: ReactNode;
  align?: React.CSSProperties['textAlign'];
  [key: string]: unknown;
}

export default (children: ReactNode) => {
  const getColumns = (children: ReactNode) => {
    const columns: Record<string, unknown>[] = []
    const getCols = (children: ReactNode) => {
      React.Children.map(children, item => {
        // 只处理合法的 React 元素，非元素（字符串/null 等）跳过，避免 props 为 unknown
        if (!React.isValidElement(item)) {
          return;
        }
        const props = (item as ReactElement<ColumnChildProps>).props;
        const childNodes = props.children;
        if (Array.isArray(childNodes) && childNodes.length) {
          columns.push({
            isGroup: true,
            title: props.align ? <div style={{textAlign: props.align}}>{props.title || ''}</div> : props.title || '',
            children: getColumns(childNodes)
          })
        } else {
          columns.push({...props})
        }
      });
    }
    getCols(children)
    return columns;
  }
  return getColumns(children)
}