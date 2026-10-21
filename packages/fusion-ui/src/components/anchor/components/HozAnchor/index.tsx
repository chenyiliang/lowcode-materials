import * as React from 'react';
import cx from 'classnames';
import { Affix } from '@alifd/next';
import { Segment } from '@/components/segment';
import { AnchorProps } from '../../index';
import { startListen, removeListen, jumpToNode, AnchorContainer } from '../../util';

export class HozAnchor extends React.Component<Omit<AnchorProps, 'direction'>> {
  state = {
    currentValue: '',
    container: null as AnchorContainer | null,
  };

  // React 19 要求 createRef 传类型参数；Affix 是 ConfiguredComponent（值而非类型），
  // 用 ComponentRef 取其实例类型。
  affixRef = React.createRef<React.ComponentRef<typeof Affix>>();

  componentDidMount() {
    const { dataSource, container, offsetY } = this.props;
    // container 是可选的（AnchorProps.container?），运行期由 Anchor 包装后注入
    const _container = container ? (container() as AnchorContainer) : null;
    startListen(dataSource, () => _container, this.updateCurrentValue, {
      offsetY,
    });
    this.setState({
      container: _container,
    });
  }

  componentWillUnmount() {
    const { dataSource } = this.props;
    const { container } = this.state;
    removeListen(dataSource, () => container);
  }

  updateCurrentValue = (newValue: string) => {
    if (newValue === this.state.currentValue) {
      return;
    }
    this.setState({
      currentValue: newValue,
    });
  };

  onChange = (newValue: string) => {
    const { onChange } = this.props;
    const status = onChange && onChange(newValue);
    if (status !== false) {
      this.setState({
        currentValue: newValue,
      });
      jumpToNode(newValue);
    }
  };

  render() {
    const { dataSource, className, style, hasAffix, affixProps, containerRef, offsetY } = this.props;
    const { container } = this.state;
    const { currentValue } = this.state;

    const classes = cx({
      'fusion-ui-anchor-hoz': true,
      // className 可能为 undefined，计算属性名不能是 undefined，故仅在存在时加入
      ...(className ? { [className]: true } : {}),
    });

    const segmentDataSource = dataSource.map((item) => ({
      label: item.label,
      value: item.htmlId,
    }));

    const anchorEl = (
      <div ref={containerRef} style={style} className={classes}>
        <Segment
          size="large"
          type="primary"
          value={currentValue}
          dataSource={segmentDataSource}
          onChange={this.onChange}
        />
      </div>
    );

    if (hasAffix) {
      // Affix 实例上存在（未在类型中声明的）内部实例与私有方法，这里按结构读取
      const affixInstance = this.affixRef?.current as unknown as
        | { getInstance?: () => { _setEventHandlerForContainer?: (...args: unknown[]) => void } }
        | null;
      const self = affixInstance?.getInstance?.();
      // FIXME: 为了解决一个页面多个 affix 会导致除最后一个 affix 外其余 affix 失效的问题，需要手动重新设置监听事件，
      // 但调用了 affix 的内部方法，如果 affix 新版本的这个内部方法有变动，则需要加上兼容逻辑
      const func = self?._setEventHandlerForContainer;
      if (typeof func === 'function') {
        func.call(self, () => container);
      }
      removeListen(dataSource, () => container)
      startListen(dataSource, () => container, this.updateCurrentValue, {
        offsetY,
      });


      return (
        <Affix ref={this.affixRef} className="fusion-ui-anchor-hoz-affix" container={() => container as Element} {...affixProps}>
          {anchorEl}
        </Affix>
      );
    }

    return anchorEl;
  }
}
