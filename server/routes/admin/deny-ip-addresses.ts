import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { apiPaths } from '../../../shared/constants/api-paths';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { convertIpV6AddressTo64Bit } from '../../helpers/convert-ip-v6-address-to-64-bit';
import { isConstraintError } from '../../helpers/is-constraint-error';

import type { DenyIpAddress } from '../../../shared/types/deny-ip-address';
import type { HonoBindings } from '../../types/hono-bindings';
import type { HonoVariables } from '../../types/hono-variables';

export const adminDenyIpAddressesApi = new Hono<{ Bindings: HonoBindings; Variables: HonoVariables; }>();
export const adminDenyIpAddressesApiBasePath = apiPaths.admin.denyIpAddresses.subPath;

adminDenyIpAddressesApi.use((context, next) => jwt({ secret: context.env.ADMIN_JWT_SECRET, alg: 'HS256' })(context, next));

adminDenyIpAddressesApi.get(apiPaths.admin.denyIpAddresses.index.subPath, async context => {
  const denyIpAddressesResult = await context.env.DB.prepare('SELECT id, ip_address, created_at FROM deny_ip_addresses ORDER BY id DESC').all<DenyIpAddress>();
  return context.json({ result: denyIpAddressesResult.results }, 200);
});

adminDenyIpAddressesApi.post(apiPaths.admin.denyIpAddresses.index.subPath, async context => {
  const body: DenyIpAddress = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, 400);
  
  if(isEmpty(body.ip_address)) return context.json({ error: 'IP Address は必須です' }, 400);
  
  try {
    // IPv6 の場合、完全展開したアドレスの上位64ビットまで (例 : `2001:0db8:0000:0000::/64` 形式) に変換して保存する
    const targetIpAddress = body.ip_address.includes(':') ? convertIpV6AddressTo64Bit(body.ip_address) : body.ip_address;
    
    await context.env.DB.prepare('INSERT INTO deny_ip_addresses (ip_address) VALUES (?)').bind(targetIpAddress).run();
    return context.json({ result: true }, 201);
  }
  catch(error) {
    if(isConstraintError(error)) return context.json({ error: 'IP アドレスが重複しています' }, 400);
    return context.json({ error: 'IP アドレスの追加に失敗しました' }, 400);
  }
});

adminDenyIpAddressesApi.delete(apiPaths.admin.denyIpAddresses.index.subPath, async context => {
  const body: DenyIpAddress = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, 400);
  
  if(isEmpty(body.id)) return context.json({ error: 'ID は必須です' }, 400);
  
  await context.env.DB.prepare('DELETE FROM deny_ip_addresses WHERE id = ?').bind(body.id).run();
  return context.body(null, 204);
});
