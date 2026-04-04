import { isEmpty } from '../../shared/helpers/is-empty';
import { errorUuid } from '../constants/error-uuid';

import type { Result } from '../../shared/types/result';
import type { HonoBindings } from '../types/hono-bindings';

/** Turnstile サーバ認証を行う : エラー時はエラー種別を示す UUID を返す */
export const validateTurnstile = async (env: HonoBindings, turnstileToken: string, ipAddress?: string): Promise<Result<true>> => {
  const turnstileSecretKey = env.TURNSTILE_SECRET_KEY;
  if(isEmpty(turnstileSecretKey)) return { error: errorUuid.noTurnstileSecretKey };
  
  try {
    // https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
    const remoteIp = ipAddress ?? 'Unknown (Production)';
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: `secret=${encodeURIComponent(turnstileSecretKey)}&response=${encodeURIComponent(turnstileToken)}&remoteip=${encodeURIComponent(remoteIp)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const json: {
      success: boolean;  // 使うのはココだけ
      hostname: string;
      challenge_ts: string;  // `YYYY-MM-DDTHH:mm:SS.sssZ`
      action: string;
      cdata: string;
      'error-codes': Array<any>;  // eslint-disable-line @typescript-eslint/no-explicit-any
      metadata: { interactive: boolean; };
    } = await response.json();
    if(!json.success) return { error: errorUuid.turnstileValidationError };
    
    return { result: true };
  }
  catch {
    return { error: errorUuid.turnstileNetworkError };
  }
};
