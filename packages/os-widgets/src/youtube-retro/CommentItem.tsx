import type { FC } from 'react';
import { RICH_PARTS as P } from '../parts';
import type { YtComment } from './types';

export const CommentItem: FC<{ comment: YtComment }> = ({ comment }) => (
  <div data-part={P.ytCommentRow}>
    <div data-part={P.ytCommentAvatar}>{comment.icon}</div>
    <div data-part={P.ytCommentBody}>
      <div data-part={P.ytCommentHeader}>
        <span data-part={P.ytCommentUser}>{comment.user}</span>
        <span data-part={P.ytCommentTime}>{comment.time}</span>
      </div>
      <div data-part={P.ytCommentText}>{comment.text}</div>
      <div data-part={P.ytCommentActions}>
        <span>👍 {comment.likes}</span>
        <span>👎</span>
        <span>Reply</span>
      </div>
    </div>
  </div>
);
