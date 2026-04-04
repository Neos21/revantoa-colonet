import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { apiPaths } from '../../../shared/constants/api-paths';
import { convertNumberToBoolean } from '../../../shared/helpers/convert-number-to-boolean';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { errorUuid } from '../../constants/error-uuid';
import { auditLogAndResponseJson } from '../../helpers/audit-log-and-response-json';
import { getJwtPayload } from '../../helpers/get-jwt-payload';
import { PostsRepository } from '../../repositories/posts';
import { UsersRepository } from '../../repositories/users';

import type { HonoBindings } from '../../types/hono-bindings';
import type { HonoVariables } from '../../types/hono-variables';

export const usersApi = new Hono<{ Bindings: HonoBindings; Variables: HonoVariables; }>();
export const usersApiBasePath = apiPaths.users.subPath;

// 「ユーザ情報」画面でユーザ確認がてらリカバリコードを取得する
usersApi.get(apiPaths.users.me.index.subPath, (context, next) => jwt({ secret: context.env.USER_JWT_SECRET, alg: 'HS256' })(context, next), async context => {
  const logPrefix = 'Users Me GET : ';
  
  const { sub: name } = getJwtPayload(context);
  if(isEmpty(name)) return await auditLogAndResponseJson(context, `${logPrefix}不正な JWT`, '不正な JWT です', 400);
  
  const user = await new UsersRepository(context.env.DB).getOneWithRecoveryCode(name);
  if(user == null) return await auditLogAndResponseJson(context, `${logPrefix}該当ユーザなし : Name [${name}]`, `ユーザ情報が見つかりませんでした (${errorUuid.noUser})`, 400);
  if(convertNumberToBoolean(user.is_deleted)) return await auditLogAndResponseJson(context, `${logPrefix}削除されているユーザ : Name [${name}]`, `ユーザ情報が見つかりませんでした (${errorUuid.userIsDeleted})`, 400);
  
  return context.json({  // `user` には `is_deleted` が含まれているので除去する
    result: {
      recovery_code: user.recovery_code
    }
  }, 200);
});

usersApi.get(apiPaths.users.me.posts.subPath, (context, next) => jwt({ secret: context.env.USER_JWT_SECRET, alg: 'HS256' })(context, next), async context => {
  const logPrefix = 'Users Me Posts GET : ';
  
  const { sub: name } = getJwtPayload(context);
  if(isEmpty(name)) return await auditLogAndResponseJson(context, `${logPrefix}不正な JWT`, '不正な JWT です', 400);
  
  const user = await new UsersRepository(context.env.DB).getOneWithId(name);
  if(user == null) return await auditLogAndResponseJson(context, `${logPrefix}該当ユーザなし : Name [${name}]`, `ユーザ情報が見つかりませんでした (${errorUuid.noUser})`, 400);
  if(convertNumberToBoolean(user.is_deleted)) return await auditLogAndResponseJson(context, `${logPrefix}削除されているユーザ : Name [${name}]`, `ユーザ情報が見つかりませんでした (${errorUuid.userIsDeleted})`, 400);
  
  // ユーザ ID を指定して削除されていない投稿一覧を取得する
  const posts = await new PostsRepository(context.env.DB).getAllByUserId(user.id);
  return context.json({ result: posts }, 200);
});
