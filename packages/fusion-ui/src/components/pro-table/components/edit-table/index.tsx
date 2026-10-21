import * as React from 'react';
import { Button } from '@alifd/next';

import { ProTable, ProTableProps } from '../../index';
import type { ProTableRowInstance } from '../../types';
import { Space } from '@/components/container';

/** 行记录（编辑态多一个 editMode 标记） */
type RowRecord = Record<string, any>;

export interface EditTableProps extends ProTableProps {
  addPosition?: 'end' | 'start';
  onSave?: (rowIndex: number, record: RowRecord, dataSource: RowRecord[]) => void;
  onRemove?: (rowIndex: number, record: RowRecord, dataSource: RowRecord[]) => void;
  onCancel?: (rowIndex: number, record: RowRecord, dataSource: RowRecord[]) => void;
}

export const EditTable = function (props: EditTableProps) {
  const {
    primaryKey = 'id',
    dataSource: propDataSource,
    actionColumnButtons: propActionColumnButtons = { dataSource: [] },
    onSave,
    onRemove,
    onCancel,
    addPosition = 'end',
    ...otherProps
  } = props;
  const [dataSource, setDataSource] = React.useState<RowRecord[] | undefined>(propDataSource);
  // React 19 要求 useRef 传初始值；这里以当前 dataSource 初始化，缺省空数组
  const dataSourceRef = React.useRef<RowRecord[]>(dataSource ?? []);
  const [actionColumnButtons, setActionColumnButtons] =
    React.useState<NonNullable<ProTableProps['actionColumnButtons']>>(propActionColumnButtons);
  function actionColumnButtonsHidden(showInEdit: boolean) {
    // 用 next/ProTable 定义的行实例类型，签名与 ActionColumnButton.hidden 对齐
    return ({ rowRecord }: ProTableRowInstance) => {
      return showInEdit ? !!rowRecord.editMode : !rowRecord.editMode;
    };
  }
  const defaultActionColumnButtons: NonNullable<ProTableProps['actionColumnButtons']>['dataSource'] =
    [
      {
        children: '编辑',
        type: 'primary',
        onClick(_e: React.MouseEvent, payload?: ProTableRowInstance) {
          const { rowKey, rowRecord } = payload ?? ({} as ProTableRowInstance);
          const _data = (dataSourceRef.current ?? []).map((item) => {
            if (item[primaryKey] === rowKey) {
              return Object.assign(item, rowRecord, { editMode: true });
            }
            return item;
          });
          setDataSource(_data);
        },
        hidden: actionColumnButtonsHidden(true),
      },
      {
        children: '保存',
        type: 'primary',
        onClick(_e: React.MouseEvent, payload?: ProTableRowInstance) {
          const { rowIndex, rowKey, rowRecord } = payload ?? ({} as ProTableRowInstance);
          const _data = (dataSourceRef.current ?? []).map((item) => {
            if (item[primaryKey] === rowKey) {
              return Object.assign(item, rowRecord, { editMode: false });
            }
            return item;
          });
          onSave && onSave(rowIndex, rowRecord, _data);
          setDataSource(_data);
        },
        hidden: actionColumnButtonsHidden(false),
      },
      {
        children: '取消',
        type: 'primary',
        onClick(_e: React.MouseEvent, payload?: ProTableRowInstance) {
          const { rowIndex, rowKey, rowRecord } = payload ?? ({} as ProTableRowInstance);
          const _data = (dataSourceRef.current ?? []).map((item) => {
            if (item[primaryKey] === rowKey) {
              const keys = Object.keys(item);
              const originKeys = keys.filter((key) => key.startsWith('origin-'));
              originKeys.forEach((originKey) => {
                item[originKey.replace('origin-', '')] = item[originKey];
              });
              return Object.assign(item, { editMode: false });
            }
            return item;
          });
          onCancel && onCancel(rowIndex, rowRecord, _data);
          setDataSource(_data);
        },
        hidden: actionColumnButtonsHidden(false),
      },
      {
        children: '删除',
        type: 'primary',
        onClick(_e: React.MouseEvent, payload?: ProTableRowInstance) {
          const { rowKey, rowIndex, rowRecord } = payload ?? ({} as ProTableRowInstance);
          dataSourceRef.current = (dataSourceRef.current ?? []).filter(
            (item) => item[primaryKey] !== rowKey,
          );
          setDataSource(dataSourceRef.current);
          onRemove && onRemove(rowIndex, rowRecord, dataSourceRef.current);
        },
      },
    ];
  React.useEffect(() => {
    const { dataSource: actionColumnDataSource = [] } = propActionColumnButtons;
    const _actionColumnButtons = {
      ...actionColumnButtons,
      dataSource: defaultActionColumnButtons.concat(actionColumnDataSource as any[]),
    };
    setActionColumnButtons(_actionColumnButtons);
  }, [propActionColumnButtons, dataSource]);
  const tableAfter = (
    <Space className="row-add" align="center" justify="center">
      <Button
        text
        type="primary"
        onClick={() => {
          let _data: RowRecord[];
          const current = dataSource ?? [];
          const newRow: RowRecord = {
            [primaryKey]: `id-${Math.random().toString(36).substr(-6)}`,
            editMode: true,
          };
          if (addPosition && addPosition === 'start') {
            _data = [newRow].concat(current);
          } else {
            _data = current.concat([newRow]);
          }
          dataSourceRef.current = _data;
          setDataSource(_data);
        }}
      >
        +新增一行
      </Button>
    </Space>
  );
  return (
    <>
      <ProTable
        className="fusion-ui-edit-table"
        tableAfter={tableAfter}
        dataSource={dataSource}
        actionColumnButtons={actionColumnButtons}
        {...otherProps}
      />
    </>
  );
};
