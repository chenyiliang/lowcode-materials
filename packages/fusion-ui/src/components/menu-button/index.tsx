import React from 'react';
import classnames from 'classnames';
import { Menu, MenuProps } from '@/components/menu';
import { Overlay, Icon, Button } from '@alifd/next';
import { func } from '@/utils/util';
import { MenuButtonProps as NextMenuButtonProps } from '@alifd/next/types/menu-button';

const { Popup } = Overlay;

export interface MenuButtonProps extends NextMenuButtonProps {
  /**
   * 下拉菜单数据源
   */
  dataSource?: MenuProps['dataSource'];
  /**
   * 以下三个回调在 @alifd/next 的 .d.ts 里被（不精确地）声明为 `() => void`，
   * 但运行期会带上参数。这里按真实调用签名覆盖，避免 TS2556 展开报错。
   */
  onItemClick?: (key: string, ...args: unknown[]) => void;
  onSelect?: (keys: string[], ...args: unknown[]) => void;
  onVisibleChange?: (visible: boolean, type: string | object, e?: object) => void;
}

export interface MenuButtonState {
  visible?: boolean;
  // selectedKeys 可能是单个 key 或 key 数组（对齐 @alifd/next Menu 的 selectedKeys 类型）
  selectedKeys?: string | string[];
}

/**
 * MenuButton
 */
export class MenuButton extends React.Component<MenuButtonProps, MenuButtonState> {
  static displayName = 'MenuButton';

  static defaultProps = {
    prefix: 'fusion-ui-',
    autoWidth: true,
    popupTriggerType: 'click',
    onVisibleChange: func.noop,
    onItemClick: func.noop,
    onSelect: func.noop,
    defaultSelectedKeys: [],
    menuProps: {},
    dataSource: [],
  };

  // Popup 触发器节点 / Menu 实例的 ref。原实现是隐式 any 的实例属性。
  // Popup 的 ref 回调拿到的是组件实例（其 offsetWidth 在运行期可能不存在，与原逻辑一致），
  // 这里按结构类型收窄到真正被访问的属性，不放宽为 any。
  node: unknown = null;
  menu: { style?: CSSStyleDeclaration } | null = null;

  static getDerivedStateFromProps(props: MenuButtonProps) {
    const st: Partial<MenuButtonState> = {};

    if ('visible' in props) {
      st.visible = props.visible;
    }

    if ('selectedKeys' in props) {
      st.selectedKeys = props.selectedKeys;
    }

    return st;
  }

  constructor(props: MenuButtonProps) {
    super(props);
    this.state = {
      selectedKeys: props.defaultSelectedKeys as string[] | undefined,
      visible: props.defaultVisible,
    };
  }

  clickMenuItem = (key: string, ...others: unknown[]) => {
    const { selectMode } = this.props;

    this.props.onItemClick?.(key, ...others);

    if (selectMode === 'multiple') {
      return;
    }

    this.onPopupVisibleChange(false, 'menuSelect');
  };

  selectMenu = (keys: string[], ...others: unknown[]) => {
    if (!('selectedKeys' in this.props)) {
      this.setState({
        selectedKeys: keys,
      });
    }
    this.props.onSelect?.(keys, ...others);
  };

  onPopupOpen = () => {
    // 原实现 this.node 是 Popup ref（组件实例），在其上读 offsetWidth —— 这里保持原样，
    // 仅按结构类型取值（运行期语义不变）。
    const button = this.node as { offsetWidth?: number } | null;
    if (this.props.autoWidth && button && this.menu && this.menu.style) {
      this.menu.style.width = `${button.offsetWidth}px`;
    }
  };

  onPopupVisibleChange = (visible: boolean, type: string | object, e?: object) => {
    if (!('visible' in this.props)) {
      this.setState({
        visible,
      });
    }
    this.props.onVisibleChange?.(visible, type, e);
  };

  _menuRefHandler = (ref: unknown) => {
    this.menu = ref as MenuButton['menu'];

    const refFn = this.props.menuProps?.ref;
    // menuProps.ref 可能是回调 ref，运行期透传 Menu 实例；这里按函数调用并透传原值。
    if (typeof refFn === 'function') {
      (refFn as (instance: unknown) => void)(ref);
    }
  };

  render() {
    const {
      prefix,
      style,
      className,
      label,
      popupTriggerType,
      popupContainer,
      popupStyle,
      popupClassName,
      popupProps,
      followTrigger,
      selectMode,
      menuProps,
      dataSource,
      children,
      // 未用到的 props
      onSelect,
      defaultSelectedKeys,
      onVisibleChange,
      autoWidth,
      onItemClick,
      ...others
    } = this.props;

    const { visible, selectedKeys } = this.state;

    const classNames = classnames(
      {
        [`${prefix}menu-btn`]: true,
        [`${prefix}expand`]: visible,
        opened: visible,
      },
      className,
    );

    const popupClassNames = classnames({
      // popupClassName 可能为 undefined，计算属性名不能是 undefined，故仅在存在时才加入
      ...(popupClassName ? { [popupClassName]: true } : {}),
      [`${prefix}menu-btn-popup`]: true,
    });

    const trigger = (
      <Button style={style} className={classNames} {...others}>
        {label} <Icon type="arrow-down" className={`${prefix}menu-btn-arrow`} />
      </Button>
    );

    return (
      <Popup
        followTrigger={followTrigger}
        visible={visible}
        onVisibleChange={this.onPopupVisibleChange}
        trigger={trigger}
        triggerType={popupTriggerType}
        container={popupContainer}
        onOpen={this.onPopupOpen}
        ref={(node) => {
          this.node = node;
        }}
        style={popupStyle}
        className={popupClassNames}
        {...popupProps}
      >
        <div className={`${prefix}menu-btn-spacing-tb`}>
          <Menu
            {...menuProps}
            ref={this._menuRefHandler}
            selectedKeys={selectedKeys}
            selectMode={selectMode}
            onSelect={this.selectMenu}
            onItemClick={this.clickMenuItem}
            dataSource={dataSource}
          />
        </div>
      </Popup>
    );
  }
}
