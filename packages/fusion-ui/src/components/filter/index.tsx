import * as React from 'react';
import { Button, Checkbox, Overlay, Form } from '@alifd/next';
import cn from 'classnames';
import { Space, Grid, GridProps } from '@/components/container';
import compact from 'lodash/compact';
import { useI18nBundle } from '@/provider';
import type { FormProps } from '@alifd/next/types/form';
// react-beautiful-dnd 已停止维护，其 peerDependencies 只允许 react <=18，在 React 19 下会冲突；
// @hello-pangea/dnd 是官方推荐的维护版分叉，API 完全一致（drop-in），且 peer 支持 react ^19。
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
  type DraggableProvided,
  type DraggableStateSnapshot,
  type DroppableProvided,
  type DroppableStateSnapshot,
} from '@hello-pangea/dnd';
import { ToggleIcon, CustomIcon } from '@/components/toggle-icon';
import { formatFormItems } from '@/components/pro-form/layouts/pro-form';
import Operations from '@/common/operations';

const { useState, useEffect, useRef, cloneElement } = React;
// @alifd/next/types/form 只导出 ItemProps 类型，运行时 Form.Item 才是组件本身，
// 直接用 typeof Form.Item 推断类型。
export const FilterItem: typeof Form.Item = Form.Item;

interface IFilterConfig {
  key: string;
  visible: boolean;
  index: number;
}
export interface FilterProps extends GridProps {
  /**
   * 是否展开，受控
   */
  expand?: boolean;
  /**
   * 是否默认展开，非受控
   */
  defaultExpand?: boolean;
  /**
   * 最多显示几行元素，超出部分将会提供「展开/收起」按钮
   */
  visibleRowCount?: number;
  /**
   * 是否开启配置筛选项
   */
  enableFilterConfiguration?: boolean;
  /**
   * 配置保存在本地 localStorage 中的 key，请确定为全局唯一
   * 建议命名方法为：业务域_产品_页面
   */
  configStorageKey?: string;
  /**
   * 展开收起回调
   */
  onExpand?: (expand: boolean) => void;
  /**
   * 是否显示「展开/收起」按钮
   * @default false
   */
  hideExpandButton?: boolean;
  /**
   * 是否显示默认的「查询/重置」按钮
   * @default false
   */
  hideDefaultButtons?: boolean;
  /**
   * 是否开启表单能力，开启后会使用 fusion Form 组件进行子元素管理
   */
  enableForm?: boolean;
  /**
   * fusion form 的 api
   * @see {@link https://fusion.alibaba-inc.com/pc/component/form?themeid=2#API}
   */
  formProps?: FormProps;
  /**
   * 按钮漕位渲染
   */
  buttons?: {
    /**
     * 点击主按钮回调
     * @deprecated 请使用 props.onSearch
     */
    onSearch?: (val: string) => void;
    /**
     * 点击次按钮回调
     * @deprecated 请使用 props.onReset
     */
    onReset?: () => void;
    /**
     * 自定义渲染
     * @deprecated 请使用 props.buttonRender
     */
    render?: () => React.ReactNode;
  };
  /**
   * 点击主按钮回调
   */
  onSearch?: (val: string) => void;
  /**
   * 点击次按钮回调
   */
  onReset?: () => void;
  /**
   * 右下角操作区槽位自定义渲染
   */
  buttonRender?: () => React.ReactNode;
  operations?: object[];
  operationConfig?: object;
}

// React 19 移除了函数组件的 defaultProps。原来的默认值里有些（cols/rowGap/formProps/responsive）
// 需要落在 `...others` 里透传给下游 Grid，所以先合并默认值再解构，保证 others 仍带上它们。
const FILTER_DEFAULT_PROPS: Partial<FilterProps> = {
  buttons: {},
  defaultExpand: false,
  expand: undefined,
  cols: 4,
  visibleRowCount: 1,
  rowGap: 12,
  enableFilterConfiguration: false,
  onExpand: () => {},
  formProps: {},
  responsive: false,
  hideDefaultButtons: false,
  hideExpandButton: false,
  enableForm: false,
};

