import React, { ReactNode } from "react";
import classnames from 'classnames';
import { Field } from "@alifd/next";
import { Rule } from "@alifd/next/types/field";

export interface IBaseTableFieldProps {
  name: string;
  value?: any;
  onChange: (value: any) => void;
  nextTablePrefix: string;
  rules?: Rule;
}

class BaseTableField<P = {}> extends React.Component<IBaseTableFieldProps & P> {
  field: Field;
  constructor(props: IBaseTableFieldProps & P) {
    super(props);

    this.field = new Field(this, {
      onChange: (name, value) => {
        this.dataChangeHandler(value);
      },
    });

    // React 19 移除了 componentWillMount。这里是在构造函数里同步初始化 Field 的值，
    // 语义等价：第一次 render 之前 Field 就已带上初始值，不需要走生命周期。
    const { name } = props;
    this.field.setValue(name, this.convertValueToSet(props.value));
  }

  componentDidUpdate(prevProps: IBaseTableFieldProps & P) {
    // React 19 移除了 componentWillReceiveProps。改成在更新后按新 props 同步 Field 值：
    // 原来是无条件 setValue，这里保留同样的无条件语义（value 未变时 setValue 也是幂等的），
    // 但加上 prevProps !== this.props 的判断以避免无意义的重复写入。
    if (prevProps.value !== this.props.value || prevProps.name !== this.props.name) {
      const { name } = this.props;
      this.field.setValue(name, this.convertValueToSet(this.props.value));
    }
  }

  validate() {
    return new Promise((resolve) => {
      const { name } = this.props;

      this.field.validate([name], (errors) => {
        resolve(errors);
      });
    });
  }

  convertValueToSet(value: any) {
    return value;
  }

  dataChangeHandler(value: any) {
    const { onChange } = this.props;
    onChange && onChange(value);
  }

  renderField(): ReactNode {
    return null;
  }

  render() {
    const { nextTablePrefix, name } = this.props;
    const field = this.field;
    // @alifd/field 的 getError 返回 null | string[]（当前类型解析为 unknown[]），
    // 直接塞进 JSX 会得到 unknown[]，不满足 ReactNode。这里归一化成字符串再渲染。
    const rawErr = field.getError(name);
    const errMessages = Array.isArray(rawErr) ? rawErr : rawErr ? [rawErr] : [];
    const errMsg: ReactNode = errMessages.filter(Boolean).map(String).join(', ') || null;
    const fieldState = field.getState(name);

    return (
      <div className={classnames((fieldState === "error") ? `${nextTablePrefix}field-has-error` : "")}>
        <div>
          {this.renderField()}
        </div>
        {errMsg ? <div>
          <div className={`${nextTablePrefix}field-msg`}>{errMsg}</div>
        </div> : null}
      </div>
    );
  }
}

export default BaseTableField;
