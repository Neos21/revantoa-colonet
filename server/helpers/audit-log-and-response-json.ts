import type { HonoBindings } from '../types/hono-bindings';
import type { HonoVariables } from '../types/hono-variables';
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export const auditLogAndResponseJson = async (context: Context<{ Bindings: HonoBindings; Variables: HonoVariables; }>, log: string, errorMessage: string, httpStatusCode: ContentfulStatusCode): Promise<Response> => {
  try {
    await context.env.DB.prepare('INSERT INTO audit_logs (log) VALUES (?)').bind(log).run();
  }
  catch(error) {
    const jstNow = new Date(Date.now() + ((new Date().getTimezoneOffset() + (9 /* Hours */ * 60 /* Minutes */)) * 60 /* Seconds */ * 1000 /* Milliseconds */));
    const year    = jstNow.getFullYear();
    const month   = String(jstNow.getMonth() + 1).padStart(2, '0');
    const date    = String(jstNow.getDate()     ).padStart(2, '0');
    const hours   = String(jstNow.getHours()    ).padStart(2, '0');
    const minutes = String(jstNow.getMinutes()  ).padStart(2, '0');
    const seconds = String(jstNow.getSeconds()  ).padStart(2, '0');
    const jstNowString = `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
    console.error(`[JST ${jstNowString}] 監査ログの書き込みに失敗`);
    console.error(`[JST ${jstNowString}]   Log : `, log);
    console.error(`[JST ${jstNowString}]   Error : `, error);
  }
  
  return context.json({ error: errorMessage }, httpStatusCode);
};
