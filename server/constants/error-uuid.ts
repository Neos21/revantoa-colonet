/** エラー種別を表現する UUID (エラー詳細をエンドユーザに推測されにくくする) */
export const errorUuid = {
  /** リクエストボディがない場合 */
  noRequestBody           : 'bfd018ab-c9c1-4ffe-673f-6a0e508d5bab',
  /** ユーザ向けの JWT シークレットが設定されていなかった場合 (サーバ設定漏れ) */
  noUserJwtSecret         : '76103bac-7c8f-a854-d93b-fa14a4f7778d',
  /** IP アドレスが取得できなかった場合 (本番環境のみ) */
  noIpAddress             : '71550481-5eb4-716f-0da5-b2f968d0da1c',
  /** User-Agent が取得できなかった場合 */
  noUserAgent             : '4622c822-b29b-012e-2bfd-17b676353e0f',
  /** 拒否している IP アドレスからのアクセスだった場合 */
  denyIpAddress           : '87fcc69a-6166-1b9b-47df-523bc6a5ab69',
  /** Turnstile シークレットキーが設定されていなかった場合 (サーバ設定漏れ) */
  noTurnstileSecretKey    : '20b1072d-2677-8957-b85b-a9a488348e41',
  /** Turnstile のサーバ認証の結果が NG だった場合 */
  turnstileValidationError: '9935c07e-4ff7-e421-e6c3-ef110023e3aa',
  /** Turnstile のサーバ認証のための Fetch 処理に失敗した場合 */
  turnstileNetworkError   : 'e6f567ea-29b0-58eb-ab2c-c22efd47a776',
  /** 削除済みなどではなく実際に `users` テーブルにレコードがなかった場合 */
  noUser                  : 'bcff875b-c4d3-3d83-4b8a-d88fdde9343e',
  /** 削除済みユーザの場合 */
  userIsDeleted           : '5e1d1549-8495-4971-241b-a818978fe280',
  /** ユーザが投稿を削除する際に、その投稿がなかった・既に削除済だった・別のユーザの投稿だったために取得できなかった場合 */
  noPost                  : '1e7142f5-b8eb-9fb0-ca35-2033e5b78ef9',
  /** 管理者パスワードが設定されていなかった場合 (サーバ設定漏れ) */
  noAdminPassword         : 'cd97451f-a804-6ce2-d978-b265f5636a09',
  /** 管理用 JWT シークレットが設定されていなかった場合 (サーバ設定漏れ) */
  noAdminJwtSecret        : '2b85219b-b12d-025a-dc6e-bdad67fc21ec'
} as const;
