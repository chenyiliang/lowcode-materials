import React from 'react';
import type { ReactNode } from 'react';
import { Avatar } from 'antd';
import './index.scss';

export interface CommentProps {
  /** 在评论内容下面呈现的操作项列表 */
  actions?: ReactNode[];
  /** 要显示为注释作者的元素 */
  author?: ReactNode;
  /** 头像元素 - 通常是 antd Avatar 或者 src */
  avatar?: ReactNode;
  /** 嵌套注释应作为注释的子项提供 */
  children?: ReactNode;
  /** 评论的主要内容 */
  content?: ReactNode;
  /** 展示时间描述 */
  datetime?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Comment 组件。
 *
 * 迁移说明：antd 5 起 `Comment` 从核心包移除（官方建议改用 @ant-design/compatible，
 * 但该包 peer 依赖停留在 antd ^5，与本项目 antd ^6 不兼容）。
 * 为保持低代码物料 Comment 的 meta / snippets 继续可用，这里用 antd 6 的基础元素
 * （Avatar + 原生布局）按 antd 4 Comment 的 DOM 结构 1:1 复刻，props 契约与老版本一致。
 */
const Comment: React.FC<CommentProps> = (props) => {
  const { actions, author, avatar, children, content, datetime, className, style } = props;

  const actionNodes = actions && actions.length ? (
    <ul className="ant-comment-actions">
      {actions.map((action, index) => (
        <li key={index}>{action}</li>
      ))}
    </ul>
  ) : null;

  const avatarNode = avatar ? (
    <div className="ant-comment-avatar">
      {typeof avatar === 'string' ? <Avatar src={avatar} alt="comment-avatar" /> : avatar}
    </div>
  ) : null;

  return (
    <div className={`ant-comment${className ? ` ${className}` : ''}`} style={style}>
      {avatarNode}
      <div className="ant-comment-content">
        <div className="ant-comment-content-author">
          {author ? <span className="ant-comment-content-author-name">{author}</span> : null}
          {datetime ? <span className="ant-comment-content-author-time">{datetime}</span> : null}
        </div>
        <div className="ant-comment-content-detail">{content}</div>
        {actionNodes}
      </div>
      {/* 嵌套评论作为根节点的直接子节点渲染，与 antd 4 结构一致 */}
      {children}
    </div>
  );
};

Comment.displayName = 'Comment';

export default Comment;
