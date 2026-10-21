import moment from 'moment';
import { Calendar } from '@alifd/next';

interface CalendarWrapperProps {
  __designMode?: string;
  defaultValue?: unknown;
  value?: unknown;
  [key: string]: unknown;
}

export default (props: CalendarWrapperProps = {}) => {
  const { __designMode, defaultValue, value, ...otherProps } = props || {};
  const finalValue = __designMode === 'design' ? defaultValue : value;
  const finalProps: Record<string, unknown> = { ...otherProps };
  if (finalValue) {
    finalProps.value = typeof finalValue === 'string' ? moment(finalValue) : finalValue;
  }
  if (defaultValue) {
    finalProps.defaultValue =
      typeof defaultValue === 'string' ? moment(defaultValue) : defaultValue;
  }
  return <Calendar {...finalProps} />;
};
