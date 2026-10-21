import React, { ComponentType, forwardRef, Ref } from 'react';
import dayjs from 'dayjs';
import { get, set, has } from 'lodash';

function convertProps(
  props: Record<string, any>,
  list: string[],
  mapper: (v: any, key: string) => any,
) {
  const out: Record<string, any> = {};
  list.forEach(key => {
    if (has(props, key)) {
      set(out, key, mapper(get(props, key), key));
    }
  });
  return out;
}

/**
 * 简单包装，不做任何处理
 * 部分组件ref比较特殊，包一层会解决这个问题
 */
export function withWrap(Comp: ComponentType<any>) {
  return forwardRef((props: any, ref: Ref<any>) => {
    return <Comp {...props} ref={ref} />;
  });
}

/**
 * 某些组件会用React.Children.only检查子节点
 * 需要做处理避免报错
 */
export function withSingleChild(
  Comp: ComponentType<any>,
  needsConvert = ['children'],
) {
  return (props: any) => {
    const convertedProps = convertProps(props, needsConvert, prop => {
      let node = React.Children.toArray(prop)[0];
      if (node === null || typeof node !== 'object') {
        node = <div>{node}</div>;
      }
      return node;
    });

    return <Comp {...(props as any)} {...(convertedProps as any)} />;
  };
}

export function withSingleFunctionChild(Comp: ComponentType<any>) {
  return (props: any) => {
    const { children } = props;

    let node;
    if (typeof children === 'function') {
      node = children;
    }
    if (
      Array.isArray(children) &&
      children.length === 1 &&
      typeof children[0] === 'function'
    ) {
      node = children[0];
    }

    if (node) {
      return <Comp {...(props as any)}>{node}</Comp>;
    }
    return <div>{children}</div>;
  };
}

/**
 * dayjs 对象在序列化后会被转为字符串（低代码 schema 里存的就是字符串）
 * 需要让日期类组件支持接受字符串值。
 *
 * 迁移说明：antd 5/6 起日期组件内部用 dayjs 取代了 moment，
 * 因此这里把 moment.isMoment / moment(v) 换成 dayjs.isDayjs / dayjs(v)。
 * dayjs 是 antd 6 的 peer 依赖，值对象为不可变的 Dayjs 实例，语义与 moment 一致。
 */
export function withDayjsProps(
  Comp: ComponentType<any>,
  needsConvert = ['value', 'defaultValue'],
) {
  return (props: any) => {
    const convertedProps = convertProps(props, needsConvert, prop => {
      if (prop) {
        if (Array.isArray(prop)) {
          return prop.map(v => (dayjs.isDayjs(v) ? v : dayjs(v)));
        }
        return dayjs.isDayjs(prop) ? prop : dayjs(prop);
      }
    });

    return <Comp {...(props as any)} {...(convertedProps as any)} />;
  };
}

/**
 * @deprecated 用 withDayjsProps。保留别名以免外部引用断裂。
 */
export const withMomentProps = withDayjsProps;
