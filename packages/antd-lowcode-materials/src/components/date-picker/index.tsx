import { DatePicker as OriginalDatePicker } from 'antd';
import { withDayjsProps } from '../../utils/hoc';

const OriginalRangePicker = OriginalDatePicker.RangePicker;

const DatePicker = withDayjsProps(OriginalDatePicker, [
  'defaultPickerValue',
  'defaultValue',
  'showTime.defaultValue',
  'value',
]);

const RangePicker = withDayjsProps(OriginalRangePicker, [
  'defaultPickerValue',
  'defaultValue',
  'showTime.defaultValue',
  'value',
]);

(DatePicker as any).RangePicker = RangePicker;

export default DatePicker;
