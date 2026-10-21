import __req0__ from './__screenshots__/button-1.png';
import __req1__ from './__screenshots__/button-2.png';
import __req2__ from './__screenshots__/button-3.png';
import __req3__ from './__screenshots__/button-4.png';
import __req4__ from './__screenshots__/button-5.png';
import __req5__ from './__screenshots__/button-6.png';
export default [
  {
    title: '主按钮',
    screenshot: __req0__,
    schema: {
      componentName: 'Button',
      props: {
        type: 'primary',
        children: '主按钮',
      },
    },
  },
  {
    title: '次按钮',
    screenshot: __req1__,
    schema: {
      componentName: 'Button',
      props: {
        type: 'default',
        children: '次按钮',
      },
    },
  },
  {
    title: '危险按钮',
    screenshot: __req2__,
    schema: {
      componentName: 'Button',
      props: {
        type: 'danger',
        children: '危险按钮',
      },
    },
  },
  {
    title: '文字按钮',
    screenshot: __req3__,
    schema: {
      componentName: 'Button',
      props: {
        type: 'text',
        children: '文字按钮',
      },
    },
  },
  {
    title: '虚框按钮',
    screenshot: __req4__,
    schema: {
      componentName: 'Button',
      props: {
        type: 'dashed',
        children: '虚框按钮',
      },
    },
  },
  {
    title: '链接按钮',
    screenshot: __req5__,
    schema: {
      componentName: 'Button',
      props: {
        type: 'link',
        children: '链接按钮',
      },
    },
  },
];
