import * as React from 'react';
import { useDebounceFn, useFusionTable } from 'ahooks';
import { ProTableProps, SortValue } from './types';
import mapValues from 'lodash/mapValues';
// ahooks 3：useFusionTable 的类型从 ahooks 2 的 Result<Item> / BasePaginatedOptions<Item>
// 改成 FusionTableResult<TData, TParams> / FusionTableOptions<TData, TParams>。
import type { FusionTableOptions, FusionTableResult } from 'ahooks/lib/useFusionTable/types';
import { FilterProps } from '@/components/filter';
import { Field } from '@alifd/next';

interface TableParams {
  sorters: Record<string, SortValue>;
  searchers: Record<string, string | undefined>;
  filters: Record<string, any[]>;
}
type FilterParams = Record<string, any>;

// ahooks 3 的 service 返回 Data = { total, list }，list 为 Item[]
type FusionData<Item> = { total: number; list: Item[] };
// ahooks 3 的 useFusionTable 参数是 [分页信息, ...其它]，这里用宽松元组约束
type FusionParams = [Record<string, any>, ...(unknown[] | [])];

export interface UseProTableResult<Item>
  extends Omit<FusionTableResult<FusionData<Item>, FusionParams>, 'tableProps'> {
  tableProps: {
    dataSource: Item[];
    loading: boolean;
    onSort: ProTableProps['onSort'];
    onFilter: ProTableProps['onFilter'];
    onSearch: ProTableProps['onSearch'];
    paginationProps: ProTableProps['paginationProps'];
  };
  filterProps: FilterProps;
}

export interface UseProTableServiceParams {
  /**
   * 当前页
   */
  current: number;
  /**
   * 每页条数
   */
  pageSize: number;
  /**
   * 表格筛选/排序/搜索参数
   */
  tableParams: TableParams;

  /**
   * 筛选表单参数
   */
  filterParams: FilterParams;
}

export type UseProTableService<Item = unknown> = (params: UseProTableServiceParams) => Promise<{
  total: number;
  dataSource: Item[];
  [key: string]: any;
}>;

// ahooks 3：FusionTableOptions 已经 Omit 掉 form，这里补回 field（老代码用 field 传入 @alifd/next Field 实例）
export interface UseProTableOptions<Item = unknown>
  extends Omit<FusionTableOptions<FusionData<Item>, FusionParams>, 'field'> {
  field?: Field;
}

/**
 * ProTable hooks
 * @param service 请求service
 * @param options 参数
 */
export const useProTable = <Item = unknown>(
  service: UseProTableService<Item>,
  options: UseProTableOptions<Item> = {},
): UseProTableResult<Item> => {
  const [tableParams, setTableParams] = React.useState<TableParams>({
    sorters: {},
    searchers: {},
    filters: {},
  });
  const selfField = Field.useField();
  const field = options.field || selfField;
  const { run: setTableParamsDebounce } = useDebounceFn(setTableParams, { wait: 300 });

  const fusionTable = useFusionTable(
    async (p, filterParams) => {
      const res = await service({ ...p, tableParams, filterParams });
      return {
        ...res,
        list: res.dataSource,
      };
    },
    {
      defaultPageSize: 10,
      ...options,
      field,
    },
  );
  const { run: refresh } = useDebounceFn(fusionTable.refresh, { wait: 100 });
  const tableEvents = React.useMemo<{
    onSort: ProTableProps['onSort'];
    onFilter: ProTableProps['onFilter'];
    onSearch: ProTableProps['onSearch'];
  }>(() => {
    return {
      onFilter: (newVal) => {
        setTableParams((oldVal) => ({
          ...oldVal,
          filters: mapValues(newVal, (vo) => vo && vo.selectedKeys),
        }));
        refresh();
      },
      onSearch: (newVal) =>
        setTableParamsDebounce((oldVal) => {
          refresh();
          return {
            ...oldVal,
            searchers: mapValues(newVal, (vo) => vo && vo.keywords),
          };
        }),
      onSort: (index, order, sorters) => {
        setTableParams((oldVal) => ({
          ...oldVal,
          sorters,
        }));
        refresh();
      },
    };
  }, [setTableParamsDebounce, refresh]);
  const { type, changeType, submit, reset } = fusionTable.search || {};
  return {
    ...fusionTable,
    tableProps: {
      ...fusionTable.tableProps,
      ...tableEvents,
      paginationProps: fusionTable.paginationProps,
    },
    filterProps: {
      enableForm: true,
      onSearch: submit,
      onReset: reset,
      expand: type === 'advance',
      formProps: {
        field,
      },
      onExpand: (expand) => {
        if ((type === 'advance') !== expand) {
          changeType();
        }
      },
    },
  };
};
