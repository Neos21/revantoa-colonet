import VoteForm from './vote-form';
import { convertUtcToJst } from '../../../../shared/helpers/convert-utc-to-jst';

import type { Post } from '../../../../shared/types/post';
import type { ReactNode } from 'react';

type Props = {
  posts: Array<Post>;
  isLoggedIn: boolean;
  clearIndexMessage: () => void;
};

export default function Timeline({ posts, isLoggedIn, clearIndexMessage }: Props): ReactNode {
  return (
    <>
      {posts.length === 0 && <div className="text-center">投稿はありません</div>}
      
      {posts.length > 0 && posts.map(post => (
        <div key={post.id} className="px-3 py-4 mt-12 border rounded shadow-sm border-base-content/10 bg-base-100 dark:bg-base-200">
          <div className="text-xs text-base-content/50">{convertUtcToJst(post.created_at)}</div>
          <div className="mt-1 whitespace-pre-wrap">{post.content}</div>
          
          {isLoggedIn && !post.is_you && <div className="mt-2 text-right"><VoteForm postId={post.id} initialMyVote={post.my_vote} clearIndexMessage={clearIndexMessage} /></div>}
        </div>
      ))}
    </>
  );
}
