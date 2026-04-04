import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { votesApi, votesApiBasePath } from './votes/votes';
import { apiPaths } from '../../../shared/constants/api-paths';
import { convertNumberToBoolean } from '../../../shared/helpers/convert-number-to-boolean';
import { getJstNow } from '../../../shared/helpers/get-jst-now';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { newPostSchema } from '../../../shared/schemas/new-post';
import { errorUuid } from '../../constants/error-uuid';
import { auditLogAndResponseJson } from '../../helpers/audit-log-and-response-json';
import { convertIpV6AddressTo64Bit } from '../../helpers/convert-ip-v6-address-to-64-bit';
import { convertTurnstileErrorUuidToLog } from '../../helpers/convert-turnstile-error-uuid-to-log';
import { getIpAddress } from '../../helpers/get-ip-address';
import { getJwtPayload } from '../../helpers/get-jwt-payload';
import { getJwtPaylodFromAuthorizationHeader } from '../../helpers/get-jwt-payload-from-authorization-header';
import { getUserAgent } from '../../helpers/get-user-agent';
import { validateTurnstile } from '../../helpers/validate-turnstile';
import { DenyIpAddressesRepository } from '../../repositories/deny-ip-addresses';
import { PostsRepository } from '../../repositories/posts';
import { UsersRepository } from '../../repositories/users';

import type { HonoBindings } from '../../types/hono-bindings';
import type { HonoVariables } from '../../types/hono-variables';

export const postsApi = new Hono<{ Bindings: HonoBindings; Variables: HonoVariables; }>();
export const postsApiBasePath = apiPaths.posts.subPath;

postsApi.get(apiPaths.posts.index.subPath, async context => {
  // ログイン済ユーザがアクセスしてきた場合はユーザ名からユーザ ID を取得する・未ログイン時は `null` で良い
  const jwtPayload = await getJwtPaylodFromAuthorizationHeader(context.req, context.env);
  const userIdOrNull = jwtPayload != null ? (await new UsersRepository(context.env.DB).getOneWithId(jwtPayload.sub))?.id ?? null : null;
  const posts = await new PostsRepository(context.env.DB).getForTimeline(userIdOrNull);
  return context.json({ result: posts }, 200);
});

