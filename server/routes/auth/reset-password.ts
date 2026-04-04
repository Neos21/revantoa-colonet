import * as bcryptjs from 'bcryptjs';
import { Hono } from 'hono';
import { customAlphabet } from 'nanoid';

import { apiPaths } from '../../../shared/constants/api-paths';
import { convertNumberToBoolean } from '../../../shared/helpers/convert-number-to-boolean';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { forgotPasswordSchema } from '../../../shared/schemas/new-user';
import { errorUuid } from '../../constants/error-uuid';
import { auditLogAndResponseJson } from '../../helpers/audit-log-and-response-json';
import { UsersRepository } from '../../repositories/users';

import type { HonoBindings } from '../../types/hono-bindings';
import type { HonoVariables } from '../../types/hono-variables';

export const resetPasswordApi = new Hono<{ Bindings: HonoBindings; Variables: HonoVariables; }>();
export const resetPasswordApiBasePath = apiPaths.auth.resetPassword.subPath;

resetPasswordApi.post(apiPaths.auth.resetPassword.index.subPath, async context => {
  const logPrefix = 'Reset Password : ';
  const usersRepository = new UsersRepository(context.env.DB);
  
  const body = await context.req.json().catch(() => null);
  if(body == null) return await auditLogAndResponseJson(context, `${logPrefix}リクエストボディなし`, `不正なリクエストです (${errorUuid.noRequestBody})`, 400);
  
  const parsed = forgotPasswordSchema.safeParse(body);
  if(!parsed.success) return await auditLogAndResponseJson(context, `${logPrefix}バリデーションエラー : ${mergeIssues(parsed.error)}`, mergeIssues(parsed.error), 400);
  
  const user = await usersRepository.getOneWithRecoveryCode(parsed.data.name);
  if(user == null) return await auditLogAndResponseJson(context, `${logPrefix}該当ユーザなし : Name [${parsed.data.name}]`, `ユーザ情報が見つかりませんでした (${errorUuid.noUser})`, 400);
  if(convertNumberToBoolean(user.is_deleted)) return await auditLogAndResponseJson(context, `${logPrefix}削除されているユーザによる操作 : Name [${name}]`, `ユーザ情報が見つかりませんでした (${errorUuid.userIsDeleted})`, 400);
  
  // リカバリコードが正しいか確認する
  if(user.recovery_code.replaceAll('-', '') !== parsed.data.recovery_code.replaceAll('-', '')) return context.json({ error: 'リカバリコードが間違っています' }, 400);
  
  try {
    // 現在のパスワードは無視して「新しいパスワード」でパスワードを再設定する
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(parsed.data.new_password, salt);
    
    // リカバリコードを再生成する
    const generateRecoveryCode = customAlphabet('0123456789', 20);
    const newRecoveryCode = generateRecoveryCode().match((/.{1,4}/g))!.join('-');
    
    // ユーザ情報を更新する
    usersRepository.updatePasswordHashAndRecoveryCode(parsed.data.name, passwordHash, newRecoveryCode);
    return context.json({ result: true }, 200);
  }
  catch(error) {
    return await auditLogAndResponseJson(context, `${logPrefix}パスワードリセット処理に失敗 : Error [${error}]`, 'パスワードリセットに失敗しました', 500);
  }
});