const Filter: React.FC<FilterProps> = (rawProps: FilterProps) => {
  const {
    expand: propsExpand,
    defaultExpand,
    hideExpandButton,
    buttons = {},
    onExpand,
    hideDefaultButtons,
    visibleRowCount = 1,
    enableFilterConfiguration,
    configStorageKey = window.location?.pathname,
    children,
    enableForm,
    operations,
    operationConfig,
    ...others
  } = { ...FILTER_DEFAULT_PROPS, ...rawProps };
  const { cols: propsCols } = others;
  const [cols, setCols] = useState(propsCols);
  const onSearch = others.onSearch || buttons.onSearch;
  const onReset = others.onReset || buttons.onReset;
  const buttonRender = others.buttonRender || buttons.render;
  const visibleItemCount = (cols ?? 0) * visibleRowCount;
  const i18nBundle = useI18nBundle('Filter');
  // React 19 要求 useRef 必须传初始值
  const overlayRef = useRef<HTMLSpanElement | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [expand, setExpand] = useState(defaultExpand);
  // 对子元素重排
  const rearrange = (c: any) => {
    const iChildren = React.Children.toArray(c);
    if (!enableFilterConfiguration) return { c: iChildren, meta: null };
    const configs: IFilterConfig[] = JSON.parse(localStorage.getItem(configStorageKey) || '[]');
    const foundItems: any[] = [];
    const notFoundItems: any[] = [];
    // config 的 item 包含三个属性 key、visible
    iChildren.forEach((element) => {
      if (!React.isValidElement(element)) return;
      const props = element.props as {
        formItemProps?: { primaryKey?: string; label?: React.ReactNode };
        title?: string;
        label?: string;
      };
      const key = props?.formItemProps?.primaryKey || props?.title || props?.label;
      let indexInConfig: number | undefined;
      const itemInConfigs = configs.find((item, i) => {
        if (item.key === key) {
          indexInConfig = i;
          return true;
        }
        return false;
      });
      if (itemInConfigs && indexInConfig !== undefined) {
        foundItems[indexInConfig] =
          itemInConfigs.visible === false
            ? cloneElement(element, {
                invisible: true,
              } as Partial<unknown>)
            : element;
      } else {
        notFoundItems.push(element);
      }
    });
    const newChildren = foundItems.concat(notFoundItems);
    return {
      c: newChildren,
      meta: newChildren.map((element, index) => {
        const props = (React.isValidElement(element) ? element.props : {}) as {
          formItemProps?: { primaryKey?: string; label?: React.ReactNode };
          title?: string;
          label?: string;
        };
        const key = props?.formItemProps?.primaryKey || props?.title || props?.label;
        const label = props?.formItemProps?.label || props?.title || props?.label;
        const config = configs.find((item) => item.key === key);
        return {
          // key 可能来自 title/label（string|undefined）；dnd 的 draggableId 要求 string，
          // 缺省时用下标兜底，保证唯一。
          key: key ?? `__filter_item_${index}`,
          label,
          visible: config?.visible === undefined ? true : config.visible,
        };
      }),
    };
  };
  const [fieldsMeta, setFieldsMeta] = useState(compact(rearrange(children).meta));
  const { c, meta } = rearrange(children);
  useEffect(() => {
    setFieldsMeta(compact(rearrange(children).meta));
  }, [children]);
  // expand 受控模式
  useEffect(() => {
    if (propsExpand !== undefined) {
      setExpand(propsExpand);
    }
  }, [propsExpand]);
  // 展开收起切换
  const onToggleExpand = () => {
    onExpand?.(!expand);
    setExpand(!expand);
  };
  const getItemStyle = (isDragging: any, draggableStyle: any) => ({
    boxShadow: isDragging ? '0 1px 3px rgba(0, 0, 0, .1)' : 'none',
    ...draggableStyle,
  });
  // 拖拽配置项结束
  const onConfiguratorDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }
    const iMeta = Array.from(fieldsMeta);
    const [removed] = iMeta.splice(result.source.index, 1);
    iMeta.splice(result.destination.index, 0, removed);

    if (enableFilterConfiguration) {
      localStorage.setItem(configStorageKey, JSON.stringify(iMeta));
    }
    setFieldsMeta(iMeta);
  };
  /**
   * 控制过滤项是否可见
   * @param key 过滤条件
   * @param visible 是否可见
   */
  const onFilterItemVisibleChange = (key: string, visible: boolean) => {
    const iMeta = Array.from(fieldsMeta);
    iMeta.find((item) => {
      if (item.key === key) {
        item.visible = visible;
        return true;
      }
      return false;
    });
    if (enableFilterConfiguration) {
      localStorage.setItem(configStorageKey, JSON.stringify(iMeta));
    }
    setFieldsMeta(iMeta);
  };
  // 渲染操作「主」、「次」按钮
  const renderDefaultBtns = () => {
    const submitBtn = (
      <Form.Submit type="primary" validate onClick={(value) => onSearch?.(value as string)}>
        {i18nBundle.primaryBtnText}
      </Form.Submit>
    );
    const resetBtn = <Form.Reset onClick={() => onReset?.()}>{i18nBundle.secondaryBtnText}</Form.Reset>;
    return [submitBtn, resetBtn];
  };
  // 渲染配置筛选项弹窗
  const renderConfigurator = () => {
    return (
      <div>
        <ToggleIcon
          onClick={() => setOverlayVisible((vo) => !vo)}
          active={overlayVisible}
          type="table-setting"
          ref={overlayRef}
        />
        <Overlay
          visible={overlayVisible}
          target={() => overlayRef.current}
          // @alifd/next 把 safeNode 声明为 ReactNode，但运行期与 target 一样接受
          // 「返回 ref 的函数」（其 .d.ts 类型偏窄）。这里按真实契约传函数并做一次
          // 类型断言（不放宽为 any），保持原有行为。
          safeNode={(() => overlayRef.current) as unknown as React.ReactNode}
          onRequestClose={() => setOverlayVisible(false)}
        >
          <div className="fusion-ui-filter-configurator">
            <div className="fusion-ui-filter-configurator-title">
              <span>切换显示与排序</span>
              <CustomIcon type="close" size="small" onClick={() => setOverlayVisible(false)} />
            </div>
            <DragDropContext onDragEnd={onConfiguratorDragEnd}>
              <Droppable droppableId="droppable">
                {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={cn(
                      'fusion-ui-filter-configurator-body',
                      snapshot.isDraggingOver && 'dragover',
                    )}
                  >
                    {(meta ?? []).map((field, i) => (
                      <Draggable key={field.key} draggableId={field.key} index={i}>
                        {(
                          draggableProvided: DraggableProvided,
                          iSnapshot: DraggableStateSnapshot,
                        ) => (
                          <div
                            className={cn(
                              'fusion-ui-filter-configurator-item',
                              iSnapshot.isDragging && 'dragging',
                            )}
                            ref={draggableProvided.innerRef}
                            {...draggableProvided.draggableProps}
                            style={getItemStyle(
                              iSnapshot.isDragging,
                              draggableProvided.draggableProps.style,
                            )}
                          >
                            <Checkbox
                              checked={field.visible}
                              onChange={(checked) => onFilterItemVisibleChange(field.key, checked)}
                            >
                              {field.label}
                            </Checkbox>
                            <span {...draggableProvided.dragHandleProps}>
                              <CustomIcon type="drag" size="small" />
                            </span>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </Overlay>
      </div>
    );
  };
  const renderChildren = () => {
    return compact(
      c.map((item, index) => {
        const exceedVisibleItemCount: boolean = index > visibleItemCount - 1;
        // 子元素不可见
        const itemInvisible = exceedVisibleItemCount && !expand;
        if (itemInvisible || item?.props?.invisible) return null;
        return item;
      }),
    );
  };
  // 渲染操作按钮
  const renderOperator = () => {
    const childrenCount = compact(c.map((item) => (item.props.invisible ? null : item))).length;
    const alignLeft = childrenCount <= (cols ?? 0) - 1;
    const expandBtnVisible = !hideExpandButton && childrenCount > visibleItemCount;
    const operationsProps = { operations, operationConfig, renderDefaultBtns };
    return (
      <div
        className={cn('fusion-ui-filter-buttons', {
          left: alignLeft,
          'has-more': expandBtnVisible,
        })}
        style={{ gridColumnEnd: alignLeft ? 'auto' : '-1' }}
      >
        <Space split>
          {/* 配置筛选项 */}
          {enableFilterConfiguration && renderConfigurator()}
          {/* 用户自定义的 button render */}
          {buttonRender ? (
            <Space className="btns">
              {hideDefaultButtons ? (
                buttonRender()
              ) : (
                <>
                  {buttonRender()}
                  <Operations {...operationsProps} />
                </>
              )}
            </Space>
          ) : (
            <div className="btns">
              <Operations {...operationsProps} />
            </div>
          )}
          {/* 展开收起 */}
          {expandBtnVisible && (
            <Button
              text
              className="inside-button"
              onClick={onToggleExpand}
              type={expand ? 'normal' : 'primary'}
            >
              <span>{expand ? i18nBundle.hidden : i18nBundle.expand}</span>
              <CustomIcon
                type={expand ? 'triangle-up' : 'triangle-down'}
                size="xs"
                style={{ marginLeft: 2 }}
              />
            </Button>
          )}
        </Space>
      </div>
    );
  };

  const _children = renderChildren();

  const content = (
    <Grid
      splot={renderOperator()}
      {...others}
      className="fusion-ui-filter"
      onColumnChange={setCols}
      cols={propsCols}
      responsive={false}
      rowGap={0}
      columnGap={16}
    >
      {formatFormItems(_children, {
        columns: propsCols,
        ...others,
      })}
    </Grid>
  );

  return <Form {...others}>{content}</Form>;
};

export { Filter };
