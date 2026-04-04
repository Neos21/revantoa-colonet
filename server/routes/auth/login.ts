import * as bcryptjs from 'bcryptjs';
import { Hono } from 'hono';
import { sign } from 'hono/jwt';

import { apiPaths } from '../../../shared/constants/api-paths';
import { convertNumberToBoolean } from '../../../shared/helpers/convert-number-to-boolean';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { newUserSchema } from '../../../shared/schemas/new-user';
import { errorUuid } from '../../constants/error-uuid';
import { auditLogAndResponseJson } from '../../helpers/audit-log-and-response-json';
import { convertIpV6AddressTo64Bit } from '../../helpers/convert-ip-v6-address-to-64-bit';
import { convertTurnstileErrorUuidToLog } from '../../helpers/convert-turnstile-error-uuid-to-log';
import { getIpAddress } from '../../helpers/get-ip-address';
import { getUserAgent } from '../../helpers/get-user-agent';
import { validateTurnstile } from '../../helpers/validate-turnstile';
import { DenyIpAddressesRepository } from '../../repositories/deny-ip-addresses';
import { UsersRepository } from '../../repositories/users';

import type { LoginResult } from '../../../shared/types/login-result';
import type { HonoBindings } from '../../types/hono-bindings';
import type { HonoVariables } from '../../types/hono-variables';

export const loginApi = new Hono<{ Bindings: HonoBindings; Variables: HonoVariables; }>();
export const loginApiBasePath = apiPaths.auth.login.subPath;

loginApi.post(apiPaths.auth.login.index.subPath, async context => {
  const logPrefix = 'Login : ';
  const usersRepository = new UsersRepository(context.env.DB);
  
  const ipAddress = getIpAddress(context.req, context.env);
  if(ipAddress == null) return await auditLogAndResponseJson(context, `${logPrefix}IP アドレスなし`, `不正なリクエストです (${errorUuid.noIpAddress})`, 400);
  
  const targetIpAddress = ipAddress.includes(':') ? convertIpV6AddressTo64Bit(ipAddress) : ipAddress;
  const existsDenyIpAddress = await new DenyIpAddressesRepository(context.env.DB).exists(targetIpAddress);
  if(existsDenyIpAddress) return await auditLogAndResponseJson(context, `${logPrefix}拒否 IP アドレスからのアクセス : ${ipAddress}`, `不正なリクエストです (${errorUuid.denyIpAddress})`, 400);
  
  const userAgent = getUserAgent(context.req, context.env);
  if(userAgent == null) return await auditLogAndResponseJson(context, `${logPrefix}User Agent なし`, `不正なリクエストです (${errorUuid.noUserAgent})`, 400);
  
  const body = await context.req.json().catch(() => null);
  if(body == null) return await auditLogAndResponseJson(context, `${logPrefix}リクエストボディなし`, `不正なリクエストです (${errorUuid.noRequestBody})`, 400);
  
  const turnstileToken = body.turnstile_token;
  delete body.turnstile_token;
  if(isEmpty(turnstileToken)) return await auditLogAndResponseJson(context, `${logPrefix}Turnstile トークンなし`, 'Turnstile 認証が行われていません', 400);
  const turnstileValidationResult = await validateTurnstile(context.env, turnstileToken, ipAddress);
  if(turnstileValidationResult.error != null) return await auditLogAndResponseJson(context, `${logPrefix}${convertTurnstileErrorUuidToLog(turnstileValidationResult.error)}`, `Turnstile 認証に失敗しました (${turnstileValidationResult.error})`, 400);
  
  const parsed = newUserSchema.safeParse(body);
  if(!parsed.success) return await auditLogAndResponseJson(context, `${logPrefix}バリデーションエラー : Name [${body.name ?? '未入力'}] : ${mergeIssues(parsed.error)}`, mergeIssues(parsed.error), 400);
  
  const name = parsed.data.name;
  const user = await usersRepository.getOneForLogin(name);
  if(user == null) return await auditLogAndResponseJson(context, `${logPrefix}該当ユーザなし : Name [${name}]`, `ユーザ情報が見つかりませんでした (${errorUuid.noUser})`, 400);
  if(convertNumberToBoolean(user.is_deleted)) return await auditLogAndResponseJson(context, `${logPrefix}削除されているユーザによるログイン : Name [${name}]`, `ユーザ情報が見つかりませんでした (${errorUuid.userIsDeleted})`, 400);
  
  try {
    const isValidPassword = await bcryptjs.compare(parsed.data.password, user.password_hash);
    if(!isValidPassword) return await auditLogAndResponseJson(context, `${logPrefix}パスワード誤り : Name [${name}]`, 'パスワードが間違っています', 400);
    
    const userJwtSecret = context.env.USER_JWT_SECRET;
    if(isEmpty(userJwtSecret)) return await auditLogAndResponseJson(context, `${logPrefix}実装誤り : ユーザ向け JWT シークレット未指定`, `ログイン処理中にエラーが発生しました (${errorUuid.noUserJwtSecret})`, 500);
    
    const jwt = await sign({
      sub: name,
      exp: Math.floor(Date.now() / 1000) + 60 /* Seconds */ * 60 /* Minutes */ * 24 /* Hours */ * 30 /* Days */  // 30日間有効
    }, userJwtSecret, 'HS256');
    
    await usersRepository.updateLastLoginAt(name);
    
    const loginResult: LoginResult = { jwt, name, is_first_login: isEmpty(user.last_login_at) };
    return context.json({ result: loginResult }, 200);
  }
  catch(error) {
    return await auditLogAndResponseJson(context, `${logPrefix}ログイン処理に失敗 : Error [${error}]`, 'ログイン処理に失敗しました', 500);
  }
});
