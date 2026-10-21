import * as React from 'react';
import cns from 'classnames';
import { Table } from '@alifd/next';
import { TableProps } from '@alifd/next/types/table';
import { getColumnKey, pickTableProps } from './utils';
import { useMemo, useState } from 'react';
import { useActionColumn } from './columns/useActionColumn';
import { useIndexColumn } from './columns/useIndexColumn';
import { ProTableBaseProps } from '../../types';
import { renderColumns, useColumnsWithSetting } from '../pro-table-column';
import { useRowSelection } from './columns/useRowSelection';
import { ProTableColumnsSettingContext } from '../../contexts/pro-table-columns-setting-context';
import { ProTableSettingContext } from '@/components/pro-table/contexts/pro-table-setting-context';
import { ProTableTreeContext } from '../../contexts/pro-table-tree-context';
import { registerColumnFormatters } from '../pro-table-column/pro-table-column-formatter';
import { defaultColumnFormatters } from '../pro-table-column/defaultColumnFormatters';
import { emptyFn } from '@/utils/constants';
import { ProTableCell } from '../pro-table-cell/pro-table-cell';
import { ProTableTreeCell } from '../pro-table-cell/pro-table-tree-cell';
// import { ProTableCell } from '../pro-table-cell';

registerColumnFormatters(defaultColumnFormatters);
const totalCell = () => 'Total';
const valueCell = (val: unknown) => val;

/**
 * 树形展开逻辑（React 19 适配）。
 *
 * 原来展开状态由 @alifd/next 的 TreeTable 用 legacy getChildContext 下发，React 19
 * 已移除 legacy context，因此这里在 ProTableBase 内部自行维护 openRowKeys，
 * 复刻 next TreeTable.onTreeNodeClick 的行为（含「收起父节点时级联收起子节点」），
 * 并通过 ProTableTreeContext 传给 ProTableTreeCell。
 */
function useTreeRowKeys(props: ProTableBaseProps, dataSource: any[]) {
  const { isTree, primaryKey = 'id', openRowKeys, onRowOpen, indent = 20 } = props;
  // defaultOpenRowKeys 是 next TreeTable 运行期真实读取的 prop（props.openRowKeys ||
  // props.defaultOpenRowKeys），但未出现在 next 的 TableProps .d.ts 里，这里按可选读取。
  const defaultOpenRowKeys = (props as { defaultOpenRowKeys?: string[] }).defaultOpenRowKeys;
  const isControlled = 'openRowKeys' in props;
  const [innerOpenKeys, setInnerOpenKeys] = useState<string[]>(
    (openRowKeys as string[]) || defaultOpenRowKeys || [],
  );

  // 受控时以 props.openRowKeys 为准
  const openKeys = isControlled ? ((openRowKeys as string[]) || []) : innerOpenKeys;

  const handleTreeNodeClick = React.useCallback(
    (record: any) => {
      if (!isTree) return;
      const id = record?.[primaryKey];
      const nextKeys = [...openKeys];
      const index = nextKeys.indexOf(id);

      // 收集该节点及其所有子孙 key（级联收起用）
      const collectDescendantKeys = (targetId: string) => {
        const ret: string[] = [targetId];
        const loop = (data: any[]) => {
          data.forEach((item) => {
            ret.push(item[primaryKey]);
            if (item.children) loop(item.children);
          });
        };
        (dataSource || []).forEach((item) => {
          if (item[primaryKey] === targetId && item.children) loop(item.children);
        });
        return ret;
      };

      if (index > -1) {
        const ids = collectDescendantKeys(id);
        ids.forEach((k) => {
          const i = nextKeys.indexOf(k);
          if (i > -1) nextKeys.splice(i, 1);
        });
      } else {
        nextKeys.push(id);
      }

      if (!isControlled) setInnerOpenKeys(nextKeys);
      onRowOpen?.(nextKeys, id, index === -1, record);
    },
    [isTree, primaryKey, openKeys, dataSource, isControlled, onRowOpen],
  );

  return { openKeys, handleTreeNodeClick, indent };
}

