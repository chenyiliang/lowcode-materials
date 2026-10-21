import { Calendar as OriginalCalendar } from 'antd';
import { withDayjsProps } from '../../utils/hoc';

const Calendar = withDayjsProps(OriginalCalendar, [
  'defaultValue',
  'validRange',
  'value.defaultValue',
]);

export default Calendar;
