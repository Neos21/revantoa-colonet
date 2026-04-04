import type { HonoBindings } from '../types/hono-bindings';

/** 環境変数 `IS_PRODUCTION` を参照し本番環境かどうかを判定する */
export const isProduction = (env: HonoBindings): boolean => {
  const isProductionValue = env.IS_PRODUCTION;
  if(typeof isProductionValue === 'boolean') return isProductionValue;
  return isProductionValue.toLowerCase() === 'true';
};
