import * as bcryptjs from 'bcryptjs';
import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { apiPaths } from '../../../shared/constants/api-paths';
import { convertNumberToBoolean } from '../../../shared/helpers/convert-number-to-boolean';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { changePasswordSchema, currentPasswordDisplay, newPasswordDisplay } from '../../../shared/schemas/new-user';
import { errorUuid } from '../../constants/error-uuid';
import { auditLogAndResponseJson } from '../../helpers/audit-log-and-response-json';
import { getJwtPayload } from '../../helpers/get-jwt-payload';
import { UsersRepository } from '../../repositories/users';

import type { HonoBindings } from '../../types/hono-bindings';
import type { HonoVariables } from '../../types/hono-variables';

export const changePasswordApi = new Hono<{ Bindings: HonoBindings; Variables: HonoVariables; }>();
export const changePasswordApiBasePath = apiPaths.auth.changePassword.subPath;

changePasswordApi.post(apiPaths.auth.changePassword.index.subPath, (context, next) => jwt({ secret: context.env.USER_JWT_SECRET, alg: 'HS256' })(context, next), async context => {
  const logPrefix = 'Change Password : ';
  const usersRepository = new UsersRepository(context.env.DB);
  
  const { sub: name } = getJwtPayload(context);
  if(isEmpty(name)) return await auditLogAndResponseJson(context, `${logPrefix}不正な JWT`, '不正な JWT です', 400);
  
  const body = await context.req.json().catch(() => null);
  if(body == null) return await auditLogAndResponseJson(context, `${logPrefix}リクエストボディなし`, `不正なリクエストです (${errorUuid.noRequestBody})`, 400);
  
  const parsed = changePasswordSchema.safeParse(body);
  if(!parsed.success) return await auditLogAndResponseJson(context, `${logPrefix}バリデーションエラー : ${mergeIssues(parsed.error)}`, mergeIssues(parsed.error), 400);
  
  // 現在のパスワードが一致しているか確認する
  const user = await usersRepository.getOneForLogin(name);
  if(user == null) return await auditLogAndResponseJson(context, `${logPrefix}該当ユーザなし : Name [${name}]`, `ユーザ情報が見つかりませんでした (${errorUuid.noUser})`, 400);
  if(convertNumberToBoolean(user.is_deleted)) return await auditLogAndResponseJson(context, `${logPrefix}削除されているユーザによる操作 : Name [${name}]`, `ユーザ情報が見つかりませんでした (${errorUuid.userIsDeleted})`, 400);
  const isValidPassword = await bcryptjs.compare(parsed.data.current_password, user.password_hash);
  if(!isValidPassword) return context.json({ error: `${currentPasswordDisplay}が間違っています` }, 400);
  
  // 変更後のパスワードが同じ場合はエラーとする
  if(parsed.data.current_password === parsed.data.new_password) return context.json({ error: `${currentPasswordDisplay}と${newPasswordDisplay}が同じです` }, 400);
  
  try {
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(parsed.data.new_password, salt);
    usersRepository.updatePasswordHash(name, passwordHash);
    return context.json({ result: true }, 200);
  }
  catch(error) {
    return await auditLogAndResponseJson(context, `${logPrefix}パスワード変更処理に失敗 : Error [${error}]`, 'パスワード変更に失敗しました', 500);
  }
});
