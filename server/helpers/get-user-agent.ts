import { isProduction } from './is-production';

import type { HonoBindings } from '../types/hono-bindings';
import type { HonoRequest } from 'hono';

/** 開発環境では `Unknown` の文字が入るようにし `null` にしない */
export const getUserAgent = (req: HonoRequest, env: HonoBindings): string | null => req.header('User-Agent') ?? (isProduction(env) ? null : 'Unknown');
