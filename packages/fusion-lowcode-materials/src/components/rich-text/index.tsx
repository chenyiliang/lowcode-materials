import * as React from 'react';

// 新结构
interface IContent {
  aone?: {
    // 可能未绑定
    url: string;
    priorityId: string;
    project: { id: string; name: string };
    creator: { empId: string; name: string };
    assigner: { empId: string; name: string };
  };
  subject: string;
  description: string;
  hideTitle?: boolean;
  id?: string;
}
interface IRichTextProps {
  content?: IContent | string;
  className?: string;
  maxHeight?: string;
}

/**
 * 文字 字体、大小、行高
 * @param props
 */
const RichText: React.ForwardRefRenderFunction<HTMLImageElement, IRichTextProps> = (props, ref) => {
  const {
    // React 19 移除了函数组件的 defaultProps。原 defaultProps.content（需求示例）优先级
    // 高于此处的解构默认值，这里把示例内容合并进解构默认值，保持运行期一致。
    content = {
      subject: '需求标题',
      hideTitle: false,
      description:
        '<div><span>- 你可以在这里描述需求</span><br /><span>- 或者粘贴需求截图</span></div>',
    },
    maxHeight = 'auto',
    className = '',
    ...others
  }: IRichTextProps = props;
  const oldType = typeof content === 'string';
  const desc = oldType ? content : content?.description || '';
  const title = (!oldType && content?.subject) || '';
  const hideTitle = oldType || content?.hideTitle;
  return (
    <div {...others} className={className} ref={ref}>
      {!hideTitle && (
        <div style={{ fontSize: '30px', color: '#333', lineHeight: '32px' }}>
          <span>{title}</span>
        </div>
      )}
      <div
        style={{ maxHeight, overflowY: 'scroll' }}
        className="message-content"
        dangerouslySetInnerHTML={{
          __html: desc,
        }}
      />
    </div>
  );
};

const RefRichText = React.forwardRef(RichText);

export default RefRichText;
