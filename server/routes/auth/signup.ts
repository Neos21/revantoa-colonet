import * as bcryptjs from 'bcryptjs';
import { Hono } from 'hono';
import { customAlphabet } from 'nanoid';

import { apiPaths } from '../../../shared/constants/api-paths';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { newUserSchema } from '../../../shared/schemas/new-user';
import { errorUuid } from '../../constants/error-uuid';
import { auditLogAndResponseJson } from '../../helpers/audit-log-and-response-json';
import { convertIpV6AddressTo64Bit } from '../../helpers/convert-ip-v6-address-to-64-bit';
import { convertTurnstileErrorUuidToLog } from '../../helpers/convert-turnstile-error-uuid-to-log';
import { getIpAddress } from '../../helpers/get-ip-address';
import { getUserAgent } from '../../helpers/get-user-agent';
import { isConstraintError } from '../../helpers/is-constraint-error';
import { validateTurnstile } from '../../helpers/validate-turnstile';
import { DenyIpAddressesRepository } from '../../repositories/deny-ip-addresses';
import { UsersRepository } from '../../repositories/users';

import type { HonoBindings } from '../../types/hono-bindings';
import type { HonoVariables } from '../../types/hono-variables';

export const signupApi = new Hono<{ Bindings: HonoBindings; Variables: HonoVariables; }>();
export const signupApiBasePath = apiPaths.auth.signup.subPath;

signupApi.post(apiPaths.auth.signup.index.subPath, async context => {
  const logPrefix = 'Signup : ';
  
  const ipAddress = getIpAddress(context.req, context.env);
  if(ipAddress == null) return await auditLogAndResponseJson(context, `${logPrefix}IP アドレスなし`, `不正なリクエストです (${errorUuid.noIpAddress})`, 400);
  
  // IPv6 の場合、完全展開したアドレスの上位64ビットまで (例 : `2001:0db8:0000:0000::/64` 形式) で値が登録されているのでそれに合わせて比較に用いる
  const targetIpAddress = ipAddress.includes(':') ? convertIpV6AddressTo64Bit(ipAddress) : ipAddress;
  const existsDenyIpAddress = await new DenyIpAddressesRepository(context.env.DB).exists(targetIpAddress);
  if(existsDenyIpAddress) return await auditLogAndResponseJson(context, `${logPrefix}拒否 IP アドレスからのアクセス : ${ipAddress}`, `不正なリクエストです (${errorUuid.denyIpAddress})`, 400);
  
  const userAgent = getUserAgent(context.req, context.env);
  if(userAgent == null) return await auditLogAndResponseJson(context, `${logPrefix}User Agent なし`, `不正なリクエストです (${errorUuid.noUserAgent})`, 400);
  
  const body = await context.req.json().catch(() => null);
  if(body == null) return await auditLogAndResponseJson(context, `${logPrefix}リクエストボディなし`, `不正なリクエストです (${errorUuid.noRequestBody})`, 400);
  
  const turnstileToken = body.turnstile_token;
  delete body.turnstile_token;  // 後でバリデーション時に邪魔になるのでプロパティを消しておく
  if(isEmpty(turnstileToken)) return await auditLogAndResponseJson(context, `${logPrefix}Turnstile トークンなし`, 'Turnstile 認証が行われていません', 400);
  const turnstileValidationResult = await validateTurnstile(context.env, turnstileToken, ipAddress);
  if(turnstileValidationResult.error != null) return await auditLogAndResponseJson(context, `${logPrefix}${convertTurnstileErrorUuidToLog(turnstileValidationResult.error)}`, `Turnstile 認証に失敗しました (${turnstileValidationResult.error})`, 400);
  
  const parsed = newUserSchema.safeParse(body);
  if(!parsed.success) return await auditLogAndResponseJson(context, `${logPrefix}バリデーションエラー : ${mergeIssues(parsed.error)}`, mergeIssues(parsed.error), 400);
  
  try {
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(parsed.data.password, salt);
    
    const generateRecoveryCode = customAlphabet('0123456789', 20);
    const recoveryCode = generateRecoveryCode().match((/.{1,4}/g))!.join('-');
    
    await new UsersRepository(context.env.DB).add(parsed.data.name, passwordHash, recoveryCode);
    return context.json({ result: true }, 201);
  }
  catch(error) {
    if(isConstraintError(error)) return await auditLogAndResponseJson(context, `${logPrefix}ユーザ名重複 : Name [${parsed.data.name}]`, '指定のユーザ名は既に取得されています', 400);
    return await auditLogAndResponseJson(context, `${logPrefix}登録処理に失敗 : Error [${error}]`, 'ユーザ登録に失敗しました', 500);
  }
});
