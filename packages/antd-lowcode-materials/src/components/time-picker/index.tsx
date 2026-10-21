import { TimePicker as OriginalTimePicker } from 'antd';
import { withDayjsProps } from '../../utils/hoc';

const TimePicker = withDayjsProps(OriginalTimePicker, [
  'defaultValue',
  'value',
]);

export default TimePicker;
