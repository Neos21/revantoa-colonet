import { Hono } from 'hono';

import { apiPaths } from '../../../shared/constants/api-paths';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { newAnonymousPostSchema } from '../../../shared/schemas/new-anonymous-post';
import { errorUuid } from '../../constants/error-uuid';
import { auditLogAndResponseJson } from '../../helpers/audit-log-and-response-json';
import { convertIpV6AddressTo64Bit } from '../../helpers/convert-ip-v6-address-to-64-bit';
import { convertTurnstileErrorUuidToLog } from '../../helpers/convert-turnstile-error-uuid-to-log';
import { getIpAddress } from '../../helpers/get-ip-address';
import { getUserAgent } from '../../helpers/get-user-agent';
import { validateTurnstile } from '../../helpers/validate-turnstile';
import { AnonymousPostsRepository } from '../../repositories/anonymous-posts';
import { DenyIpAddressesRepository } from '../../repositories/deny-ip-addresses';

import type { HonoBindings } from '../../types/hono-bindings';
import type { HonoVariables } from '../../types/hono-variables';

export const anonymousPostsApi = new Hono<{ Bindings: HonoBindings; Variables: HonoVariables; }>();
export const anonymousPostsApiBasePath = apiPaths.anonymousPosts.subPath;

anonymousPostsApi.get(apiPaths.anonymousPosts.index.subPath, async context => {
  const posts = await new AnonymousPostsRepository(context.env.DB).getForTimeline();
  return context.json({ result: posts }, 200);
});

anonymousPostsApi.post(apiPaths.anonymousPosts.index.subPath, async context => {
  const logPrefix = 'Anonymous Posts POST : ';
  
  const ipAddress = getIpAddress(context.req, context.env);
  if(ipAddress == null) return await auditLogAndResponseJson(context, `${logPrefix}IP アドレスなし`, `不正なリクエストです (${errorUuid.noIpAddress})`, 400);
  
  const targetIpAddress = ipAddress.includes(':') ? convertIpV6AddressTo64Bit(ipAddress) : ipAddress;
  const existsDenyIpAddress = await new DenyIpAddressesRepository(context.env.DB).exists(targetIpAddress);
  if(existsDenyIpAddress) return await auditLogAndResponseJson(context, `${logPrefix}拒否 IP アドレスからのアクセス : ${ipAddress}`, `不正なリクエストです (${errorUuid.denyIpAddress})`, 400);
  
  const userAgent = getUserAgent(context.req, context.env);
  if(userAgent == null) return await auditLogAndResponseJson(context, `${logPrefix}User Agent なし : ${ipAddress}`, `不正なリクエストです (${errorUuid.noUserAgent})`, 400);
  
  const body = await context.req.json().catch(() => null);
  if(body == null) return await auditLogAndResponseJson(context, `${logPrefix}リクエストボディなし : ${ipAddress}`, `不正なリクエストです (${errorUuid.noRequestBody})`, 400);
  
  const turnstileToken = body.turnstile_token;
  delete body.turnstile_token;
  if(isEmpty(turnstileToken)) return await auditLogAndResponseJson(context, `${logPrefix}Turnstile トークンなし : ${ipAddress}`, 'Turnstile 認証が行われていません', 400);
  const turnstileValidationResult = await validateTurnstile(context.env, turnstileToken, ipAddress);
  if(turnstileValidationResult.error != null) return await auditLogAndResponseJson(context, `${logPrefix}${convertTurnstileErrorUuidToLog(turnstileValidationResult.error)} : ${ipAddress}`, `Turnstile 認証に失敗しました (${turnstileValidationResult.error})`, 400);
  
  const parsed = newAnonymousPostSchema.safeParse(body);
  if(!parsed.success) return await auditLogAndResponseJson(context, `${logPrefix}バリデーションエラー : ${ipAddress} : ${mergeIssues(parsed.error)}`, mergeIssues(parsed.error), 400);
  
  try {
    await new AnonymousPostsRepository(context.env.DB).add(parsed.data.content, ipAddress, userAgent);
    return context.json({ result: true }, 201);
  }
  catch(error) {
    return await auditLogAndResponseJson(context, `${logPrefix}投稿処理に失敗 : ${ipAddress} : Error [${error}]`, '投稿処理に失敗しました', 500);
  }
});
