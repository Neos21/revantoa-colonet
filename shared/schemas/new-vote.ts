import { z } from 'zod';

import { booleanNumber } from '../constants/boolean-number';
import { voteValue } from '../constants/vote-value';

/** 実装誤り : 評価情報に評価対象の投稿 ID を指定し忘れている */
const errorUuidMissingPostIdInVote = '123ccfc6-d6cc-6d2a-1926-0927a9248774' as const;
const voteDisplay                  = '評価'                                 as const;
const isCancelledDisplay           = '取り消しフラグ'                       as const;

/** 新規評価時のバリデーション */
export const newVoteSchema = z.object({
  post_id     : z.coerce.number({ error: `投稿 ID に数値が指定されていません (${errorUuidMissingPostIdInVote})` })
                  .int({ error: `投稿 ID に整数が指定されていません (${errorUuidMissingPostIdInVote})` })
                  .min(1, { error: `投稿 ID に 1 以上の整数が指定されていません (${errorUuidMissingPostIdInVote})` }),
  vote        : z.union([z.literal(voteValue.upVote), z.literal(voteValue.downVote)], { error: `${voteDisplay}に 1・-1 以外の値が設定されています` }),
  is_cancelled: z.union([z.literal(booleanNumber.false), z.literal(booleanNumber.true), z.boolean()], { error: `${isCancelledDisplay}に 0・1・真偽値以外の値が設定されています` })
});

export type NewVote = z.infer<typeof newVoteSchema>;
