export type HonoBindings = {
  /** D1 SQLite データベースとのバインディング */
  DB: D1Database;
  /** 本番環境なら `true`・開発環境なら `.dev.vars` より `false` の値が設定されている・IP アドレス検証などのスキップ等に利用する */
  IS_PRODUCTION: string;
  /** ユーザ向けの JWT シークレット */
  USER_JWT_SECRET: string;
  /** 管理ログインパスワード */
  ADMIN_PASSWORD: string;
  /** 管理用の JWT シークレット */
  ADMIN_JWT_SECRET: string;
  /** Turnstile シークレットキー */
  TURNSTILE_SECRET_KEY: string;
};
