import { isProduction } from './is-production';

import type { HonoBindings } from '../types/hono-bindings';
import type { HonoRequest } from 'hono';

/** 開発環境では `Unknown` の文字が入るようにし `null` にしない */
export const getIpAddress = (req: HonoRequest, env: HonoBindings): string | null => req.header('CF-Connecting-IP') ?? req.header('X-Real-IP') ?? (isProduction(env) ? null : 'Unknown');
