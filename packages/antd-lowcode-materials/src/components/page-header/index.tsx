import React from 'react';
import type { ReactNode } from 'react';
import { Avatar, Breadcrumb } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import './index.scss';

export interface PageHeaderBreadcrumbRoute {
  path?: string;
  breadcrumbName?: string;
  children?: PageHeaderBreadcrumbRoute[];
}

export interface PageHeaderProps {
  /** 自定义标题文字 */
  title?: ReactNode;
  /** 自定义的二级标题文字 */
  subTitle?: ReactNode;
  /** ghost 风格 */
  ghost?: boolean;
  /** title 旁的 tag 列表 */
  tags?: ReactNode;
  /** 操作区，位于 title 行的行尾 */
  extra?: ReactNode;
  /** 页脚，一般用于渲染 TabBar */
  footer?: ReactNode;
  /** 标题栏旁的头像 */
  avatar?: { src?: string } | ReactNode;
  /**
   * 面包屑的配置。
   * 兼容 antd 4 的 { routes: [{ path, breadcrumbName }] } 老格式，
   * 内部映射成 antd 6 Breadcrumb 的 items。
   */
  breadcrumb?: {
    routes?: PageHeaderBreadcrumbRoute[];
    items?: Array<{ title?: ReactNode; href?: string; path?: string }>;
  } | ReactNode;
  /** 返回按钮的点击事件 */
  onBack?: (e: React.MouseEvent<HTMLElement>) => void;
  /** 自定义返回图标 */
  backIcon?: ReactNode | boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
}

function renderAvatar(avatar: PageHeaderProps['avatar']) {
  if (!avatar) return null;
  if (React.isValidElement(avatar)) return avatar;
  const src = (avatar as { src?: string }).src;
  return <Avatar src={src} />;
}

function renderBreadcrumb(breadcrumb: PageHeaderProps['breadcrumb']) {
  if (!breadcrumb) return null;
  if (React.isValidElement(breadcrumb)) return breadcrumb;
  const config = breadcrumb as NonNullable<PageHeaderProps['breadcrumb']> & { routes?: PageHeaderBreadcrumbRoute[] };
  // antd 6 Breadcrumb 用 items；这里把 antd 4 的 routes / 直接给的 items 都归一化成 items
  const items =
    (config as { items?: Array<{ title?: ReactNode }> }).items ||
    (config.routes || []).map((route) => ({
      title: route.breadcrumbName ?? route.path,
    }));
  if (!items || !items.length) return null;
  return <Breadcrumb items={items} />;
}

/**
 * PageHeader 组件。
 *
 * 迁移说明：antd 5 起 `PageHeader` 从核心包移除（官方建议用 @ant-design/pro-components
 * 或 @ant-design/compatible，但前者体量大、后者 peer 依赖停在 antd ^5）。
 * 为保持低代码物料 PageHeader 的 meta / snippets 继续可用，这里用 antd 6 基础元素
 * （Avatar / Breadcrumb / Space）按 antd 4 PageHeader 的 DOM 结构复刻，props 契约不变，
 * 并把老的 breadcrumb.routes 格式映射到 antd 6 的 items。
 */
const PageHeader: React.FC<PageHeaderProps> = (props) => {
  const {
    title,
    subTitle,
    ghost = true,
    tags,
    extra,
    footer,
    avatar,
    breadcrumb,
    onBack,
    backIcon,
    className,
    style,
    children,
  } = props;

  const showBack = onBack && backIcon !== false;
  const backNode = showBack ? (
    <div
      className="ant-page-header-back-button"
      role="button"
      tabIndex={0}
      onClick={onBack}
    >
      {backIcon && typeof backIcon !== 'boolean' ? backIcon : <ArrowLeftOutlined />}
    </div>
  ) : null;

  const avatarNode = renderAvatar(avatar);

  const cls = [
    'ant-page-header',
    ghost ? 'ant-page-header-ghost' : '',
    className || '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cls} style={style}>
      {renderBreadcrumb(breadcrumb)}
      <div className="ant-page-header-heading">
        <div className="ant-page-header-heading-left">
          {backNode}
          {avatarNode}
          {title ? <div className="ant-page-header-heading-title">{title}</div> : null}
          {subTitle ? <div className="ant-page-header-heading-sub-title">{subTitle}</div> : null}
          {tags ? <div className="ant-page-header-heading-tags">{tags}</div> : null}
        </div>
        {extra ? <div className="ant-page-header-heading-extra">{extra}</div> : null}
      </div>
      {children ? <div className="ant-page-header-content">{children}</div> : null}
      {footer ? <div className="ant-page-header-footer">{footer}</div> : null}
    </div>
  );
};

PageHeader.displayName = 'PageHeader';

export default PageHeader;
