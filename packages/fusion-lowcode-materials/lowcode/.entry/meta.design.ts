// 该文件由 scripts/build-lowcode-meta.mjs 自动生成，请勿手工修改。
// 作用等价于老 @alifd/build-plugin-lowcode 的 .tmp/meta.js 入口。
import AlertMeta from '../alert/meta.design';
import AvatarMeta from '../avatar/meta.design';
import BadgeMeta from '../badge/meta.design';
import BalloonMeta from '../balloon/meta.design';
import BalloonInnerMeta from '../balloon-inner/meta';
import BoxMeta from '../box/meta.design';
import BreadcrumbMeta from '../breadcrumb/meta.design';
import BreadcrumbItemMeta from '../breadcrumb-item/meta';
import ButtonMeta from '../button/meta.design';
import ButtonGroupMeta from '../button-group/meta';
import CalendarMeta from '../calendar/meta.design';
import CardMeta from '../card/meta';
import CardActionsMeta from '../card-actions/meta';
import CardBulletHeaderMeta from '../card-bullet-header/meta';
import CardCollaspeContentMeta from '../card-collaspe-content/meta';
import CardContentMeta from '../card-content/meta';
import CardDividerMeta from '../card-divider/meta';
import CardHeaderMeta from '../card-header/meta';
import CardMediaMeta from '../card-media/meta';
import CascaderMeta from '../cascader/meta.design';
import CascaderSelectMeta from '../cascader-select/meta.design';
import CheckboxMeta from '../checkbox/meta.design';
import CheckboxGroupMeta from '../checkbox-group/meta.design';
import CheckboxItemMeta from '../checkbox-item/meta';
import CollapseMeta from '../collapse/meta.design';
import CollapsePanelMeta from '../collapse-panel/meta';
import DatePickerMeta from '../date-picker/meta.design';
import DialogMeta from '../dialog/meta.design';
import DivMeta from '../div/meta';
import DividerMeta from '../divider/meta.design';
import DrawerMeta from '../drawer/meta.design';
import DrawerInnerMeta from '../drawer-inner/meta';
import DropdownMeta from '../dropdown/meta';
import ErrorBoundaryMeta from '../error-boundary/meta';
import FieldMeta from '../field/meta';
import FormMeta from '../form/meta';
import FormErrorMeta from '../form-error/meta';
import FormItemMeta from '../form-item/meta';
import FormResetMeta from '../form-reset/meta';
import FormSubmitMeta from '../form-submit/meta';
import GroupMeta from '../group/meta';
import IconMeta from '../icon/meta.design';
import ImgMeta from '../img/meta';
import InnerMeta from '../inner/meta';
import InputMeta from '../input/meta.design';
import InputGroupMeta from '../input-group/meta';
import InputPasswordMeta from '../input-password/meta';
import InputTextAreaMeta from '../input-text-area/meta';
import LinkMeta from '../link/meta.design';
import ListMeta from '../list/meta';
import ListItemMeta from '../list-item/meta';
import LoadingMeta from '../loading/meta.design';
import MenuMeta from '../menu/meta.design';
import MenuButtonMeta from '../menu-button/meta.design';
import MenuDividerMeta from '../menu-divider/meta';
import MenuGroupMeta from '../menu-group/meta';
import MenuItemMeta from '../menu-item/meta';
import MenuPopupItemMeta from '../menu-popup-item/meta';
import MonthPickerMeta from '../month-picker/meta';
import NavMeta from '../nav/meta';
import NavItemMeta from '../nav-item/meta';
import NextTableMeta from '../next-table/meta';
import NextTextMeta from '../next-text/meta';
import NoteWrapperMeta from '../note-wrapper/meta';
import NumberPickerMeta from '../number-picker/meta.design';
import PaginationMeta from '../pagination/meta.design';
import ParagraphMeta from '../paragraph/meta.design';
import PopupItemMeta from '../popup-item/meta';
import ProgressMeta from '../progress/meta.design';
import RadioMeta from '../radio/meta.design';
import RadioGroupMeta from '../radio-group/meta.design';
import RadioItemMeta from '../radio-item/meta';
import RangeMeta from '../range/meta.design';
import RangeCalendarMeta from '../range-calendar/meta';
import RangePickerMeta from '../range-picker/meta';
import RatingMeta from '../rating/meta.design';
import ResponsiveGridMeta from '../responsive-grid/meta';
import ResponsiveGridCellMeta from '../responsive-grid-cell/meta';
import RichTextMeta from '../rich-text/meta';
import SearchMeta from '../search/meta.design';
import SelectMeta from '../select/meta.design';
import SelectOptionMeta from '../select-option/meta';
import SliderMeta from '../slider/meta.design';
import SlotMeta from '../slot/meta';
import SplitButtonMeta from '../split-button/meta.design';
import StepMeta from '../step/meta.design';
import StepItemMeta from '../step-item/meta';
import SubMenuMeta from '../sub-menu/meta';
import SubNavMeta from '../sub-nav/meta';
import SwitchMeta from '../switch/meta.design';
import TabMeta from '../tab/meta.design';
import TabItemMeta from '../tab-item/meta.design';
import TableMeta from '../table/meta';
import TableColumnMeta from '../table-column/meta';
import TabTabPaneMeta from '../tab-tab-pane/meta';
import TagMeta from '../tag/meta.design';
import TagCloseableMeta from '../tag-closeable/meta';
import TagSelectableMeta from '../tag-selectable/meta';
import TimelineMeta from '../timeline/meta.design';
import TimelineItemMeta from '../timeline-item/meta.design';
import TimePickerMeta from '../time-picker/meta.design';
import ToastMeta from '../toast/meta.design';
import TooltipMeta from '../tooltip/meta';
import TransferMeta from '../transfer/meta.design';
import TreeMeta from '../tree/meta.design';
import TreeNodeMeta from '../tree-node/meta';
import TreeSelectMeta from '../tree-select/meta.design';
import TypographyMeta from '../typography/meta';
import TypographyTextMeta from '../typography-text/meta';
import UploadMeta from '../upload/meta.design';
import UploadDraggerMeta from '../upload-dragger/meta';
import UploadListMeta from '../upload-list/meta';
import UploadSelecterMeta from '../upload-selecter/meta';
import VideoMeta from '../video/meta';
import WeekPickerMeta from '../week-picker/meta';
import YearPickerMeta from '../year-picker/meta';

