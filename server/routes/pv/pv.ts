import { Hono } from 'hono';

import { apiPaths } from '../../../shared/constants/api-paths';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { getIpAddress } from '../../helpers/get-ip-address';
import { getJwtPaylodFromAuthorizationHeader } from '../../helpers/get-jwt-payload-from-authorization-header';
import { getUserAgent } from '../../helpers/get-user-agent';

import type { HonoBindings } from '../../types/hono-bindings';
import type { HonoVariables } from '../../types/hono-variables';

export const pvApi = new Hono<{ Bindings: HonoBindings; Variables: HonoVariables; }>();
export const pvApiBasePath = apiPaths.pv.subPath;

pvApi.post(apiPaths.pv.index.subPath, async context => {
  const jwtPayload = await getJwtPaylodFromAuthorizationHeader(context.req, context.env);
  const name = (jwtPayload != null && !isEmpty(jwtPayload.sub)) ? String(jwtPayload.sub).trim() : null;
  const ipAddress = getIpAddress(context.req, context.env) ?? null;
  const userAgent = getUserAgent(context.req, context.env) ?? null;
  const body = await context.req.json().catch(() => null);
  const referrer = (body != null && !isEmpty(body.referrer)) ? String(body.referrer).trim() : null;
  
  await context.env.DB
    .prepare('INSERT INTO counters (name, ip_address, user_agent, referrer) VALUES (?, ?, ?, ?)')
    .bind(name, ipAddress, userAgent, referrer).run().catch(() => null);
  return context.json({ result: true }, 200);
});
