import type { BooleanNumberFalse, BooleanNumberTrue } from './boolean-number';

/** エンドユーザ向けに利用する匿名投稿情報 */
export type AnonymousPost = {
  content: string;
  created_at: string;
};

/** 管理画面で利用するための匿名投稿情報 */
export type AnonymousPostForAdmin = {
  id: number;
  content: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  is_deleted: BooleanNumberFalse | BooleanNumberTrue | boolean;
  admin_memo: string;
};
