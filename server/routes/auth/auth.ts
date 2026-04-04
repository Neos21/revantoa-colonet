import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { accountApi, accountApiBasePath } from './account';
import { changePasswordApi, changePasswordApiBasePath } from './change-password';
import { loginApi, loginApiBasePath } from './login';
import { resetPasswordApi, resetPasswordApiBasePath } from './reset-password';
import { signupApi, signupApiBasePath } from './signup';
import { apiPaths } from '../../../shared/constants/api-paths';
import { convertNumberToBoolean } from '../../../shared/helpers/convert-number-to-boolean';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { auditLogAndResponseJson } from '../../helpers/audit-log-and-response-json';
import { getJwtPayload } from '../../helpers/get-jwt-payload';
import { UsersRepository } from '../../repositories/users';

import type { HonoBindings } from '../../types/hono-bindings';
import type { HonoVariables } from '../../types/hono-variables';

export const authApi = new Hono<{ Bindings: HonoBindings; Variables: HonoVariables; }>();
export const authApiBasePath = apiPaths.auth.subPath;

// JWT が有効か否か・ユーザが削除状態か否かをチェックする
authApi.post(apiPaths.auth.checkToken.subPath, (context, next) => jwt({ secret: context.env.USER_JWT_SECRET, alg: 'HS256' })(context, next), async context => {
  const logPrefix = 'Check Token : ';
  
  const { sub: name } = getJwtPayload(context);
  if(isEmpty(name)) return await auditLogAndResponseJson(context, `${logPrefix}不正な JWT`, '不正な JWT です', 401);
  
  const user = await new UsersRepository(context.env.DB).getOneForCheckToken(name);
  if(user == null) return await auditLogAndResponseJson(context, `${logPrefix}該当ユーザなし : Name [${name}]`, 'ユーザ情報が見つかりませんでした', 401);
  if(convertNumberToBoolean(user.is_deleted)) return await auditLogAndResponseJson(context, `${logPrefix}削除されているユーザによるアクセス : Name [${name}]`, 'ユーザ情報が見つかりませんでした', 401);
  
  return context.json({ result: true }, 200);
});

authApi.route(signupApiBasePath        , signupApi);
authApi.route(loginApiBasePath         , loginApi);
authApi.route(changePasswordApiBasePath, changePasswordApi);
authApi.route(resetPasswordApiBasePath , resetPasswordApi);
authApi.route(accountApiBasePath       , accountApi);
