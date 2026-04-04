import { z } from 'zod';

import { containsOnlyAsciiRegExp } from '../helpers/contains-only-ascii-regexp';

export const nameDisplay       = 'ユーザ名'   as const;
export const nameMinLength     =  4           as const;
export const nameMaxLength     = 30           as const;
export const passwordDisplay   = 'パスワード' as const;
export const passwordMinLength =  8           as const;
export const passwordMaxLength = 50           as const;
export const currentPasswordDisplay = '現在のパスワード' as const;
export const newPasswordDisplay     = '新しいパスワード' as const;
export const recoveryCodeDisplay    = 'リカバリコード'   as const;
export const recoveryCodeMinLength  = 20                 as const;
export const recoveryCodeMaxLength  = 40                 as const;  // ハイフン込みでも 24 文字ではあるが、それよりもリクエスト量を制限するための上限として

/** ユーザ新規作成・ログイン時のバリデーション */
export const newUserSchema = z.object({
  name    : z.preprocess(
              value => value == null ? '' : typeof value === 'string' ? value.trim() : value,
              z.string({ error: `${nameDisplay}に文字列でないデータが入力されています` })
                .min(nameMinLength, { error: `${nameDisplay}は${nameMinLength}文字以上で入力してください` })
                .max(nameMaxLength, { error: `${nameDisplay}は${nameMaxLength}文字以内で入力してください` })
                .regex((/^[a-z0-9_-]+$/), { error: `${nameDisplay}は半角英小文字・数字およびアンダースコア・ハイフンのみ利用可能です` })
            ),
  password: z.preprocess(
              value => value == null ? '' : typeof value === 'string' ? value.trim() : value,
              z.string({ error: `${passwordDisplay}に文字列でないデータが入力されています` })
                .min(passwordMinLength, { error: `${passwordDisplay}は${passwordMinLength}文字以上で入力してください` })
                .max(passwordMaxLength, { error: `${passwordDisplay}は${passwordMaxLength}文字以内で入力してください` })
                .regex(containsOnlyAsciiRegExp, { error: `${passwordDisplay}は半角英数記号のみ利用可能です` })
            )
});

/** パスワード変更時のバリデーション */
export const changePasswordSchema = z.object({
  current_password: z.preprocess(
                      value => value == null ? '' : typeof value === 'string' ? value.trim() : value,
                      z.string({ error: `${currentPasswordDisplay}に文字列でないデータが入力されています` })
                        .min(passwordMinLength, { error: `${currentPasswordDisplay}は${passwordMinLength}文字以上で入力してください` })
                        .max(passwordMaxLength, { error: `${currentPasswordDisplay}は${passwordMaxLength}文字以内で入力してください` })
                        .regex(containsOnlyAsciiRegExp, { error: `${currentPasswordDisplay}は半角英数記号のみ利用可能です` })
                    ),
  new_password    : z.preprocess(
                      value => value == null ? '' : typeof value === 'string' ? value.trim() : value,
                      z.string({ error: `${newPasswordDisplay}に文字列でないデータが入力されています` })
                        .min(passwordMinLength, { error: `${newPasswordDisplay}は${passwordMinLength}文字以上で入力してください` })
                        .max(passwordMaxLength, { error: `${newPasswordDisplay}は${passwordMaxLength}文字以内で入力してください` })
                        .regex(containsOnlyAsciiRegExp, { error: `${newPasswordDisplay}は半角英数記号のみ利用可能です` })
                    )
});

/** パスワードリセット時のバリデーション */
export const forgotPasswordSchema = z.object({
  name         : z.preprocess(
                   value => value == null ? '' : typeof value === 'string' ? value.trim() : value,
                   z.string({ error: `${nameDisplay}に文字列でないデータが入力されています` })
                     .min(nameMinLength, { error: `${nameDisplay}は${nameMinLength}文字以上で入力してください` })
                     .max(nameMaxLength, { error: `${nameDisplay}は${nameMaxLength}文字以内で入力してください` })
                     .regex((/^[a-z0-9_-]+$/), { error: `${nameDisplay}は半角英小文字・数字およびアンダースコア・ハイフンのみ利用可能です` })
                 ),
  recovery_code: z.preprocess(
                   value => value == null ? '' : typeof value === 'string' ? value.trim() : value,
                   z.string({ error: `${recoveryCodeDisplay}に文字列でないデータが入力されています` })
                     .min(recoveryCodeMinLength, { error: `${recoveryCodeDisplay}は${recoveryCodeMinLength}文字以上で入力してください` })
                     .max(recoveryCodeMaxLength, { error: `${recoveryCodeDisplay}は${recoveryCodeMaxLength}文字以内で入力してください` })
                     .regex((/^[0-9-]+$/), { error: `${recoveryCodeDisplay}は半角数字およびハイフンのみ利用可能です` })
                 ),
  new_password : z.preprocess(
                   value => value == null ? '' : typeof value === 'string' ? value.trim() : value,
                   z.string({ error: `${newPasswordDisplay}に文字列でないデータが入力されています` })
                     .min(passwordMinLength, { error: `${newPasswordDisplay}は${passwordMinLength}文字以上で入力してください` })
                     .max(passwordMaxLength, { error: `${newPasswordDisplay}は${passwordMaxLength}文字以内で入力してください` })
                     .regex(containsOnlyAsciiRegExp, { error: `${newPasswordDisplay}は半角英数記号のみ利用可能です` })
                 )
});

export type NewUser        = z.infer<typeof newUserSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;
