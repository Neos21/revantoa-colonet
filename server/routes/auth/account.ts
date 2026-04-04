import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { apiPaths } from '../../../shared/constants/api-paths';
import { convertNumberToBoolean } from '../../../shared/helpers/convert-number-to-boolean';
import { getJstNow } from '../../../shared/helpers/get-jst-now';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { errorUuid } from '../../constants/error-uuid';
import { auditLogAndResponseJson } from '../../helpers/audit-log-and-response-json';
import { getJwtPayload } from '../../helpers/get-jwt-payload';
import { PostsRepository } from '../../repositories/posts';
import { UsersRepository } from '../../repositories/users';
import { VotesRepository } from '../../repositories/votes';

import type { HonoBindings } from '../../types/hono-bindings';
import type { HonoVariables } from '../../types/hono-variables';

export const accountApi = new Hono<{ Bindings: HonoBindings; Variables: HonoVariables; }>();
export const accountApiBasePath = apiPaths.auth.account.subPath;

accountApi.delete(apiPaths.auth.account.index.subPath, (context, next) => jwt({ secret: context.env.USER_JWT_SECRET, alg: 'HS256' })(context, next), async context => {
  const logPrefix = 'Account DELETE : ';
  const usersRepository = new UsersRepository(context.env.DB);
  
  const { sub: name } = getJwtPayload(context);
  if(isEmpty(name)) return await auditLogAndResponseJson(context, `${logPrefix}不正な JWT`, '不正な JWT です', 400);
  
  // ユーザ ID を取得する
  const user = await usersRepository.getOneWithId(name);
  if(user == null) return await auditLogAndResponseJson(context, `${logPrefix}該当ユーザなし : Name [${name}]`, `ユーザ情報が見つかりませんでした (${errorUuid.noUser})`, 400);
  if(convertNumberToBoolean(user.is_deleted)) return await auditLogAndResponseJson(context, `${logPrefix}削除されているユーザによる操作 : Name [${name}]`, `ユーザ情報が見つかりませんでした (${errorUuid.userIsDeleted})`, 400);
  
  try {
    const adminMemo = `${getJstNow()} ユーザによるアカウント削除`;
    await new PostsRepository(context.env.DB).removeAllByUser(user.id, adminMemo);
    await new VotesRepository(context.env.DB).removeAllByUser(user.id, adminMemo);
    usersRepository.removeOneByUser(user.id, adminMemo);
    return context.body(null, 201);
  }
  catch(error) {
    return await auditLogAndResponseJson(context, `${logPrefix}アカウントの削除に失敗 : Error [${error}]`, 'アカウントの削除に失敗しました', 500);
  }
});
