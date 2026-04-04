import { Hono } from 'hono';

import { apiPaths } from '../shared/constants/api-paths';
import { adminApi, adminApiBasePath } from './routes/admin/admin';
import { anonymousPostsApi, anonymousPostsApiBasePath } from './routes/anonymous-posts/anonymous-posts';
import { authApi, authApiBasePath } from './routes/auth/auth';
import { postsApi, postsApiBasePath } from './routes/posts/posts';
import { pvApi, pvApiBasePath } from './routes/pv/pv';
import { usersApi, usersApiBasePath } from './routes/users/users';

import type { HonoBindings } from './types/hono-bindings';
import type { HonoVariables } from './types/hono-variables';

const app = new Hono<{ Bindings: HonoBindings; Variables: HonoVariables; }>();

const api = new Hono<{ Bindings: HonoBindings; Variables: HonoVariables; }>();
const apiBasePath = apiPaths.subPath;

api.route(pvApiBasePath            , pvApi);
api.route(authApiBasePath          , authApi);
api.route(postsApiBasePath         , postsApi);
api.route(anonymousPostsApiBasePath, anonymousPostsApi);
api.route(usersApiBasePath         , usersApi);
api.route(adminApiBasePath         , adminApi);

app.route(apiBasePath, api);

// `wrangler.jsonc` や `vite.config.ts` で指定しているエントリファイルなので `export default` でエクスポートする
export default app;
