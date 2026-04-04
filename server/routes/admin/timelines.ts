import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { apiPaths } from '../../../shared/constants/api-paths';

import type { AdminTimeline } from '../../../shared/types/admin-timeline';
import type { HonoBindings } from '../../types/hono-bindings';
import type { HonoVariables } from '../../types/hono-variables';

export const adminTimelinesApi = new Hono<{ Bindings: HonoBindings; Variables: HonoVariables; }>();
export const adminTimelinesApiBasePath = apiPaths.admin.timelines.subPath;

adminTimelinesApi.use((context, next) => jwt({ secret: context.env.ADMIN_JWT_SECRET, alg: 'HS256' })(context, next));

adminTimelinesApi.get(apiPaths.admin.timelines.index.subPath, async context => {
  // `json_group_array` 内の `ORDER BY` は SQLite v3.38 以降でサポートされていて D1 も対応済
  const timelinesResult = await context.env.DB.prepare(`
    SELECT
      posts.id               AS post_id,
      posts.content          AS post_content,
      posts.ip_address       AS post_ip_address,
      posts.user_agent       AS post_user_agent,
      posts.created_at       AS post_created_at,
      posts.vote_count_up    AS post_vote_count_up,
      posts.vote_count_down  AS post_vote_count_down,
      posts.is_deleted       AS post_is_deleted,
      posts.admin_memo       AS post_admin_memo,
      
      users.id          AS user_id,
      users.name        AS user_name,
      users.is_deleted  AS user_is_deleted,
      users.admin_memo  AS user_admin_memo,
      
      COALESCE(
        json_group_array(
          json_object(
            'vote_id'          , votes.id,
            'vote_vote'        , votes.vote,
            'vote_is_cancelled', votes.is_cancelled,
            'vote_ip_address'  , votes.ip_address,
            'vote_user_agent'  , votes.user_agent,
            'vote_created_at'  , votes.created_at,
            'vote_is_deleted'  , votes.is_deleted,
            'vote_admin_memo'  , votes.admin_memo,
            
            'user_id'          , votes_users.id,
            'user_name'        , votes_users.name,
            'user_is_deleted'  , votes_users.is_deleted,
            'user_admin_memo'  , votes_users.admin_memo
          )
          ORDER BY votes.created_at DESC
        ) FILTER (WHERE votes.id IS NOT NULL),
        json('[]')
      ) AS votes
    
    FROM posts
      JOIN users
        ON users.id = posts.user_id
      
      LEFT JOIN votes
        ON votes.post_id = posts.id
      
      LEFT JOIN users votes_users
        ON votes_users.id = votes.user_id
    
    GROUP BY
      posts.id,
      posts.content,
      posts.ip_address,
      posts.user_agent,
      posts.created_at,
      posts.vote_count_up,
      posts.vote_count_down, 
      posts.is_deleted,
      posts.admin_memo,
      
      users.id,
      users.name,
      users.is_deleted,
      users.admin_memo
    
    ORDER BY
      posts.created_at DESC
  `).all<AdminTimeline>();
  
  // JSON 文字列で取得される `votes` をパースする
  const timelines = timelinesResult.results.map((timeline: AdminTimeline) => ({
    ...timeline,
    votes: JSON.parse((timeline.votes as unknown as string) ?? '[]') as AdminTimeline['votes']
  }));
  return context.json({ result: timelines }, 200);
});
