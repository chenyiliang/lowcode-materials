import * as React from 'react';
interface ImageProps {
  alt?: string;
  title?: string;
  src?: string;
  style?: object;
}

/**
 * 文字 字体、大小、行高
 * @param props
 */
const Image: React.ForwardRefRenderFunction<HTMLImageElement, ImageProps> = (props, ref) => {
  // React 19 移除了函数组件的 defaultProps，改为默认参数值
  const { src = 'https://img.alicdn.com/tps/TB16TQvOXXXXXbiaFXXXXXXXXXX-120-120.svg', ...rest } = props;
  return <img {...rest} src={src} ref={ref} />;
};

const RefImage = React.forwardRef(Image);

export default RefImage;
