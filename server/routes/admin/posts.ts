import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { apiPaths } from '../../../shared/constants/api-paths';
import { convertBooleanToNumber } from '../../../shared/helpers/convert-boolean-to-number';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { isIso8601RegExp } from '../../../shared/helpers/is-iso-8601-regexp';

import type { PostForAdmin } from '../../../shared/types/post';
import type { HonoBindings } from '../../types/hono-bindings';
import type { HonoVariables } from '../../types/hono-variables';

export const adminPostsApi = new Hono<{ Bindings: HonoBindings; Variables: HonoVariables; }>();
export const adminPostsApiBasePath = apiPaths.admin.posts.subPath;

adminPostsApi.use((context, next) => jwt({ secret: context.env.ADMIN_JWT_SECRET, alg: 'HS256' })(context, next));

adminPostsApi.get(apiPaths.admin.posts.index.subPath, async context => {
  const postsResult = await context.env.DB.prepare(`
    SELECT
      posts.id, posts.content, posts.user_id, posts.ip_address, posts.user_agent, posts.created_at, posts.vote_count_up, posts.vote_count_down, posts.is_deleted, posts.admin_memo,
      users.name AS user_name, users.is_deleted AS user_is_deleted
    FROM posts
      JOIN users ON posts.user_id = users.id
    ORDER BY posts.id DESC
  `).all<PostForAdmin>();
  return context.json({ result: postsResult.results }, 200);
});

adminPostsApi.get(apiPaths.admin.posts.byId.subPath, async context => {
  const id = context.req.param('id');
  if(isEmpty(id)) return context.json({ error: 'ID は必須です' }, 400);
  
  const post = await context.env.DB.prepare(`
    SELECT
      posts.id, posts.content, posts.user_id, posts.ip_address, posts.user_agent, posts.created_at, posts.vote_count_up, posts.vote_count_down, posts.is_deleted, posts.admin_memo,
      users.name AS user_name, users.is_deleted AS user_is_deleted
    FROM posts
      JOIN users ON posts.user_id = users.id
    WHERE posts.id = ?
    LIMIT 1
  `).bind(id).first<PostForAdmin>();
  return context.json({ result: post }, 200);
});

// 全投稿データの評価集計カラムを一律更新する : `users`・`votes` の更新時は影響する行だけ更新しているが、何かあった時に強制的に全変更するためのエンドポイント
adminPostsApi.post(apiPaths.admin.posts.recountVotes.subPath, async context => {
  try {
    await context.env.DB.prepare(`
      UPDATE posts
      SET
        vote_count_up = (
          SELECT COUNT(*)
          FROM votes
            JOIN users ON users.id = votes.user_id
          WHERE votes.post_id = posts.id
            AND votes.vote = 1
            AND votes.is_cancelled = 0
            AND votes.is_deleted = 0
            AND users.is_deleted = 0
        ),
        vote_count_down = (
          SELECT COUNT(*)
          FROM votes
            JOIN users ON users.id = votes.user_id
          WHERE votes.post_id = posts.id
            AND votes.vote = -1
            AND votes.is_cancelled = 0
            AND votes.is_deleted = 0
            AND users.is_deleted = 0
        )
    `).run();
    return context.json({ result: true }, 200);
  }
  catch(error) {
    return context.json({ error: `管理者による投稿カウントの全再集計処理に失敗しました : Error [${error}]` }, 500);
  }
});

adminPostsApi.post(apiPaths.admin.posts.index.subPath, async context => {
  const body: PostForAdmin = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, 400);
  
  // `user_id` は受け取らない・変更不可とする
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
      .prepare('UPDATE posts SET content = ?, ip_address = ?, user_agent = ?, created_at = ?, is_deleted = ?, admin_memo = ? WHERE id = ?')
      .bind(body.content, body.ip_address, body.user_agent, body.created_at, body.is_deleted, body.admin_memo, body.id).run();
    return context.json({ result: true }, 200);
  }
  catch(error) {
    return context.json({ error: `管理者による投稿編集処理に失敗しました : Error [${error}]` }, 500);
  }
});
