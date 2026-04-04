import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { apiPaths } from '../../../shared/constants/api-paths';
import { voteValue } from '../../../shared/constants/vote-value';
import { convertBooleanToNumber } from '../../../shared/helpers/convert-boolean-to-number';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { isIso8601RegExp } from '../../../shared/helpers/is-iso-8601-regexp';

import type { VoteForAdmin } from '../../../shared/types/vote';
import type { HonoBindings } from '../../types/hono-bindings';
import type { HonoVariables } from '../../types/hono-variables';

export const adminVotesApi = new Hono<{ Bindings: HonoBindings; Variables: HonoVariables; }>();
export const adminVotesApiBasePath = apiPaths.admin.votes.subPath;

adminVotesApi.use((context, next) => jwt({ secret: context.env.ADMIN_JWT_SECRET, alg: 'HS256' })(context, next));

adminVotesApi.get(apiPaths.admin.votes.index.subPath, async context => {
  const votesResult = await context.env.DB.prepare(`
    SELECT
      votes.id, votes.post_id, votes.user_id, votes.vote, votes.is_cancelled, votes.ip_address, votes.user_agent, votes.created_at, votes.is_deleted, votes.admin_memo,
      posts.content AS post_content, posts.is_deleted AS post_is_deleted,
      post_user.id AS post_user_id, post_user.name AS post_user_name, post_user.is_deleted AS post_user_is_deleted,
      users.name AS user_name, users.is_deleted AS user_is_deleted
    FROM votes
      JOIN posts ON votes.post_id = posts.id
      JOIN users ON votes.user_id = users.id
      JOIN users post_user ON posts.user_id = post_user.id
    ORDER BY votes.id DESC
  `).all<VoteForAdmin>();
  return context.json({ result: votesResult.results }, 200);
});

adminVotesApi.get(apiPaths.admin.votes.byId.subPath, async context => {
  const id = context.req.param('id');
  if(isEmpty(id)) return context.json({ error: 'ID は必須です' }, 400);
  
  const vote = await context.env.DB.prepare(`
    SELECT
      votes.id, votes.post_id, votes.user_id, votes.vote, votes.is_cancelled, votes.ip_address, votes.user_agent, votes.created_at, votes.is_deleted, votes.admin_memo,
      posts.content AS post_content, posts.is_deleted AS post_is_deleted,
      post_user.id AS post_user_id, post_user.name AS post_user_name, post_user.is_deleted AS post_user_is_deleted,
      users.name AS user_name, users.is_deleted AS user_is_deleted
    FROM votes
      JOIN posts ON votes.post_id = posts.id
      JOIN users ON votes.user_id = users.id
      JOIN users post_user ON posts.user_id = post_user.id
    WHERE votes.id = ?
    LIMIT 1
  `).bind(id).first<VoteForAdmin>();
  return context.json({ result: vote }, 200);
});

adminVotesApi.post(apiPaths.admin.votes.index.subPath, async context => {
  const body: VoteForAdmin = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, 400);
  
  // `post_id` と `user_id` は受け取らない・変更不可とする
  if(isEmpty(body.id)) return context.json({ error: 'ID は必須です' }, 400);
  if(![voteValue.upVote, voteValue.downVote].includes(body.vote)) return context.json({ error: 'Vote の値が不正です' }, 400);
  if(isEmpty(body.ip_address)) return context.json({ error: 'IP Address は必須です' }, 400);
  if(isEmpty(body.user_agent)) return context.json({ error: 'User Agent は必須です' }, 400);
  if(isEmpty(body.created_at)) return context.json({ error: 'Created At は必須です' }, 400);
  if(!isIso8601RegExp.test(body.created_at)) return context.json({ error: 'Created At の形式が不正です' }, 400);
  
  body.id = Number(body.id);
  body.is_cancelled = convertBooleanToNumber(body.is_cancelled) as typeof body.is_cancelled;
  body.is_deleted = convertBooleanToNumber(body.is_deleted) as typeof body.is_deleted;
  
  try {
    // 評価が紐付く対象の投稿 ID を取得する
    const savedVote = await context.env.DB.prepare('SELECT post_id FROM votes WHERE id = ? LIMIT 1').bind(body.id).first<VoteForAdmin>();
    if(savedVote == null) return context.json({ error: '存在しない評価 ID が指定されました' }, 400);
    
    await context.env.DB
      .prepare('UPDATE votes SET vote = ?, is_cancelled = ?, ip_address = ?, user_agent = ?, created_at = ?, is_deleted = ?, admin_memo = ? WHERE id = ?')
      .bind(body.vote, body.is_cancelled, body.ip_address, body.user_agent, body.created_at, body.is_deleted, body.admin_memo, body.id).run();
    
    // 評価が紐付く対象の投稿のカウントを再集計する : 一般ユーザ向けのロジックはパフォーマンス優先で処理しているが、管理画面では時間がかかっても正確に再集計する
    await context.env.DB.prepare(`
      UPDATE posts
      SET
        vote_count_up = (
          SELECT COUNT(*)
          FROM votes
            JOIN users ON users.id = votes.user_id
          WHERE votes.post_id = ?
            AND votes.vote = 1
            AND votes.is_cancelled = 0
            AND votes.is_deleted = 0
            AND users.is_deleted = 0
        ),
        vote_count_down = (
          SELECT COUNT(*)
          FROM votes
            JOIN users ON users.id = votes.user_id
          WHERE votes.post_id = ?
            AND votes.vote = -1
            AND votes.is_cancelled = 0
            AND votes.is_deleted = 0
            AND users.is_deleted = 0
        )
      WHERE id = ?
    `).bind(savedVote.post_id, savedVote.post_id, savedVote.post_id).run();
    
    return context.json({ result: true }, 200);
  }
  catch(error) {
    return context.json({ error: `管理者による評価編集処理に失敗しました : Error [${error}]` }, 500);
  }
});
