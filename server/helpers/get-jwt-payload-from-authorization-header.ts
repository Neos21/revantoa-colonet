import { verify } from 'hono/jwt';

import { isEmpty } from '../../shared/helpers/is-empty';

import type { HonoBindings } from '../types/hono-bindings';
import type { HonoVariables } from '../types/hono-variables';
import type { HonoRequest } from 'hono';

export const getJwtPaylodFromAuthorizationHeader = async (req: HonoRequest, env: HonoBindings): Promise<HonoVariables['jwtPayload'] | null> => {
  const authorizationHeader = req.header('Authorization');
  if(authorizationHeader == null) return null;
  
  const [scheme, jwt] = authorizationHeader.split(' ');
  if(scheme !== 'Bearer' || isEmpty(jwt)) return null;
  
  const jwtPayload = await verify(jwt, env.USER_JWT_SECRET, 'HS256').catch(() => null);
  return jwtPayload as HonoVariables['jwtPayload'];
};
