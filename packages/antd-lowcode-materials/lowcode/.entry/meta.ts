// 该文件由 scripts/build-lowcode-meta.mjs 自动生成，请勿手工修改。
// 作用等价于老 @alifd/build-plugin-lowcode 的 .tmp/meta.js 入口。
import AffixMeta from '../affix/meta';
import AlertMeta from '../alert/meta';
import AnchorlinkMeta from '../anchor.link/meta';
import AutoCompleteMeta from '../auto-complete/meta';
import AvatarMeta from '../avatar/meta';
import BackTopMeta from '../back-top/meta';
import BadgeMeta from '../badge/meta';
import BreadcrumbMeta from '../breadcrumb/meta';
import ButtonMeta from '../button/meta';
import CalendarMeta from '../calendar/meta';
import CardMeta from '../card/meta';
import CarouselMeta from '../carousel/meta';
import CascaderMeta from '../cascader/meta';
import CheckboxMeta from '../checkbox/meta';
import CheckboxgroupMeta from '../checkbox.group/meta';
import CollapseMeta from '../collapse/meta';
import CollapsepaneMeta from '../collapse.pane/meta';
import CommentMeta from '../comment/meta';
import ConfigProviderMeta from '../config-provider/meta';
import DatePickerMeta from '../date-picker/meta';
import DatePickerrangePickerMeta from '../date-picker.range-picker/meta';
import DescriptionsMeta from '../descriptions/meta';
import DescriptionsitemMeta from '../descriptions.item/meta';
import DividerMeta from '../divider/meta';
import DrawerMeta from '../drawer/meta';
import DropdownMeta from '../dropdown/meta';
import EmptyMeta from '../empty/meta';
import FormMeta from '../form/meta';
import FormitemMeta from '../form.item/meta';
import FormlistMeta from '../form.list/meta';
import GridcolMeta from '../grid.col/meta';
import GridrowMeta from '../grid.row/meta';
import IconMeta from '../icon/meta';
import ImageMeta from '../image/meta';
import InputMeta from '../input/meta';
import InputgroupMeta from '../input.group/meta';
import InputpasswordMeta from '../input.password/meta';
import InputsearchMeta from '../input.search/meta';
import InputtextAreaMeta from '../input.text-area/meta';
import InputNumberMeta from '../input-number/meta';
import ListMeta from '../list/meta';
import ListitemMeta from '../list.item/meta';
import ListitemmetaMeta from '../list.item.meta/meta';
import MentionsMeta from '../mentions/meta';
import MenuMeta from '../menu/meta';
import MenuitemMeta from '../menu.item/meta';
import MenuitemGroupMeta from '../menu.item-group/meta';
import MenusubMenuMeta from '../menu.sub-menu/meta';
import ModalMeta from '../modal/meta';
import PageHeaderMeta from '../page-header/meta';
import PaginationMeta from '../pagination/meta';
import PopconfirmMeta from '../popconfirm/meta';
import PopoverMeta from '../popover/meta';
import ProgressMeta from '../progress/meta';
import RadioMeta from '../radio/meta';
import RadiogroupMeta from '../radio.group/meta';
import RateMeta from '../rate/meta';
import ResultMeta from '../result/meta';
import SegmentedMeta from '../segmented/meta';
import SelectMeta from '../select/meta';
import SkeletonMeta from '../skeleton/meta';
import SliderMeta from '../slider/meta';
import SlotMeta from '../slot/meta';
import SpaceMeta from '../space/meta';
import SpinMeta from '../spin/meta';
import StatisticMeta from '../statistic/meta';
import StepsMeta from '../steps/meta';
import StepsstepMeta from '../steps.step/meta';
import SwitchMeta from '../switch/meta';
import TableMeta from '../table/meta';
import TabsMeta from '../tabs/meta';
import TabstabPaneMeta from '../tabs.tab-pane/meta';
import TagMeta from '../tag/meta';
import TimelineMeta from '../timeline/meta';
import TimelineitemMeta from '../timeline.item/meta';
import TimePickerMeta from '../time-picker/meta';
import TooltipMeta from '../tooltip/meta';
import TransferMeta from '../transfer/meta';
import TreeMeta from '../tree/meta';
import TreeSelectMeta from '../tree-select/meta';
import TypographylinkMeta from '../typography.link/meta';
import TypographyparagraphMeta from '../typography.paragraph/meta';
import TypographytextMeta from '../typography.text/meta';
import TypographytitleMeta from '../typography.title/meta';
import UploadMeta from '../upload/meta';

const componentCategorySort = {};
["通用","导航","信息输入","信息展示","信息反馈"]
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

function fillRealVersion(meta, packageName = "@alilc/antd-lowcode-materials", version = "1.2.2", basicLibraryVersion = {}) {
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

const componentMetas = [AffixMeta, AlertMeta, AnchorlinkMeta, AutoCompleteMeta, AvatarMeta, BackTopMeta, BadgeMeta, BreadcrumbMeta, ButtonMeta, CalendarMeta, CardMeta, CarouselMeta, CascaderMeta, CheckboxMeta, CheckboxgroupMeta, CollapseMeta, CollapsepaneMeta, CommentMeta, ConfigProviderMeta, DatePickerMeta, DatePickerrangePickerMeta, DescriptionsMeta, DescriptionsitemMeta, DividerMeta, DrawerMeta, DropdownMeta, EmptyMeta, FormMeta, FormitemMeta, FormlistMeta, GridcolMeta, GridrowMeta, IconMeta, ImageMeta, InputMeta, InputgroupMeta, InputpasswordMeta, InputsearchMeta, InputtextAreaMeta, InputNumberMeta, ListMeta, ListitemMeta, ListitemmetaMeta, MentionsMeta, MenuMeta, MenuitemMeta, MenuitemGroupMeta, MenusubMenuMeta, ModalMeta, PageHeaderMeta, PaginationMeta, PopconfirmMeta, PopoverMeta, ProgressMeta, RadioMeta, RadiogroupMeta, RateMeta, ResultMeta, SegmentedMeta, SelectMeta, SkeletonMeta, SliderMeta, SlotMeta, SpaceMeta, SpinMeta, StatisticMeta, StepsMeta, StepsstepMeta, SwitchMeta, TableMeta, TabsMeta, TabstabPaneMeta, TagMeta, TimelineMeta, TimelineitemMeta, TimePickerMeta, TooltipMeta, TransferMeta, TreeMeta, TreeSelectMeta, TypographylinkMeta, TypographyparagraphMeta, TypographytextMeta, TypographytitleMeta, UploadMeta];
const components = [];
const npmInfo = {"package":"@alilc/antd-lowcode-materials","version":"1.2.2"};

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
