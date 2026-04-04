import type { BooleanNumberFalse, BooleanNumberTrue } from './boolean-number';

/** 管理画面で利用するためのユーザ情報・`password_hash` だけは管理者でも取得しない */
export type UserForAdmin = {
  id: number;
  name: string;
  created_at: string;
  last_login_at: string;
  is_deleted: BooleanNumberFalse | BooleanNumberTrue | boolean;
  admin_memo: string;
};
