import { convertUtcToJst } from '../../../../shared/helpers/convert-utc-to-jst';

import type { AnonymousPost } from '../../../../shared/types/anonymous-post';
import type { ReactNode } from 'react';

type Props = {
  anonymousPosts: Array<AnonymousPost>;
};

export default function AnonymousTimeline({ anonymousPosts: anonymousPosts }: Props): ReactNode {
  return (
    <>
      {anonymousPosts.length === 0 && <div className="text-center">投稿はありません</div>}
      
      {anonymousPosts.length > 0 && anonymousPosts.map(post => (
        <div key={post.created_at} className="px-3 py-4 mt-12 border rounded shadow-sm border-base-content/10 bg-base-100 dark:bg-base-200">
          <div className="text-xs text-base-content/50">{convertUtcToJst(post.created_at)}</div>
          <div className="mt-1 whitespace-pre-wrap">{post.content}</div>
        </div>
      ))}
    </>
  );
}
