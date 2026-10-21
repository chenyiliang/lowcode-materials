import React from 'react';
import { ConfigProvider as OriginalConfigProvider } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import zhCN from 'antd/es/locale/zh_CN';

const ConfigProvider = (props: any) => {
  const { locale, ...rest } = props;

  let localeData = locale;
  if (typeof locale === 'string') {
    if (locale.toLowerCase() === 'zh-cn') {
      // antd 5/6 内部用 dayjs，locale 也改成 dayjs 的
      dayjs.locale('zh-cn');
      localeData = zhCN;
    } else if (locale.toLowerCase() === 'en-us') {
      dayjs.locale('en');
      // 默认为英文
      localeData = undefined;
    }
  }

  return <OriginalConfigProvider locale={localeData} {...rest} />;
};

export default ConfigProvider;