const componentCategorySort = {};
["通用","导航","信息输入","信息展示","信息反馈","常用"]
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

function fillRealVersion(meta, packageName = "@alilc/lowcode-materials", version = "1.2.1", basicLibraryVersion = {}) {
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

const componentMetas = [AlertMeta, AvatarMeta, BadgeMeta, BalloonMeta, BalloonInnerMeta, BoxMeta, BreadcrumbMeta, BreadcrumbItemMeta, ButtonMeta, ButtonGroupMeta, CalendarMeta, CardMeta, CardActionsMeta, CardBulletHeaderMeta, CardCollaspeContentMeta, CardContentMeta, CardDividerMeta, CardHeaderMeta, CardMediaMeta, CascaderMeta, CascaderSelectMeta, CheckboxMeta, CheckboxGroupMeta, CheckboxItemMeta, CollapseMeta, CollapsePanelMeta, DatePickerMeta, DialogMeta, DivMeta, DividerMeta, DrawerMeta, DrawerInnerMeta, DropdownMeta, ErrorBoundaryMeta, FieldMeta, FormMeta, FormErrorMeta, FormItemMeta, FormResetMeta, FormSubmitMeta, GroupMeta, IconMeta, ImgMeta, InnerMeta, InputMeta, InputGroupMeta, InputPasswordMeta, InputTextAreaMeta, LinkMeta, ListMeta, ListItemMeta, LoadingMeta, MenuMeta, MenuButtonMeta, MenuDividerMeta, MenuGroupMeta, MenuItemMeta, MenuPopupItemMeta, MonthPickerMeta, NavMeta, NavItemMeta, NextTableMeta, NextTextMeta, NoteWrapperMeta, NumberPickerMeta, PaginationMeta, ParagraphMeta, PopupItemMeta, ProgressMeta, RadioMeta, RadioGroupMeta, RadioItemMeta, RangeMeta, RangeCalendarMeta, RangePickerMeta, RatingMeta, ResponsiveGridMeta, ResponsiveGridCellMeta, RichTextMeta, SearchMeta, SelectMeta, SelectOptionMeta, SliderMeta, SlotMeta, SplitButtonMeta, StepMeta, StepItemMeta, SubMenuMeta, SubNavMeta, SwitchMeta, TabMeta, TabItemMeta, TableMeta, TableColumnMeta, TabTabPaneMeta, TagMeta, TagCloseableMeta, TagSelectableMeta, TimelineMeta, TimelineItemMeta, TimePickerMeta, ToastMeta, TooltipMeta, TransferMeta, TreeMeta, TreeNodeMeta, TreeSelectMeta, TypographyMeta, TypographyTextMeta, UploadMeta, UploadDraggerMeta, UploadListMeta, UploadSelecterMeta, VideoMeta, WeekPickerMeta, YearPickerMeta];
const components = [];
const npmInfo = {"package":"@alilc/lowcode-materials","version":"1.2.1"};

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
