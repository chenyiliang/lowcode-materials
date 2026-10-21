import * as React from 'react';
import { useRef, useImperativeHandle, forwardRef } from 'react';
import { Form, Card } from '@alifd/next';
import { Space } from '@/components/container';
import { Anchor, AnchorProps, LinkItemData } from '@/components/anchor';
import Operations from '@/common/operations';
import { getId } from '@/utils';

export interface AnchorFormProps {
  children?: React.ReactElement;
  /**
   * 可以这样写属性描述
   * @description   是否展示锚点
   * @description.zh-CN 还支持不同的 locale 后缀来实现多语言描述，使用 description 兜底
   * @default     false
   */
  showAnchor?: boolean;
  formMapRef?: any;
  operations?: any;
  operationConfig?: any;
  lastSaveTime?: any;
  anchorProps?: AnchorProps;
  enableRandomHtmlId?: boolean;
}

export type AnchorFormItemProps = LinkItemData;

function renderAnchor(props: AnchorFormProps, formArray: Map<string, AnchorFormItemProps>) {
  const dataSource: AnchorFormItemProps[] = Array.from(formArray.keys()).map((item) => {
    const anchorItemProps = formArray.get(item);
    const { label = '', htmlId = getId(), ...otherProps } = anchorItemProps || {};
    return {
      ...otherProps,
      label,
      htmlId,
    };
  });
  return <>{dataSource && <Anchor dataSource={dataSource} {...props} />}</>;
}

function renderForm(
  props: AnchorFormProps,
  formArrayRef: React.MutableRefObject<any[]>,
  formArray: Map<string, AnchorFormItemProps>,
) {
  const { children } = props;
  return (
    <>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        const anchorItemProps = formArray.get(`${index}`);
        // child.props 是 unknown（React.Children.map 返回 ReactNode），需按 element 结构读取
        const childProps = child.props as {
          mode?: string;
          cardProps?: Record<string, unknown>;
          [key: string]: unknown;
        };
        const { mode = 'independent', cardProps = {}, ...otherProps } = childProps;
        const { label = '', htmlId = getId() } = anchorItemProps ?? {};
        // React 19 适配：child.ref 不再是稳定入口，原 ref 现在通过 child.props.ref 传入；
        // 这里注入 callback ref 合并写回 formArrayRef 并转发原 ref。
        const originalRef = childProps.ref as React.Ref<unknown> | undefined;
        return (
          <Card title={label} id={htmlId} className="fusion-ui-anchor-form forms" {...cardProps}>
            {React.cloneElement(child, {
              ref: (node: unknown) => {
                // Keep your own reference
                formArrayRef.current[index] = node;
                // Call the original ref, if any
                if (typeof originalRef === 'function') {
                  originalRef(node);
                } else if (originalRef && typeof originalRef === 'object') {
                  (originalRef as React.MutableRefObject<unknown>).current = node;
                }
              },
              ...otherProps,
              mode,
            } as Partial<unknown>)}
          </Card>
        );
      })}
    </>
  );
}

function AnchorForm(props: AnchorFormProps, ref: any) {
  const {
    children,
    formMapRef: propsFormMapRef,
    operations,
    operationConfig,
    lastSaveTime,
    anchorProps = {},
    showAnchor = false,
    enableRandomHtmlId,
    ...otherProps
  } = props;
  const formArrayRef = useRef<Array<React.MutableRefObject<any | undefined>>>([]);
  useImperativeHandle(propsFormMapRef, () => formArrayRef.current);
  if (!children) {
    return (
      <Space ref={ref} full align="center" verAlign="middle" style={{ minHeight: 50 }}>
        <span>内容为空</span>
      </Space>
    );
  }

  const formArray = new Map<string, AnchorFormItemProps>();
  React.Children.map(children, (child, index) => {
    const { anchorItemProps } = child.props;
    const name = `${index}`;
    const data = { ...anchorItemProps };
    if (enableRandomHtmlId) {
      data.htmlId = getId();
    }
    formArray.set(name, data);
  });

  const operationsProps = {
    operations,
    operationConfig,
    lastSaveTime,
  };
  const formContent = renderForm(props, formArrayRef, formArray);
  return (
    <div ref={ref}>
      {showAnchor ? renderAnchor(anchorProps, formArray) : null}
      <Form {...otherProps}>
        {formContent}
        <Operations {...operationsProps} />
      </Form>
    </div>
  );
}

export default forwardRef(AnchorForm);
