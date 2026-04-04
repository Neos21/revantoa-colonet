import type { BooleanNumberFalse, BooleanNumberTrue } from '../../shared/types/boolean-number';

/** ログイン時にパスワードハッシュを取得する型情報 */
export type UserForLogin = {
  password_hash: string;
  last_login_at: string;  // 最終ログイン日時がなければ初回ログインとみなしてメッセージを出す
  is_deleted: BooleanNumberFalse | BooleanNumberTrue | boolean;
};

/** トークン認証時にユーザの削除状態を確認するための型情報 */
export type UserForCheckToken = {
  is_deleted: BooleanNumberFalse | BooleanNumberTrue | boolean;
};

/** ID を取得する場合の型情報 */
export type UserWithId = {
  id: number;
  is_deleted: BooleanNumberFalse | BooleanNumberTrue | boolean;
};

/** ユーザ設定の参照時・パスワードリセット時の型情報 */
export type UserWithRecoveryCode = {
  recovery_code: string;
  is_deleted: BooleanNumberFalse | BooleanNumberTrue | boolean;
};