postsApi.post(apiPaths.posts.index.subPath, (context, next) => jwt({ secret: context.env.USER_JWT_SECRET, alg: 'HS256' })(context, next), async context => {
  const logPrefix = 'Posts POST : ';
  
  const { sub: name } = getJwtPayload(context);
  if(isEmpty(name)) return await auditLogAndResponseJson(context, `${logPrefix}不正な JWT`, '不正な JWT です', 400);
  
  const ipAddress = getIpAddress(context.req, context.env);
  if(ipAddress == null) return await auditLogAndResponseJson(context, `${logPrefix}IP アドレスなし : Name [${name}]`, `不正なリクエストです (${errorUuid.noIpAddress})`, 400);
  
  const targetIpAddress = ipAddress.includes(':') ? convertIpV6AddressTo64Bit(ipAddress) : ipAddress;
  const existsDenyIpAddress = await new DenyIpAddressesRepository(context.env.DB).exists(targetIpAddress);
  if(existsDenyIpAddress) return await auditLogAndResponseJson(context, `${logPrefix}拒否 IP アドレスからのアクセス : Name [${name}] : ${ipAddress}`, `不正なリクエストです (${errorUuid.denyIpAddress})`, 400);
  
  const userAgent = getUserAgent(context.req, context.env);
  if(userAgent == null) return await auditLogAndResponseJson(context, `${logPrefix}User Agent なし : Name [${name}] : ${ipAddress}`, `不正なリクエストです (${errorUuid.noUserAgent})`, 400);
  
  const body = await context.req.json().catch(() => null);
  if(body == null) return await auditLogAndResponseJson(context, `${logPrefix}リクエストボディなし : Name [${name}] : ${ipAddress}`, `不正なリクエストです (${errorUuid.noRequestBody})`, 400);
  
  const turnstileToken = body.turnstile_token;
  delete body.turnstile_token;
  if(isEmpty(turnstileToken)) return await auditLogAndResponseJson(context, `${logPrefix}Turnstile トークンなし : Name [${name}] : ${ipAddress}`, 'Turnstile 認証が行われていません', 400);
  const turnstileValidationResult = await validateTurnstile(context.env, turnstileToken, ipAddress);
  if(turnstileValidationResult.error != null) return await auditLogAndResponseJson(context, `${logPrefix}${convertTurnstileErrorUuidToLog(turnstileValidationResult.error)} : Name [${name}] : ${ipAddress}`, `Turnstile 認証に失敗しました (${turnstileValidationResult.error})`, 400);
  
  const parsed = newPostSchema.safeParse(body);
  if(!parsed.success) return await auditLogAndResponseJson(context, `${logPrefix}バリデーションエラー : Name [${name}] : ${ipAddress} : ${mergeIssues(parsed.error)}`, mergeIssues(parsed.error), 400);
  
  const user = await new UsersRepository(context.env.DB).getOneWithId(name);
  if(user == null) return await auditLogAndResponseJson(context, `${logPrefix}該当ユーザなし : Name [${name}] : ${ipAddress}`, `ユーザ情報が見つかりませんでした (${errorUuid.noUser})`, 400);
  if(convertNumberToBoolean(user.is_deleted)) return await auditLogAndResponseJson(context, `${logPrefix}削除されているユーザによる投稿 : Name [${name}] : ${ipAddress}`, `ユーザ情報が見つかりませんでした (${errorUuid.userIsDeleted})`, 400);
  
  try {
    await new PostsRepository(context.env.DB).add(parsed.data.content, user.id, ipAddress, userAgent);
    return context.json({ result: true }, 201);
  }
  catch(error) {
    return await auditLogAndResponseJson(context, `${logPrefix}投稿処理に失敗 : Name [${name}] : ${ipAddress} : Error [${error}]`, '投稿処理に失敗しました', 500);
  }
});

postsApi.delete(apiPaths.posts.byId.subPath, (context, next) => jwt({ secret: context.env.USER_JWT_SECRET, alg: 'HS256' })(context, next), async context => {
  const logPrefix = 'Posts DELETE : ';
  const postsRepository = new PostsRepository(context.env.DB);
  
  const { sub: name } = getJwtPayload(context);
  if(isEmpty(name)) return await auditLogAndResponseJson(context, `${logPrefix}不正な JWT`, '不正な JWT です', 400);
  
  // 投稿 ID を取得する
  const rawId = context.req.param('id');
  if(isEmpty(rawId)) return context.json({ error: 'ID は必須です' }, 400);
  const id = Number(rawId);
  if(Number.isNaN(id)) return context.json({ error: '不正な ID です' }, 400);
  
  const user = await new UsersRepository(context.env.DB).getOneWithId(name);
  if(user == null) return await auditLogAndResponseJson(context, `${logPrefix}該当ユーザなし : Name [${name}]`, `ユーザ情報が見つかりませんでした (${errorUuid.noUser})`, 400);
  if(convertNumberToBoolean(user.is_deleted)) return await auditLogAndResponseJson(context, `${logPrefix}削除されているユーザによる操作 : Name [${name}]`, `ユーザ情報が見つかりませんでした (${errorUuid.userIsDeleted})`, 400);
  
  // 対象の投稿が JWT のユーザのモノ、かつ削除されていない投稿であることを確認する
  const existsPost = await postsRepository.existsByUserId(user.id);
  if(!existsPost) return await auditLogAndResponseJson(context, `${logPrefix}対象の投稿なし (既に削除済みか投稿者でないユーザからの操作) : Name [${name}]`, `投稿が見つかりませんでした (${errorUuid.noPost})`, 400);
  
  try {
    await postsRepository.removeOneByUser(id, `${getJstNow()} ユーザによる投稿削除`);
    return context.body(null, 204);
  }
  catch(error) {
    return await auditLogAndResponseJson(context, `${logPrefix}投稿の削除に失敗 : Name [${name}] : Error [${error}]`, '投稿の削除に失敗しました', 500);
  }
});

postsApi.route(votesApiBasePath, votesApi);
