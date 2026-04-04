import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { adminAnonymousPostsApi, adminAnonymousPostsApiBasePath } from './anonymous-posts';
import { adminAuditLogsApi, adminAuditLogsApiBasePath } from './audit-logs';
import { adminCountersApi, adminCountersApiBasePath } from './counters';
import { adminDenyIpAddressesApi, adminDenyIpAddressesApiBasePath } from './deny-ip-addresses';
import { adminLoginApi, adminLoginApiBasePath } from './login';
import { adminPostsApi, adminPostsApiBasePath } from './posts';
import { adminTimelinesApi, adminTimelinesApiBasePath } from './timelines';
import { adminUsersApi, adminUsersApiBasePath } from './users';
import { adminVotesApi, adminVotesApiBasePath } from './votes';
import { apiPaths } from '../../../shared/constants/api-paths';

import type { HonoBindings } from '../../types/hono-bindings';

export const adminApi = new Hono<{ Bindings: HonoBindings; }>();
export const adminApiBasePath = apiPaths.admin.subPath;

adminApi.route(adminLoginApiBasePath, adminLoginApi);

// JWT が有効か否かをチェックする
adminApi.post(apiPaths.admin.checkToken.subPath, (context, next) => jwt({ secret: context.env.ADMIN_JWT_SECRET, alg: 'HS256' })(context, next), context => context.json({ result: true }, 200));

// 以下は各ルーティングに JWT 検証を行うミドルウェアを追加してある
adminApi.route(adminUsersApiBasePath          , adminUsersApi);
adminApi.route(adminPostsApiBasePath          , adminPostsApi);
adminApi.route(adminVotesApiBasePath          , adminVotesApi);
adminApi.route(adminDenyIpAddressesApiBasePath, adminDenyIpAddressesApi);
adminApi.route(adminAuditLogsApiBasePath      , adminAuditLogsApi);
adminApi.route(adminTimelinesApiBasePath      , adminTimelinesApi);
adminApi.route(adminCountersApiBasePath       , adminCountersApi);
adminApi.route(adminAnonymousPostsApiBasePath , adminAnonymousPostsApi);
