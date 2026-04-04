import type { HonoBindings } from '../types/hono-bindings';
import type { HonoVariables } from '../types/hono-variables'
import type { Context } from 'hono';

export const getJwtPayload = (context: Context<{ Bindings: HonoBindings; Variables: HonoVariables; }>): HonoVariables['jwtPayload'] => context.get('jwtPayload') ?? {};
