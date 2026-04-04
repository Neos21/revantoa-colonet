import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { apiPaths } from '../../../shared/constants/api-paths';
import { convertBooleanToNumber } from '../../../shared/helpers/convert-boolean-to-number';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { isIso8601RegExp } from '../../../shared/helpers/is-iso-8601-regexp';

import type { AnonymousPostForAdmin } from '../../../shared/types/anonymous-post';
import type { HonoBindings } from '../../types/hono-bindings';
import type { HonoVariables } from '../../types/hono-variables';

export const adminAnonymousPostsApi = new Hono<{ Bindings: HonoBindings; Variables: HonoVariables; }>();
export const adminAnonymousPostsApiBasePath = apiPaths.admin.anonymousPosts.subPath;

adminAnonymousPostsApi.use((context, next) => jwt({ secret: context.env.ADMIN_JWT_SECRET, alg: 'HS256' })(context, next));

adminAnonymousPostsApi.get(apiPaths.admin.anonymousPosts.index.subPath, async context => {
  const anonymousPostsResult = await context.env.DB.prepare(`
    SELECT anonymous_posts.id, anonymous_posts.content, anonymous_posts.ip_address, anonymous_posts.user_agent, anonymous_posts.created_at, anonymous_posts.is_deleted, anonymous_posts.admin_memo
    FROM anonymous_posts
    ORDER BY anonymous_posts.id DESC
  `).all<AnonymousPostForAdmin>();
  return context.json({ result: anonymousPostsResult.results }, 200);
});

adminAnonymousPostsApi.get(apiPaths.admin.anonymousPosts.byId.subPath, async context => {
  const id = context.req.param('id');
  if(isEmpty(id)) return context.json({ error: 'ID は必須です' }, 400);
  
  const anonymousPost = await context.env.DB.prepare(`
    SELECT anonymous_posts.id, anonymous_posts.content, anonymous_posts.ip_address, anonymous_posts.user_agent, anonymous_posts.created_at, anonymous_posts.is_deleted, anonymous_posts.admin_memo
    FROM anonymous_posts
    WHERE anonymous_posts.id = ?
    LIMIT 1
  `).bind(id).first<AnonymousPostForAdmin>();
  return context.json({ result: anonymousPost }, 200);
});

adminAnonymousPostsApi.post(apiPaths.admin.anonymousPosts.index.subPath, async context => {
  const body: AnonymousPostForAdmin = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, 400);
  
  if(isEmpty(body.id)) return context.json({ error: 'ID は必須です' }, 400);
  if(isEmpty(body.content)) return context.json({ error: 'Content は必須です' }, 400);
  if(isEmpty(body.ip_address)) return context.json({ error: 'IP Address は必須です' }, 400);
  if(isEmpty(body.user_agent)) return context.json({ error: 'User Agent は必須です' }, 400);
  if(isEmpty(body.created_at)) return context.json({ error: 'Created At は必須です' }, 400);
  if(!isIso8601RegExp.test(body.created_at)) return context.json({ error: 'Created At の形式が不正です' }, 400);
  
  body.id = Number(body.id);
  body.is_deleted = convertBooleanToNumber(body.is_deleted) as typeof body.is_deleted;
  
  try {
    await context.env.DB
      .prepare('UPDATE anonymous_posts SET content = ?, ip_address = ?, user_agent = ?, created_at = ?, is_deleted = ?, admin_memo = ? WHERE id = ?')
      .bind(body.content, body.ip_address, body.user_agent, body.created_at, body.is_deleted, body.admin_memo, body.id).run();
    return context.json({ result: true }, 200);
  }
  catch(error) {
    return context.json({ error: `管理者による匿名投稿編集処理に失敗しました : Error [${error}]` }, 500);
  }
});
