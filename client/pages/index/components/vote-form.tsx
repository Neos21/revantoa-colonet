import { ArrowBigDown, ArrowBigUp } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { apiPaths } from '../../../../shared/constants/api-paths';
import { sharedErrorUuidCannotVote } from '../../../../shared/constants/error-uuid';
import { voteValue } from '../../../../shared/constants/vote-value';
import { newVoteSchema, type NewVote } from '../../../../shared/schemas/new-vote';
import { extractApiErrorMessage } from '../../../shared/helpers/extract-api-error-message';
import { isUnauthorizedError } from '../../../shared/helpers/is-unauthorized-error';
import { userApi } from '../../../shared/helpers/user-api';

import type { VoteValueCancelled, VoteValueDownVote, VoteValueUpVote } from '../../../../shared/types/vote-value';

type Props = {
  postId: number;
  /** 初期表示時に使う自分の最後の評価 */
  initialMyVote: VoteValueUpVote | VoteValueDownVote | VoteValueCancelled | null;
  clearIndexMessage: () => void;
};

export default function VoteForm({ postId, initialMyVote, clearIndexMessage }: Props): ReactNode {
  const [form, setForm] = useState<NewVote>({
    post_id     : postId,
    vote        : (initialMyVote ?? voteValue.unspecified) as NewVote['vote'],  // `0` が入り得るがココは強引に入れといていい
    is_cancelled: initialMyVote === voteValue.unspecified
  });
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDisabled, setIsDisabled] = useState<boolean>(false);  // `votes.is_deleted = 1` であることを検知したら非活性にする
  
  const onSubmit = async (voteValue: VoteValueUpVote | VoteValueDownVote): Promise<void> => {
    if(isSubmitting) return;  // `disabled` を使うと要素幅がカクつくので二度押し防止はコレで行う
    
    clearIndexMessage();
    setIsSubmitting(true);
    
    const isCancelled = !form.is_cancelled && form.vote === voteValue;
    const newVote = { post_id: postId, vote: voteValue, is_cancelled: isCancelled };
    
    const parsed = newVoteSchema.safeParse(newVote);
    if(!parsed.success) return setIsSubmitting(false);
    
    try {
      await userApi.post(apiPaths.posts.votes.route, { json: parsed.data }).json();
      setForm(newVote);  // 更新が成功したら画面にも反映する
    }
    catch(error) {
      console.error('評価に失敗しました', error);
      if(isUnauthorizedError(error)) return setIsDisabled(true);  // トークン切れなどの場合
      const errorMessage = await extractApiErrorMessage(error, '評価に失敗しました');
      if(errorMessage.includes(sharedErrorUuidCannotVote)) setIsDisabled(true);  // 削除されている評価の場合
    }
    finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="join opacity-90">
      <button type="button" className={`btn btn-xs join-item bg-transparent ${!form.is_cancelled && form.vote === voteValue.upVote   ? 'text-success hover:text-emerald-600' : 'text-base-content/80 hover:text-success'}`} onClick={() => onSubmit(voteValue.upVote)}   disabled={isDisabled}><ArrowBigUp   size={15} /></button>
      <button type="button" className={`btn btn-xs join-item bg-transparent ${!form.is_cancelled && form.vote === voteValue.downVote ? 'text-error   hover:text-rose-600   ' : 'text-base-content/80 hover:text-error  '}`} onClick={() => onSubmit(voteValue.downVote)} disabled={isDisabled}><ArrowBigDown size={15} /></button>
    </div>
  );
}
