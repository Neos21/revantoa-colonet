import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { apiPaths } from '../../../shared/constants/api-paths';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { isIso8601RegExp } from '../../../shared/helpers/is-iso-8601-regexp';

import type { Counter } from '../../../shared/types/counter';
import type { HonoBindings } from '../../types/hono-bindings';
import type { HonoVariables } from '../../types/hono-variables';

export const adminCountersApi = new Hono<{ Bindings: HonoBindings; Variables: HonoVariables; }>();
export const adminCountersApiBasePath = apiPaths.admin.counters.subPath;

adminCountersApi.use((context, next) => jwt({ secret: context.env.ADMIN_JWT_SECRET, alg: 'HS256' })(context, next));

adminCountersApi.get(apiPaths.admin.counters.index.subPath, async context => {
  const countersResult = await context.env.DB.prepare('SELECT id, name, ip_address, user_agent, referrer, created_at FROM counters ORDER BY id DESC').all<Counter>();
  return context.json({ result: countersResult.results }, 200);
});

adminCountersApi.delete(apiPaths.admin.counters.index.subPath, async context => {
  const body: Counter = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, 400);
  
  if(isEmpty(body.created_at)) return context.json({ error: 'Created At (JST) は必須です' }, 400);
  if(!isIso8601RegExp.test(body.created_at)) return context.json({ error: 'Created At (JST) の形式が不正です' }, 400);
  
  // `YYYY-MM-DD HH:mm:SS` 形式の JST を同じく `YYYY-MM-DD HH:mm:SS` 形式の UTC に変換して渡す
  const date = new Date(body.created_at.replace(' ', 'T') + '+09:00');  // タイムゾーンオフセットを追加する
  const utcIsoString = date.toISOString();  // UTC を取得する : `toISOString()` は `YYYY-MM-DDTHH:mm:ss.sssZ` の形式
  const utcCreatedAt = utcIsoString.slice(0, 19).replace('T', ' ');  // `Z` とミリ秒部分を削除し `T` をスペースに置換する
  await context.env.DB.prepare('DELETE FROM counters WHERE created_at <= ?').bind(utcCreatedAt).run();
  return context.body(null, 204);
});
