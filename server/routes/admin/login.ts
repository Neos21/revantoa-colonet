import { Hono } from 'hono';
import { sign } from 'hono/jwt';

import { apiPaths } from '../../../shared/constants/api-paths';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { errorUuid } from '../../constants/error-uuid';
import { auditLogAndResponseJson } from '../../helpers/audit-log-and-response-json';
import { convertTurnstileErrorUuidToLog } from '../../helpers/convert-turnstile-error-uuid-to-log';
import { getIpAddress } from '../../helpers/get-ip-address';
import { validateTurnstile } from '../../helpers/validate-turnstile';

import type { AdminLoginResult } from '../../../shared/types/admin-login-result';
import type { HonoBindings } from '../../types/hono-bindings';
import type { HonoVariables } from '../../types/hono-variables';

export const adminLoginApi = new Hono<{ Bindings: HonoBindings; Variables: HonoVariables; }>();
export const adminLoginApiBasePath = apiPaths.admin.login.subPath;

adminLoginApi.post(apiPaths.admin.login.index.subPath, async context => {
  const ipAddress = getIpAddress(context.req, context.env) ?? 'Unknown (Production)';
  const logPrefix = 'Admin Login : ';
  const logSuffix = ` (不正アクセスの疑い) : ${ipAddress}`;
  
  const body = await context.req.json().catch(() => null);
  if(body == null) return await auditLogAndResponseJson(context, `${logPrefix}リクエストボディなし${logSuffix}`, `不正なリクエストです (${errorUuid.noRequestBody})`, 400);
  
  const turnstileToken = body.turnstile_token;
  if(isEmpty(turnstileToken)) return await auditLogAndResponseJson(context, `${logPrefix}Turnstile トークンなし${logSuffix}`, 'Turnstile 認証が行われていません', 400);
  const turnstileValidationResult = await validateTurnstile(context.env, turnstileToken);
  if(turnstileValidationResult.error != null) return await auditLogAndResponseJson(context, `${logPrefix}${convertTurnstileErrorUuidToLog(turnstileValidationResult.error)}${logSuffix}`, `Turnstile 認証に失敗しました (${turnstileValidationResult.error})`, 400);
  
  const adminPassword  = context.env.ADMIN_PASSWORD;
  const adminJwtSecret = context.env.ADMIN_JWT_SECRET;
  if(isEmpty(adminPassword)) return await auditLogAndResponseJson(context, `${logPrefix}実装誤り : 管理者パスワード未指定${logSuffix}`, `ログイン処理中にエラーが発生しました (${errorUuid.noAdminPassword})`, 500)
  if(isEmpty(adminJwtSecret)) return await auditLogAndResponseJson(context, `${logPrefix}実装誤り : 管理用 JWT シークレット未指定${logSuffix}`, `ログイン処理中にエラーが発生しました (${errorUuid.noAdminJwtSecret})`, 500)
  
  if(isEmpty(body.password)) return await auditLogAndResponseJson(context, `${logPrefix}パスワード未入力${logSuffix}`, 'パスワードを入力してください', 400);
  if(body.password !== adminPassword) return await auditLogAndResponseJson(context, `${logPrefix}パスワード不一致${logSuffix}`, 'パスワードが間違っています', 401);
  
  const adminJwt = await sign({
    exp: Math.floor(Date.now() / 1000) + 60 /* Seconds */ * 60 /* Minutes */ * 24 /* Hours */ * 30 /* Days */  // 30日間有効
  }, adminJwtSecret, 'HS256');
  const adminLoginResult: AdminLoginResult = { admin_jwt: adminJwt };
  return context.json({ result: adminLoginResult }, 200);
});
