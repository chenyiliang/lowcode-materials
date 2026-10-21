import is from '@sindresorhus/is';
import * as React from 'react';
import qs from 'qs';
import { ProTableColumnProps } from '../../types';
import { getColorWithFormat } from '../pro-table-cells/utils';
import { DataSourceLabel, DataSourceLabelProps } from '@/utils/dataSource/data-source-label';
import { ReactNode } from 'react';
import { asyncDataSourceToPromiseDataSource } from '@/utils/dataSource/utils';

export interface CellFactoryCellOptions {
  /** 单元格值 */
  value: unknown;
  /** 单元格label */
  getLabel: (props?: DataSourceLabelProps) => ReactNode;
  /** 行下标 */
  rowIndex: number;
  /** 行数据 */
  record: unknown;
  /** 获取配置 */
  getCellOptions: () => any[];
  /** 获取颜色 */
  getCellColor: () => string;
}
export interface ProTableColumnFormatterOptions {
  /** 列配置 */
  column: ProTableColumnProps;
  formatTypeParser: {
    /** 类型原始值 */
    raw: string;
    /** 实际类型 */
    type: string;
    /** 参数 */
    rawOptions: string[];
  };
  /** 获取真实参数 */
  getCellOptions: (record: any) => any[];
  /**
   * 格式化：接收一个 cell 渲染函数 (value, ...args) => ReactNode，
   * 返回一个符合 next Table cell 签名的函数 (value, rowIndex, record) => ReactNode。
   */
  formatterCellFactory: <Value, Args extends unknown[]>(
    cell: (value: Value, ...args: Args) => React.ReactNode,
  ) => (value: any, rowIndex: number, record: any) => React.ReactNode;
  /**
   * 高阶格式化：接收一个 cell 渲染函数 (options) => ReactNode，
   * 返回一个符合 next Table cell 签名的函数 (value, rowIndex, record) => ReactNode。
   */
  cellFactory: (
    cell: (options: CellFactoryCellOptions) => React.ReactNode,
  ) => (value: any, rowIndex: number, record: any) => React.ReactNode;
}
export type ProTableColumnFormatter = (
  options: ProTableColumnFormatterOptions,
) => Partial<ProTableColumnProps>;

class ProTableColumnFormatterManager {
  columnFormatters: Record<string, ProTableColumnFormatter> = {};
  /** 注册列格式化类型 */
  registerColumnFormatter = (name: string, columnFormatter: ProTableColumnFormatter) => {
    if (is.function(columnFormatter)) {
      this.columnFormatters[name] = columnFormatter;
      return;
    }
    console.warn(`registerColumnFormatter: ${name}, columnFormatter不是函数`);
  };
  /** 批量注册列格式化类型 */
  registerColumnFormatters = (columnFormatters: Record<string, ProTableColumnFormatter>) => {
    Object.keys(columnFormatters).forEach((key) => {
      this.registerColumnFormatter(key, columnFormatters[key]);
    });
  };
  formatColumnProps = (col: ProTableColumnProps): ProTableColumnProps | undefined => {
    if (is.string(col.formatType)) {
      const formatterOptions = getFormatterOptions(col);
      const { columnFormatters } = this;
      if (formatterOptions.formatTypeParser.type in columnFormatters) {
        return columnFormatters[formatterOptions.formatTypeParser.type](formatterOptions);
      }
    }
    return undefined;
  };
}
const proTableColumnFormatterManager = new ProTableColumnFormatterManager();
export const { registerColumnFormatter, registerColumnFormatters, formatColumnProps } =
  proTableColumnFormatterManager;

const getFormatterOptions = (column: ProTableColumnProps): ProTableColumnFormatterOptions => {
  // formatType 可选，缺省时按原样解析会抛错，这里回退为空串（解析失败会被 catch 成默认类型）
  const formatTypeParser = parseFormatType(column.formatType ?? '');
  if (is.array(column.formatOptions)) {
    formatTypeParser.rawOptions = [...formatTypeParser.rawOptions, ...column.formatOptions];
  }

  const getCellOptions = (record: any = {}) =>
    formatTypeParser.rawOptions.map((vo) => (vo.startsWith('$') ? record[vo.slice(1)] : vo));
  // 优化性能，列dataSource缓存
  const dataSource = column.dataSource
    ? asyncDataSourceToPromiseDataSource(column.dataSource)
    : undefined;
  const cellFactory =
    (cell: (options: CellFactoryCellOptions) => React.ReactNode) =>
    (value: any, rowIndex: number, record: any) =>
      cell({
        getLabel: (props) =>
          dataSource ? (
            <DataSourceLabel
              dataSource={dataSource}
              value={value}
              defaultLabel={value || column.cellDefault}
              {...props}
            />
          ) : (
            value
          ),
        value,
        rowIndex,
        record,
        getCellOptions: () => getCellOptions(record),
        getCellColor: () => getColorWithFormat(value, column.formatColor),
      });
  const formatterCellFactory =
    (cell: (value: any, ...args: any[]) => React.ReactNode) =>
    (value: any, rowIndex: number, record: any) =>
      cell(value, ...(getCellOptions(record) as any));
  return {
    column,
    formatTypeParser,
    getCellOptions,
    cellFactory,
    formatterCellFactory,
  };
};

/**
 * 解析格式化字符串
 * @param raw 格式化字符串
 * @example
 * - number
 * - number:0,0.00%
 * - number:$format
 */
const parseFormatType = (raw: string): ProTableColumnFormatterOptions['formatTypeParser'] => {
  try {
    const res = raw.trim().match(/^([a-zA-Z-_0-9]+)(?:\|(.*)?)?$/);
    if (!res) {
      throw new Error('不符合规则的formatType');
    }
    const [, type, optionStr = ''] = res;
    return {
      raw,
      type,
      rawOptions: Object.keys(qs.parse(optionStr)),
    };
  } catch (error) {
    const err = new Error(`parseformatType: ${raw} 解析错误`);
    // catch 的 error 是 unknown（strict 模式），按 Error 结构读取 stack
    err.stack = (error as { stack?: string })?.stack;
    throw err;
  }
};
