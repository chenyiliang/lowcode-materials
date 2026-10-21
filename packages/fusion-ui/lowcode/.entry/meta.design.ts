// 该文件由 scripts/build-lowcode-meta.mjs 自动生成，请勿手工修改。
// 作用等价于老 @alifd/build-plugin-lowcode 的 .tmp/meta.js 入口。
import AnchorMeta from '../anchor/meta';
import AnchorFormMeta from '../anchor-form/meta';
import AreaChartMeta from '../area-chart/meta';
import BarChartMeta from '../bar-chart/meta';
import CascaderSelectMeta from '../cascader-select/meta';
import CheckboxGroupMeta from '../checkbox-group/meta';
import ChildFormMeta from '../child-form/meta';
import ColumnChartMeta from '../column-chart/meta';
import DatePickerMeta from '../date-picker/meta';
import DonutChartMeta from '../donut-chart/meta';
import EditTableMeta from '../edit-table/meta';
import ExpandTableMeta from '../expand-table/meta';
import FilterMeta from '../filter/meta';
import FilterItemMeta from '../filter-item/meta';
import GroupTableMeta from '../group-table/meta';
import InputMeta from '../input/meta';
import LineChartMeta from '../line-chart/meta';
import MonthPickerMeta from '../month-picker/meta';
import NumberPickerMeta from '../number-picker/meta';
import PageHeaderMeta from '../page-header/meta.design';
import PieChartMeta from '../pie-chart/meta';
import ProDialogMeta from '../pro-dialog/meta';
import ProDrawerMeta from '../pro-drawer/meta';
import ProFormMeta from '../pro-form/meta';
import ProTableMeta from '../pro-table/meta';
import ProTableSlotMeta from '../pro-table-slot/meta';
import RadioGroupMeta from '../radio-group/meta';
import RangePickerMeta from '../range-picker/meta';
import RatingMeta from '../rating/meta';
import SelectMeta from '../select/meta';
import StepFormMeta from '../step-form/meta';
import StoryPlaceholderMeta from '../story-placeholder/meta';
import TabContainerMeta from '../tab-container/meta';
import TreeSelectMeta from '../tree-select/meta';
import UploadMeta from '../upload/meta';
import WeekPickerMeta from '../week-picker/meta';
import YearPickerMeta from '../year-picker/meta';

const componentCategorySort = {};
["基础元素","布局容器类","表格类","表单详情类","帮助类","对话框类","业务类","通用","引导","信息输入","信息展示","信息反馈"]
  .reverse()
  .forEach((item, index) => {
    componentCategorySort[item] = ++index;
  });

function generateComponentList(components) {
  const componentList = [
    { title: '常用', icon: '', children: [] },
    { title: '容器', icon: '', children: [] },
    { title: '导航', icon: '', children: [] },
    { title: '内容', icon: '', children: [] },
    { title: 'Feedback 反馈', icon: '', children: [] },
  ];

  const groupMap = { 原子组件: true };
  const compGroup = {};

  components.forEach((comp) => {
    const category = comp.category || '其他';
    if (comp.group && !compGroup[comp.componentName]) {
      compGroup[comp.componentName] = comp.group;
    }
    if (comp.group && !groupMap[comp.group]) {
      groupMap[comp.group] = true;
    }
    let target = componentList.find((item) => item.title === category);
    if (!target) {
      target = { title: category, icon: '', children: [] };
      componentList.push(target);
    }
    if (comp.snippets && comp.snippets.length) {
      target.children.push({
        componentName: comp.componentName,
        title: comp.title || comp.componentName,
        sort: {
          category: target.title,
          group: compGroup[comp.componentName] || '原子组件',
          priority: componentCategorySort[target.title] || 0,
        },
        icon: '',
        package: comp.npm.pkg,
        snippets: comp.snippets || [],
      });
    }
  });
  return componentList;
}

function fillRealVersion(meta, packageName = "@alifd/fusion-ui", version = "2.1.0", basicLibraryVersion = {}) {
  if (!meta || !version) return meta;
  const { npm } = meta;
  if (!npm) return meta;
  if (typeof basicLibraryVersion === 'object' && basicLibraryVersion[npm.package]) {
    meta.npm = { ...npm, version: basicLibraryVersion[npm.package] };
  } else if (npm.package === packageName) {
    meta.npm = { ...npm, version };
  }
  return meta;
}

const componentMetas = [AnchorMeta, AnchorFormMeta, AreaChartMeta, BarChartMeta, CascaderSelectMeta, CheckboxGroupMeta, ChildFormMeta, ColumnChartMeta, DatePickerMeta, DonutChartMeta, EditTableMeta, ExpandTableMeta, FilterMeta, FilterItemMeta, GroupTableMeta, InputMeta, LineChartMeta, MonthPickerMeta, NumberPickerMeta, PageHeaderMeta, PieChartMeta, ProDialogMeta, ProDrawerMeta, ProFormMeta, ProTableMeta, ProTableSlotMeta, RadioGroupMeta, RangePickerMeta, RatingMeta, SelectMeta, StepFormMeta, StoryPlaceholderMeta, TabContainerMeta, TreeSelectMeta, UploadMeta, WeekPickerMeta, YearPickerMeta];
const components = [];
const npmInfo = {"package":"@alifd/fusion-ui","version":"2.1.0"};

componentMetas.forEach((meta) => {
  // 兼容三种形态：数组、{ components: [] }、单个 meta 对象
  const list = Array.isArray(meta)
    ? meta
    : meta && meta.components
      ? meta.components
      : [meta];

  list.forEach((item) => {
    if (!item) return;
    if (!item.npm) {
      const { componentName } = item;
      const names = String(componentName).split('.');
      const [exportName, subName] = names;
      item.npm = {
        exportName,
        main: '',
        destructuring: true,
        subName: names.length > 1 ? componentName.slice(componentName.indexOf('.') + 1) : subName,
      };
    }
    item.npm = { ...npmInfo, ...(item.npm || {}) };
    components.push(fillRealVersion(item));
  });
});

const componentList = generateComponentList(components);

// 只保留具名导出，与老插件 UMD 产物（window[metaExportName] = { components, componentList }）一致
export { components, componentList };
