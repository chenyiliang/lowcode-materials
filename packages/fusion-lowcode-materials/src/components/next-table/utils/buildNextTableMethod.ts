import type { NextTable } from "..";
import { IEditableMethods } from "../mixin/editableMethods";

const methodList: (keyof Omit<IEditableMethods, 'init'> | 'getDataSource')[] = [
  'editRow',
  'saveRow',
  'resetRow',
  'validateRow',
  'getDataSource',
];

export default function buildNextTableMethod(instance: NextTable) {
  methodList.forEach((name) => {
    instance[name] = function (...args: unknown[]) {
      const { tableRef } = instance;
      const { current } = tableRef;
      if (current) {
        // name 是若干「this 绑定方法」的联合，直接 .apply 会因 this 签名不一致报错；
        // 这里按「可调用方法」的具体函数类型取用，透传实参给内部 WebTable 实例。
        const method = current[name] as ((...args: unknown[]) => unknown) | undefined;
        if (method) {
          return method.apply(current, args);
        }
      }
    };
  });
}