export const ProTableBase: React.FC<ProTableBaseProps> = (props) => {
  const { tableSetting } = React.useContext(ProTableSettingContext);
  const {
    columnKey,
    resizable,
    dataSource: originalDataSource,
    rowSelection,
    expandedRowRender,
    groupHeader,
    groupFooter,
    totalDataSource,
  } = props;

  const actionColumnProps = useActionColumn(props);
  const indexColumnProps = useIndexColumn(props);

  const { updateColumnSetting, columnsSetting } = React.useContext(ProTableColumnsSettingContext);

  const { flatColumns, columnsWithSetting } = useColumnsWithSetting({
    columnKey,
    columnsSetting,
    columns: props.columns,
    cellDefault: props.cellDefault,
    cellTooltipMode: props.cellTooltipMode,
  });

  // table 属性
  const externalProps: Partial<TableProps> = {
    expandedIndexSimulate: expandedRowRender ? true : undefined,
  };
  if (resizable) {
    externalProps.hasBorder = false;
    externalProps.onResizeChange = (dataIndex, width) => {
      const columnItem = flatColumns.find((vo) => vo.dataIndex === dataIndex);
      if (!columnItem) {
        console.warn(`未找到dataIndex=${dataIndex}的columnItem`);
        return;
      }
      updateColumnSetting(
        getColumnKey(columnItem, columnKey),
        (oldSetting) => {
          const oldWidth = Number(oldSetting.width) || Number(columnItem.width) || 200;
          return {
            width: Math.max(10, oldWidth + width),
          };
        },
        'resize',
      );
    };
  }

  const dataSource = useMemo(
    () => (totalDataSource ? [...(originalDataSource || []), totalDataSource] : originalDataSource),
    [totalDataSource, originalDataSource],
  );
  if (totalDataSource) {
    // 数据列第一列的下标，去掉表左侧功能列
    const dataColumnsStartIndex = [expandedRowRender, rowSelection, indexColumnProps].filter(
      (vo) => vo,
    ).length;
    // 数据列最后一列的下标，去掉表右侧功能列
    const dataColumnsEndIndex = dataColumnsStartIndex + flatColumns.length - 1;

    // 统计行下标
    const totalRowIndex = (dataSource ?? []).length - 1;
    externalProps.rowProps = (record, rowIndex) => {
      if (rowIndex === totalRowIndex) {
        return {
          className: 'fusion-ui-pro-table-total-row',
        };
      }
      return {};
    };

    externalProps.cellProps = (rowIndex, colIndex) => {
      if (rowIndex === totalRowIndex) {
        // 统计行的数据第一列显示 Total 文案
        if (colIndex === 0) {
          return {
            cell: totalCell,
            onCellClick: undefined,
            formatValue: undefined,
          };
        }
        // 不在数据列范围内的隐藏
        if (colIndex < dataColumnsStartIndex || colIndex > dataColumnsEndIndex) {
          return {
            cell: emptyFn,
            onCellClick: undefined,
            formatValue: undefined,
          };
        }

        return {
          cell: valueCell,
          onCellClick: undefined,
          formatValue: undefined,
        };
      }
      return {};
    };
  }

  const NextTable = props.stickyLock ? Table.StickyLock : Table;
  const resolvedRowSelection = useRowSelection(rowSelection, originalDataSource);
  const nextTableProps = pickTableProps({
    ...externalProps,
    ...props,
    ...tableSetting,
    rowSelection: resolvedRowSelection,
    dataSource,
    columns: undefined, // 剔除columns
    className: cns('fusion-ui-pro-table-base', props.className),
  });
  const columns = renderColumns(columnsWithSetting, {
    resizable: resizable ?? false,
  });

  // 树形展开状态：React 19 下由本组件维护并通过 context 下发（见 useTreeRowKeys）
  const { openKeys, handleTreeNodeClick, indent } = useTreeRowKeys(props, dataSource as any[]);
  const treeContextValue = React.useMemo(
    () => ({
      openTreeRowKeys: openKeys,
      indent,
      isTree: nextTableProps.isTree,
      rowSelection: resolvedRowSelection,
      onTreeNodeClick: handleTreeNodeClick,
    }),
    [openKeys, indent, nextTableProps.isTree, resolvedRowSelection, handleTreeNodeClick],
  );

  return (
    <ProTableTreeContext.Provider value={treeContextValue}>
      <NextTable
        {...nextTableProps}
        // @ts-ignore
        components={{
          Cell: nextTableProps.isTree ? ProTableTreeCell : ProTableCell,
        }}
      >
        {groupHeader &&
          (React.isValidElement(groupHeader) ? (
            groupHeader
          ) : (
            <Table.GroupHeader {...(groupHeader as any)} />
          ))}
        {groupFooter &&
          (React.isValidElement(groupFooter) ? (
            groupFooter
          ) : (
            <Table.GroupFooter {...(groupFooter as any)} />
          ))}

        {indexColumnProps && <Table.Column {...indexColumnProps} />}
        {columns}
        {actionColumnProps && <Table.Column {...actionColumnProps} />}
        {props.children}
      </NextTable>
    </ProTableTreeContext.Provider>
  );
};

ProTableBase.displayName = 'ProTableBase';
