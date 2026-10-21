import * as React from 'react';
import { useRef } from 'react';
import { OverlayProps } from '@alifd/next/types/overlay/index';
import { ProTableSettingOverlay } from './pro-table-setting-overlay';
import { useI18nBundle } from '@/provider';
import { ToggleIcon } from '@/components/toggle-icon';
import { ProTableColumnsSettingContext } from '@/components/pro-table/contexts/pro-table-columns-setting-context';

export interface ProTableSettingButtonProps {
  /**
   * 排序窗口属性，属性参考 Fusion Overlay
   */
  sortOverlayProps?: Partial<OverlayProps>;
}

const settingKeys = new Set(['sortRank', 'hidden', 'lock']);
export const ProTableSettingButton: React.FC<ProTableSettingButtonProps> = ({
  sortOverlayProps,
}) => {
  const [visible, setVisible] = React.useState(false);
  const { columnsSetting } = React.useContext(ProTableColumnsSettingContext);
  // React 19 要求 useRef 必须传初始值；ToggleIcon 转发的是 HTMLSpanElement ref
  const buttonRef = useRef<HTMLSpanElement | null>(null);
  const i18nBundle = useI18nBundle('ProTable');
  const hasSetting = React.useMemo(
    () =>
      Object.values(columnsSetting).some(
        (vo) => vo && Object.keys(vo).some((k) => settingKeys.has(k)),
      ),
    [columnsSetting],
  );
  return (
    <div>
      <ToggleIcon
        title={i18nBundle.settingButtonTooltip}
        type="table-setting"
        onClick={() => setVisible(!visible)}
        active={visible || hasSetting}
        ref={buttonRef}
      />
      {visible && (
        <ProTableSettingOverlay
          visible={visible}
          onRequestClose={(type) => type === 'docClick' && setVisible(false)}
          target={buttonRef.current}
          // @alifd/next 把 safeNode 声明为 ReactNode，但运行期与 target 一样接受 DOM 节点；
          // 其 .d.ts 类型偏窄，这里按真实契约传值并做一次断言（不放宽为 any）。
          safeNode={buttonRef.current as unknown as React.ReactNode}
          offset={[8, 8]}
          {...sortOverlayProps}
        />
      )}
    </div>
  );
};
ProTableSettingButton.displayName = 'ProTableSettingButton';
