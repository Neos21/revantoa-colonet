import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { apiPaths } from '../../../shared/constants/api-paths';
import { convertBooleanToNumber } from '../../../shared/helpers/convert-boolean-to-number';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { isIso8601RegExp } from '../../../shared/helpers/is-iso-8601-regexp';

import type { UserForAdmin } from '../../../shared/types/user';
import type { HonoBindings } from '../../types/hono-bindings';
import type { HonoVariables } from '../../types/hono-variables';

export const adminUsersApi = new Hono<{ Bindings: HonoBindings; Variables: HonoVariables; }>();
export const adminUsersApiBasePath = apiPaths.admin.users.subPath;

adminUsersApi.use((context, next) => jwt({ secret: context.env.ADMIN_JWT_SECRET, alg: 'HS256' })(context, next));

adminUsersApi.get(apiPaths.admin.users.index.subPath, async context => {
  const usersResult = await context.env.DB.prepare('SELECT id, name, created_at, last_login_at, is_deleted, admin_memo FROM users ORDER BY id DESC').all<UserForAdmin>();
  return context.json({ result: usersResult.results }, 200);
});

adminUsersApi.get(apiPaths.admin.users.byId.subPath, async context => {
  const id = context.req.param('id');
  if(isEmpty(id)) return context.json({ error: 'ID は必須です' }, 400);
  
  const user = await context.env.DB.prepare('SELECT id, name, created_at, last_login_at, is_deleted, admin_memo FROM users WHERE id = ? LIMIT 1').bind(Number(id)).first<UserForAdmin>();
  return context.json({ result: user }, 200);
});

adminUsersApi.post(apiPaths.admin.users.index.subPath, async context => {
  const body: UserForAdmin = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, 400);
  
  if(isEmpty(body.id)) return context.json({ error: 'ID は必須です' }, 400);
  if(isEmpty(body.name)) return context.json({ error: 'Name は必須です' }, 400);
  if(isEmpty(body.created_at)) return context.json({ error: 'Created At は必須です' }, 400);
  if(!isIso8601RegExp.test(body.created_at)) return context.json({ error: 'Created At の形式が不正です' }, 400);
  if(!isEmpty(body.last_login_at) && !isIso8601RegExp.test(body.last_login_at)) return context.json({ error: 'Last Login At の形式が不正です' }, 400);
  
  body.id = Number(body.id);
  body.is_deleted = convertBooleanToNumber(body.is_deleted) as typeof body.is_deleted;
  
  const savedUser = await context.env.DB.prepare('SELECT is_deleted FROM users WHERE id = ? LIMIT 1').bind(body.id).first<UserForAdmin>();
  if(savedUser == null) return context.json({ error: '存在しないユーザ ID が指定されました' }, 400);
  
  // ユーザ情報は一律で更新する
  try {
    await context.env.DB
      .prepare('UPDATE users SET name = ?, created_at = ?, last_login_at = ?, is_deleted = ?, admin_memo = ? WHERE id = ?')
      .bind(body.name, body.created_at, body.last_login_at, body.is_deleted, body.admin_memo, body.id).run();
  }
  catch(error) {
    return context.json({ error: `管理者によるユーザ編集処理に失敗しました : Error [${error}]` }, 500);
  }
  
  // 削除フラグに変更がない場合は何もしない
  if(savedUser.is_deleted === body.is_deleted) return context.json({ result: true }, 200);
  
  // 削除フラグが変更された場合に、そのユーザが行った評価が影響する投稿の評価カウントを再集計する
  // `WHERE` の `IN` 句に特段件数制限はないようなので大丈夫そう
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
      WHERE posts.id IN (
        SELECT DISTINCT post_id
        FROM votes
        WHERE user_id = ?
      )
    `).bind(body.id).run();
    return context.json({ result: true }, 200);
  }
  catch(error) {
    return context.json({ error: `管理者によるユーザ編集処理後の評価カウント再集計に失敗しました : Error [${error}]` }, 500);
  }
});
