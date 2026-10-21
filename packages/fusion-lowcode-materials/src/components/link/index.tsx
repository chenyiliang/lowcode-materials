import * as React from 'react';
interface LinkProps {
  target?: string;
  children?: string;
  href?: string;
  style?: object;
  __designMode?: string;
}

/**
 * 文字 字体、大小、行高
 * @param props
 */
const Link: React.ForwardRefRenderFunction<HTMLAnchorElement, LinkProps> = (props, ref) => {
  const {
    children = '这是一个超链接',
    __designMode,
    href = 'https://fusion.design',
    target = '_blank',
    ...others
  } = props;
  const otherProps: any = {};
  if (__designMode === 'design') {
    otherProps.onClick = (e: Event) => {
      e.preventDefault();
    };
  }
  return (
    <a {...others} href={href} target={target} ref={ref} {...otherProps}>
      {children}
    </a>
  );
};

const RefLink = React.forwardRef(Link);

export default RefLink;
