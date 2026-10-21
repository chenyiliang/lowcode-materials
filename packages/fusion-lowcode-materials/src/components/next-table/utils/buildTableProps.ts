import { IWebTableProps } from "../table/webTable";
import { TableProps } from '@alifd/next/types/table';
import type { ReactNode } from 'react';

export default function buildTableProps(props: IWebTableProps) {
  const {
    loading, dataSource, onSort, emptyContent: rawEmptyContent, onFilter, cellProps, rowProps,
    primaryKey, theme, hasHeader, fixedHeader, maxBodyHeight, stickyHeader, isTree, indent,
    onRowClick, onRowMouseEnter, onRowMouseLeave, onResizeChange, width, height, loadingComponent,
    hasExpandedRowCtrl, expandedRowRender, onRowOpen, expandedRowIndent, useVirtual,offsetTop, sort, sortIcons,
    showRowSelector, onSelect, onSelectAll, isRowSelectorDisabled, rowSelector, size, expandedIndexSimulate, rowSelection,
  } = props;

  // IWebTableProps.emptyContent 允许 (() => ReactNode) | ReactNode，
  // 而 TableProps.emptyContent 只接受 ReactNode，这里统一求值（与 renderEmptyContent 一致）。
  const emptyContent: ReactNode =
    typeof rawEmptyContent === 'function' ? rawEmptyContent() : rawEmptyContent;

  let tableProps: TableProps = {
    size,
    primaryKey: primaryKey || 'id',
    dataSource: dataSource || [],
    hasBorder: theme === 'border',
    hasHeader,
    isZebra: theme === 'zebra',
    loading,
    emptyContent,
    cellProps,
    rowProps,
    onFilter,
    fixedHeader,
    maxBodyHeight,
    stickyHeader,
    offsetTop,
    isTree,
    indent,
    useVirtual,
    onRowClick,
    onRowMouseEnter,
    onRowMouseLeave,
    onResizeChange,
    sort,
    sortIcons,
    onSort,
    loadingComponent,
    hasExpandedRowCtrl,
    expandedRowRender,
    onRowOpen,
    expandedRowIndent,
    style: { width, height },
    expandedIndexSimulate,
  };

  if ('openRowKeys' in props) {
    tableProps.openRowKeys = props.openRowKeys
  }

  if (showRowSelector) {
    let selection: TableProps['rowSelection'];

    if (rowSelection) {
      selection = rowSelection;

    } else {
      selection = {};

      if (onSelect) {
        selection.onSelect = onSelect;
      }

      if (onSelectAll) {
        selection.onSelectAll = onSelectAll;
      }
      selection.mode = rowSelector === 'checkboxSelector' ? 'multiple' : 'single';
      if (isRowSelectorDisabled) {
        const isRowSelectorDisabledFunc = isRowSelectorDisabled;
        selection.getProps = (rowData, index) => ({
          disabled: isRowSelectorDisabledFunc(rowData, index),
        });
      }
    }
    tableProps.rowSelection = selection;
  }

  return tableProps;
}
