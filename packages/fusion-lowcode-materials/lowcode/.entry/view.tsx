// 该文件由 scripts/build-lowcode-meta.mjs 自动生成，请勿手工修改。
// 作用等价于老 @alifd/build-plugin-lowcode 的 .tmp/view.js 入口。
import * as componentInstances from "../../src/index.tsx";

import CollapseView from '../collapse/view';
import InputView from '../input/view';
import NumberPickerView from '../number-picker/view';
import SlotView from '../slot/view';

function getRealComponent(component, componentName) {
  if (component.default) return component.default;
  if (component[componentName]) return component[componentName];
  return component;
}

export * from "../../src/index.tsx";

const coveredComponents = {
  "Collapse": getRealComponent(CollapseView, "Collapse"),
  "Input": getRealComponent(InputView, "Input"),
  "NumberPicker": getRealComponent(NumberPickerView, "NumberPicker"),
  "Slot": getRealComponent(SlotView, "Slot"),
};

// 老插件 view.js：window[library] = Object.assign({__esModule:true}, componentInstances, coveredComponents)
// UMD 产物把具名导出挂到 window[library]，这里用具名导出对齐；view 默认导出合并对象。
export { componentInstances, coveredComponents };
