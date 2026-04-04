import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { apiPaths } from '../../../../shared/constants/api-paths';
import { sharedErrorUuidCannotVote } from '../../../../shared/constants/error-uuid';
import { convertNumberToBoolean } from '../../../../shared/helpers/convert-number-to-boolean';
import { isEmpty } from '../../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../../shared/helpers/merge-issues';
import { newVoteSchema } from '../../../../shared/schemas/new-vote';
import { errorUuid } from '../../../constants/error-uuid';
import { auditLogAndResponseJson } from '../../../helpers/audit-log-and-response-json';
import { convertIpV6AddressTo64Bit } from '../../../helpers/convert-ip-v6-address-to-64-bit';
import { getIpAddress } from '../../../helpers/get-ip-address';
import { getJwtPayload } from '../../../helpers/get-jwt-payload';
import { getUserAgent } from '../../../helpers/get-user-agent';
import { DenyIpAddressesRepository } from '../../../repositories/deny-ip-addresses';
import { UsersRepository } from '../../../repositories/users';
import { VotesRepository } from '../../../repositories/votes';

import type { HonoBindings } from '../../../types/hono-bindings';
import type { HonoVariables } from '../../../types/hono-variables';

export const votesApi = new Hono<{ Bindings: HonoBindings; Variables: HonoVariables; }>();
export const votesApiBasePath = apiPaths.posts.votes.subPath;

votesApi.post(apiPaths.posts.votes.index.subPath, (context, next) => jwt({ secret: context.env.USER_JWT_SECRET, alg: 'HS256' })(context, next), async context => {
  const logPrefix = 'Votes POST : ';
  
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
  
  const parsed = newVoteSchema.safeParse(body);
  if(!parsed.success) return await auditLogAndResponseJson(context, `${logPrefix}バリデーションエラー : Name [${name}] : ${ipAddress} : ${mergeIssues(parsed.error)}`, mergeIssues(parsed.error), 400);
  
  const user = await new UsersRepository(context.env.DB).getOneWithId(name);
  if(user == null) return await auditLogAndResponseJson(context, `${logPrefix}該当ユーザなし : Name [${name}] : ${ipAddress}`, `ユーザ情報が見つかりませんでした (${errorUuid.noUser})`, 400);
  if(convertNumberToBoolean(user.is_deleted)) return await auditLogAndResponseJson(context, `${logPrefix}削除されているユーザによる評価 : Name [${name}] : ${ipAddress}`, `ユーザ情報が見つかりませんでした (${errorUuid.userIsDeleted})`, 400);
  
  try {
    const afterVote = parsed.data;
    afterVote.is_cancelled = convertNumberToBoolean(afterVote.is_cancelled);
    
    const votesRepository = new VotesRepository(context.env.DB);
    const beforeVote = await votesRepository.getOneByPostIdAndUserId(afterVote.post_id, user.id);
    
    if(beforeVote == null) {
      if(afterVote.is_cancelled) return await auditLogAndResponseJson(context, `${logPrefix}実装誤り : 新規評価で取り消し指定 : Name [${name}] : ${ipAddress} : Vote [${afterVote.vote}] Target Post ID [${afterVote.post_id}]`, '新規評価時に評価取り消しが指定されました', 400);
      
      await votesRepository.addWithVoteCount(afterVote.post_id, user.id, afterVote.vote, ipAddress, userAgent);
      return context.json({ result: true }, 201);
    }
    else {
      beforeVote.is_cancelled = convertNumberToBoolean(beforeVote.is_cancelled);
      if(convertNumberToBoolean(beforeVote.is_deleted)) return await auditLogAndResponseJson(context, `${logPrefix}評価が削除済 : Name [${name}] : ${ipAddress} : Vote ID [${beforeVote.id}]`, `評価ができません (${sharedErrorUuidCannotVote})`, 400);
      if(beforeVote.vote === afterVote.vote && beforeVote.is_cancelled === afterVote.is_cancelled) return await auditLogAndResponseJson(context, `${logPrefix}実装誤り : 前回と同じ評価値および取り消し状況 : Name [${name}] : ${ipAddress} : Vote ID [${beforeVote.id}] : Vote [${afterVote.vote}] Is Cancelled [${afterVote.is_cancelled}]`, '前回と同じ評価値および取り消し状況です', 400);
      if(beforeVote.is_cancelled && afterVote.is_cancelled) return await auditLogAndResponseJson(context, `${logPrefix}実装誤り : 取り消し状態から再び取り消し評価を行おうとした : Name [${name}] : ${ipAddress} : Vote ID [${beforeVote.id}] : Vote [${afterVote.vote}]`, '前回と同じ取り消し状況です', 400);
      
      const updateResult = await votesRepository.updateWithVoteCount(afterVote.vote, afterVote.is_cancelled, beforeVote.id, afterVote.post_id, beforeVote.vote, beforeVote.is_cancelled);
      if(updateResult.error != null) return await auditLogAndResponseJson(context, `${logPrefix}実装誤り : 想定外の評価状況 : Name [${name}] : ${ipAddress} : Vote ID [${beforeVote.id}] : Vote [${afterVote.vote}] Is Cancelled [${afterVote.is_cancelled}]`, '不正な評価状況です', 400);
      
      return context.json({ result: true }, 200);
    }
  }
  catch(error) {
    return await auditLogAndResponseJson(context, `${logPrefix}評価処理に失敗 : Name [${name}] : ${ipAddress} : Error [${error}]`, '評価処理に失敗しました', 500);
  }
});
