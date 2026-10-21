import * as React from 'react';
import cx from 'classnames';
import { Dialog as NextDialog, Message, Balloon, Icon } from '@alifd/next';
import { DialogProps as NextDialogProps } from '@alifd/next/types/dialog';

import Operations, { OperationProps } from '@/common/operations';
import { isEditorEnv } from '@/utils';

const { Tooltip } = Balloon;
const noop = () => {};
// 用类型谓词替代 `typeof x === 'function'` 判断，使调用点在 isValidFunction(x) 为真时收窄类型
const isValidFunction = <T,>(func: T | undefined): func is T => typeof func === 'function';
const ACTION_MAP: Record<string | number, any> = {
  ok: noop,
  cancel: noop,
};

function getAction(action: string | number) {
  return ACTION_MAP[action] || noop;
}

// @alifd/next 的 DialogProps 是联合类型（DialogV1Props | DialogV2Props），
// interface 无法 extends 联合类型（TS2312），故用交叉类型声明。
export type DialogProps = NextDialogProps & {
  /**
   * 弹窗大小
   */
  size?: 'small' | 'medium' | 'large' | 'autoLarge';
  operations?: object[];
  operationConfig?: object;
  // status 透传给 @alifd/next Message 的 type，故约束为 Message 支持的取值
  status?: 'success' | 'warning' | 'error' | 'notice' | 'help' | 'loading';
  dialogType?: string;
  explanation?: string;
  iconType?: string;
  hasTips?: boolean;
  /**
   * 以下属性 next 的 DialogProps 联合类型里并非每个分支都声明，但运行期由本组件消费，
   * 这里显式补全（保持与老实现一致的取值方式）。
   */
  className?: string;
  children?: React.ReactNode;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  width?: string | number;
  rtl?: boolean;
  messageProps?: Record<string, unknown>;
  explanationTooltipProps?: Record<string, unknown>;
  onOk?: (event: object) => void;
  onCancel?: (event: object) => void;
  onClose?: (trigger: string, event: object) => void;
  /** 低代码设计态标记（isEditorEnv 读取），运行期由引擎注入 */
  __designMode?: string;
};

export interface DialogOperationsProps extends OperationProps {
  onOk?: any;
  onCancel?: any;
}

export interface DialogState {
  visible?: boolean;
}

const DialogOperations = (props: DialogOperationsProps) => {
  const { operations, operationConfig, onOk = noop, onCancel = noop, renderDefaultBtns } = props;
  if (!operations || !operations.length) {
    return null;
  }

  const baseOperations = operations.map((operation: any) => {
    let onClick = getAction(operation.action).bind(this);
    if (operation.action) {
      if (operation.action === 'ok' && onOk && typeof onOk === 'function') {
        onClick = onOk;
      } else if (operation.action === 'cancel' && onCancel && typeof onCancel === 'function') {
        onClick = onCancel;
      }
    }
    return {
      onClick,
      ...operation,
    };
  });

  const operationProps = {
    operations: baseOperations,
    operationConfig,
    renderDefaultBtns,
  };

  return <Operations {...operationProps} />;
};

function Dialog(props: DialogProps) {
  const {
    size,
    className,
    onOk,
    onCancel,
    children,
    operations,
    footer,
    operationConfig,
    status,
    messageProps,
    dialogType,
    explanationTooltipProps,
    hasTips,
    explanation,
    iconType,
    rtl,
    title,
    width,
    ...otherProps
  } = props;
  let footerElement = footer;
  if (operations && operations.length) {
    const operationsProps = {
      operations,
      operationConfig,
      onOk,
      onCancel,
      renderDefaultBtns: () => footer || [],
    };
    footerElement = <DialogOperations {...operationsProps} />;
  }

  // class 处理
  const classes = cx({
    'fusion-ui-dialog': true,
    [`fusion-ui-dialog-${size}`]: typeof width === 'undefined',
    // className 可能为 undefined，计算属性名不能是 undefined，故仅在存在时加入
    ...(className ? { [className]: true } : {}),
  });

  // 如果指定了 width ，则 size 不生效；

  const titleElement =
    dialogType === 'notice' && status ? (
      <Message
        style={{ padding: 0 }}
        size="large"
        shape="addon"
        type={status}
        {...messageProps}
        title={title}
        rtl={rtl}
      />
    ) : (
      <div>
        {title}
        {hasTips ? (
          <div className="fusion-ui-dialog__tooltip">
            <Tooltip trigger={<Icon type={iconType} size="small" />} {...explanationTooltipProps}>
              {explanation}
            </Tooltip>
          </div>
        ) : (
          ''
        )}
      </div>
    );

  return (
    <NextDialog
      v2
      title={titleElement}
      footer={footerElement}
      className={classes}
      width={typeof width !== 'undefined' ? (width as string | number) : undefined}
      {...(otherProps as Partial<NextDialogProps>)}
    >
      {children}
    </NextDialog>
  );
}

export class InnerProDialog extends React.Component<DialogProps, DialogState> {
  static displayName: 'ProDialog';

  constructor(props: DialogProps) {
    super(props);
    const { visible } = props;
    this.state = {
      visible: visible || false,
    };
  }

  onOk = (event: object) => {
    const { onOk } = this.props;
    if (isValidFunction(onOk)) {
      onOk(event);
    }

    if (!('visible' in this.props)) {
      this.setState({ visible: false });
    }
  };

  onCancel = (event: object) => {
    const { onCancel } = this.props;
    if (isValidFunction(onCancel)) {
      onCancel(event);
    }

    this.setState({ visible: false });
  };

  onClose = (trigger: string, event: object) => {
    const { onClose } = this.props;
    if (isValidFunction(onClose)) {
      onClose(trigger, event);
    }

    this.setState({ visible: false });
  };

  show = () => {
    this.setState({
      visible: true,
    });
  };

  open = () => {
    this.setState({
      visible: true,
    });
  };

  hide = () => {
    this.setState({
      visible: false,
    });
  };

  close = () => {
    this.setState({
      visible: false,
    });
  };

  render() {
    const { children, ...otherProps } = this.props;
    const { visible } = this.state;
    const realVisible = isEditorEnv(this.props) ? true : visible;
    const dialogProps = {
      ...otherProps,
      visible: realVisible,
      onOk: this.onOk,
      onCancel: this.onCancel,
      onClose: this.onClose,
    };

    return <Dialog {...dialogProps}>{children}</Dialog>;
  }
}

export const ProDialog = Object.assign(InnerProDialog, NextDialog);
