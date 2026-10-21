import * as React from 'react';
import { ProTableProps } from '../../types';
import { ProTable } from '../pro-table';

export const GroupTable: React.FC<ProTableProps> = (rawProps) => {
  // React 19 移除了函数组件的 defaultProps。这里的默认值需要透传给 ProTable（经 otherProps 展开），
  // 所以先合并默认值再解构，保证 otherProps 仍带上这些默认项。
  const props: ProTableProps = {
    settingButtons: false,
    defaultColumnsSetting: {},
    columnKey: 'key',
    primaryKey: 'id',
    stickyLock: true,
    resizable: true,
    emptyContent: <div type="card" status="DATA_EMPTY" />,
    hasBorder: false,
    size: 'medium',
    isZebra: false,
    cellDefault: '',
    cellTooltipMode: 'none',
    ...rawProps,
  };
  const { groupHeader: propGroupHeader, groupFooter: propGroupFooter, ...otherProps } = props;
  const groupHeader = propGroupHeader || {
    cell: (record) => record?.header,
  };
  const groupFooter = propGroupFooter || {
    cell: (record) => record?.footer,
  };
  return <ProTable groupHeader={groupHeader} groupFooter={groupFooter} {...otherProps} />;
};

