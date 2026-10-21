import {
  I18nBundlesNames,
  LocaleContext,
  LocaleContextValue,
  useI18nBundle,
  CustomI18nBundles,
  LanguageType,
  useLocaleContextValue,
  useLanguage,
} from '@/provider/contexts/locale-context';
import {
  ThemeContext,
  ThemeContextValue,
  ThemeType,
  useThemeContextValue,
} from '@/provider/contexts/theme-context';
import hoistNonReactStatics from 'hoist-non-react-statics';
import * as React from 'react';
import { ConfigProvider } from '@alifd/next';
import enUS from '@alifd/next/lib/locale/en-us';
import zhCN from '@alifd/next/lib/locale/zh-cn';

export type GlobalConfig = LocaleContextValue & ThemeContextValue;

export const GlobalConfigProvider: React.FC<{
  theme?: ThemeType;
  language?: LanguageType;
  i18nBundles?: CustomI18nBundles;
  // @types/react 19 起 React.FC 不再隐式包含 children，需显式声明
  children?: React.ReactNode;
}> = ({ theme: propsTheme, language, i18nBundles, children }) => {
  const themeContextValue = useThemeContextValue(propsTheme);
  const localeContextValue = useLocaleContextValue(language, i18nBundles);

  React.useEffect(() => {
    // propsTheme 可选，未指定时不覆盖当前主题（setTheme 需要 ThemeType）
    if (propsTheme) {
      themeContextValue.setTheme(propsTheme);
    }
  }, [propsTheme]);

  return (
    <LocaleContext.Provider value={localeContextValue}>
      <ThemeContext.Provider value={themeContextValue}>
        <ConfigProvider locale={localeContextValue.language === 'en-US' ? enUS : zhCN}>
          {children}
        </ConfigProvider>
      </ThemeContext.Provider>
    </LocaleContext.Provider>
  );
};

// React 19 移除了 propTypes，GlobalConfigProvider 的属性类型已由上面的 React.FC<{...}> 描述。

interface GlobalConfigOptions {
  /**
   * 使用的 i18nBundle 名称
   */
  i18nBundleName?: I18nBundlesNames;
}

interface GlobalHocOption extends GlobalConfigOptions {
  /**
   * 转换函数
   */
  transform?: (props: any) => any;
}

export const useGlobal = (options?: GlobalConfigOptions) => {
  const localeContextValue = React.useContext(LocaleContext);
  // 保持无条件调用（rules of hooks）；i18nBundleName 可选，未指定时 hook 内部返回 undefined
  const i18nBundle = useI18nBundle(options?.i18nBundleName);
  return React.useMemo(
    () => ({
      ...localeContextValue,
      i18nBundle,
    }),
    [localeContextValue, i18nBundle],
  );
};

export function withGlobal<Props>(
  ReactComp: React.ComponentType<Props & Partial<GlobalConfig>>,
  options?: GlobalHocOption,
) {
  const { transform, ...others } = options ?? {};
  const Comp = React.forwardRef<unknown, Props>((props, ref) => {
    const globalConfig = useGlobal(others);
    const newProps = transform ? transform(props) : props;

    const componentProps = {
      language: globalConfig.language,
      i18nBundle: globalConfig.i18nBundle,
      ...newProps,
      ref,
    };

    return <ReactComp {...componentProps} />;
  });
  hoistNonReactStatics(Comp, ReactComp);
  // 由于 displayName 在 React 属性中，不会被 hoistNonReactStatics 复制，需要单独处理
  Comp.displayName = ReactComp.displayName;
  return Comp;
}

export function withBizGlobal<Props>(
  ReactComp: React.ComponentType<Props & Partial<LocaleContextValue>>,
  options?: {
    i18nBundles: any;
  },
) {
  const { i18nBundles = {} } = options ?? {};
  const Comp = React.forwardRef<unknown, Props>((props, ref) => {
    const language = useLanguage();

    let i18nBundle = {};
    if (language === 'en-US') {
      i18nBundle = {
        ...i18nBundles['zh-CN'],
        ...i18nBundles['en-US'],
      };
    } else {
      i18nBundle = i18nBundles['zh-CN'];
    }

    const componentProps = {
      language,
      i18nBundle,
      ...props,
      ref,
    };

    // 泛型 HOC 向被包裹组件注入 language / i18nBundle，而 Props 是任意类型，
    // TS 无法证明注入后的对象满足 Props，这里按 ReactComp 的入参类型断言（HOC 惯例）。
    return <ReactComp {...(componentProps as Props & Partial<LocaleContextValue>)} />;
  });

  hoistNonReactStatics(Comp, ReactComp);
  // 由于 displayName 在 React 属性中，不会被 hoistNonReactStatics 复制，需要单独处理
  Comp.displayName = ReactComp.displayName;
  return Comp;
}
