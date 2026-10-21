import * as React from 'react';
import cx from 'classnames';
import { Overlay } from '@alifd/next';
import { OverlayProps } from '@alifd/next/types/overlay/index';
import { ProTableSettingSortableList } from './pro-table-setting-sortable-list';
import { ProTableSettingItem, ProTableSettingMenuItem } from './types';
import { ProTableColumnsSettingContext } from '@/components/pro-table/contexts/pro-table-columns-setting-context';
import { ProTableColumnProps } from '@/components/pro-table/types';
import { getColumnKey } from '../pro-table-base/utils';
import { ProTableContext } from '@/components/pro-table/contexts/pro-table-context';
import is from '@sindresorhus/is';
import { ProTableColumnsContext } from '@/components/pro-table/contexts/pro-table-columns-context';

export type ProTableSettingOverlayActionType = 'init' | 'input' | 'resize';
export type ProTableSettingOverlayValue = Record<string, ProTableSettingItem>;

export const ProTableSettingOverlay: React.FC<OverlayProps> = (props) => {
  const { columnsSetting, updateColumnSetting, updateColumnsSetting } = React.useContext(
    ProTableColumnsSettingContext,
  );
  const { tableBeforeContainer } = React.useContext(ProTableContext);
  const { columns, columnKey } = React.useContext(ProTableColumnsContext);

  const onToggleShow = React.useCallback(
    (item: ProTableSettingMenuItem, checked: boolean) => {
      updateColumnSetting(item.id, () => ({ hidden: !checked }), 'input');
    },
    [updateColumnSetting],
  );
  const onLock = React.useCallback(
    // 签名与 ProTableSettingSortableList 的 onLock 一致（lock 可为任意字符串，实际只用
    // 'left' | 'right' | false）；底层 updateColumnSetting 存的也是 boolean | string。
    (id: string, lock: boolean | string) => {
      updateColumnSetting(id, () => ({ lock }), 'input');
    },
    [updateColumnSetting],
  );

  const onSortEnd = React.useCallback(
    (oldIndex: number, newIndex: number, ids: string[]) => {
      ids.splice(newIndex, 0, ...ids.splice(oldIndex, 1)); // 当前项移至新位置
      // 按新顺序更新sortRank
      updateColumnsSetting(
        ids.reduce(
          (p, key, sortRank) => ({
            ...p,
            [key]: {
              sortRank,
            },
          }),
          {},
        ),
        'input',
      );
    },
    [updateColumnsSetting],
  );

  const dataSource = React.useMemo(() => {
    const formatItems = (items: ProTableColumnProps[]): ProTableSettingMenuItem[] =>
      items
        .map((vo, index) => {
          const id = getColumnKey(vo, columnKey);

          // next ColumnProps.title 允许是渲染函数 (() => any)，但设置面板里 title 只作
          // 静态标签展示，ReactNode 不接受裸函数，故函数形态时回退到 group/空。
          const rawTitle = vo.title;
          const displayTitle =
            typeof rawTitle === 'function' ? vo.group : rawTitle || vo.group;
          return {
            id,
            title: displayTitle,
            defaultSortRank: index,
            defaultLock: vo.lock,
            children:
              vo.group && is.array(vo.children) && vo.children.length > 0
                ? formatItems(vo.children)
                : undefined,
          };
        })
        .filter((vo) => vo.id);
    return formatItems(columns || []);
  }, [columnKey, columns]);
  const dataSourceGroup = React.useMemo(() => {
    const leftLock: ProTableSettingMenuItem[] = [];
    const rightLock: ProTableSettingMenuItem[] = [];
    const noLock: ProTableSettingMenuItem[] = [];
    dataSource.forEach((vo) => {
      const settingLock = columnsSetting[vo.id]?.lock;
      const lock = is.undefined(settingLock) ? vo.defaultLock : settingLock;
      if (lock === 'left' || lock === true) {
        leftLock.push(vo);
      } else if (lock === 'right') {
        rightLock.push(vo);
      } else {
        noLock.push(vo);
      }
    });
    return [
      {
        title: '固定在左侧',
        key: 'left',
        lock: 'left',
        dataSource: leftLock,
      },
      {
        title: '不固定',
        key: 'no',
        lock: false,
        dataSource: noLock,
      },
      {
        title: '固定在右侧',
        key: 'right',
        lock: 'right',
        dataSource: rightLock,
      },
    ].filter((vo) => vo.dataSource.length > 0);
  }, [dataSource, columnsSetting]);

  return (
    <Overlay
      align="tr br"
      container={tableBeforeContainer.current}
      {...props}
      className={cx('fusion-ui-pro-table-setting-panel', props?.className)}
    >
      <div>
        {dataSourceGroup.map((vo) => (
          <div className="fusion-ui-pro-table-setting-block" key={vo.key}>
            <div className="fusion-ui-pro-table-setting-block__title">{vo.title}</div>
            <ProTableSettingSortableList
              dataSource={vo.dataSource}
              lock={vo.lock}
              setting={columnsSetting}
              onLock={onLock}
              onSortEnd={onSortEnd}
              onToggleShow={onToggleShow}
            />
          </div>
        ))}
      </div>
    </Overlay>
  );
};
ProTableSettingOverlay.displayName = 'ProTableSettingOverlay';
