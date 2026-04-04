import { z } from 'zod';

import { containsJapaneseRegExp } from '../helpers/contains-japanese-regexp';
import { reduceNewlines } from '../helpers/reduce-newlines';

const contentDisplay          = '投稿内容' as const;
export const contentMaxLength = 150        as const;

/** 新規投稿時のバリデーション */
export const newAnonymousPostSchema = z.object({
  content: z.preprocess(
             value => value == null ? '' : typeof value === 'string' ? reduceNewlines(value.trim()) : value,
             z.string({ error: `${contentDisplay}に文字列でないデータが入力されています` })
               .min(1, { error: `${contentDisplay}を入力してください` })
               .max(contentMaxLength, { error: `${contentDisplay}は${contentMaxLength}文字以内で入力してください` })
               .regex(containsJapaneseRegExp, { error: `${contentDisplay}には日本語を含めてください` })
           )
});

export type NewAnonymousPost = z.infer<typeof newAnonymousPostSchema>;
