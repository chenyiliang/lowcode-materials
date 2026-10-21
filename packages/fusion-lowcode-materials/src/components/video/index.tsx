import * as React from 'react';

export interface Props {
  src?: string;
  autoPlay?: boolean; //自动播放必须设置 muted=true
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  poster?: string;
  style?: object;
}

/**
 * 视频
 */
const Video: React.ForwardRefRenderFunction<HTMLVideoElement, Props> = (props, ref) => {
  // React 19 移除了函数组件的 defaultProps，改为默认参数值
  const { src = 'https://fusion.alicdn.com/fusion-site-2.0/fusion.mp4', ...rest } = props;
  return <video {...rest} src={src} ref={ref}></video>;
};

const RefVideo = React.forwardRef<HTMLVideoElement, Props>(Video);

export default RefVideo;
