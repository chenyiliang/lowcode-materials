import React, { Component } from 'react';
import { Tabs as OriginalTabs } from 'antd';
import type { TabPaneProps, TabsProps } from 'antd';
import { warning } from '../../utils/warning'

// antd 6 内部改用 @rc-component/tabs，`Tab` 类型不再从 antd 顶层导出。
// 这里直接从 TabsProps 的 items 元素类型推导，避免依赖 antd 的传递依赖内部路径。
type TabItem = NonNullable<TabsProps['items']>[number];

class Tabs extends Component<any> {
  state = {
    activeKey: this.props.activeKey ?? this.props.defaultActiveKey,
  };

  private _handleChange = (key: string) => {
    this.setActiveKey(key);
  };

  // 编辑器里可以通过 this.$(refId).setActiveKey(key) 调用
  setActiveKey = (key: string) => {
    const { onChange = () => {} } = this.props;
    this.setState({ activeKey: key });
    onChange(key);
  };

  // 编辑器里可以通过 this.$(refId).getActiveKey() 调用
  getActiveKey = () => {
    return this.state.activeKey;
  };

  render() {
    const { props } = this;
    const { activeKey } = this.state;

    const { children } = props

    let items = props.items

    // props.items 存在，只认 props.items
    // 兼容代码：props.childrens 反推 props.items
    if (!props.items && Array.isArray(children) && children.length > 0) {
      warning('Tabs.TabPane is deprecated. Please use `items` directly.')
      items = children.map((node: React.ReactElement<TabPaneProps>) => {
        if (React.isValidElement(node)) {
          const { key, props } = node;
          const { tab, ...restProps } = props || {};
          const item: TabItem = {
            key: String(key),
            ...restProps,
            label: tab,
          };
          return item;
        }
        return null
      }).filter(Boolean)
    }

    return (
      <OriginalTabs
        {...props}
        items={items}
        activeKey={activeKey}
        onChange={this._handleChange}
      />
    );
  }
}

(Tabs as any).TabPane = OriginalTabs.TabPane;

export default Tabs;
