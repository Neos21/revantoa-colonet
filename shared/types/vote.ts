import type { BooleanNumberFalse, BooleanNumberTrue } from './boolean-number';
import type { VoteValueDownVote, VoteValueUpVote } from './vote-value';

/** エンドユーザ向けに利用する評価情報 */
export type Vote = {
  id: number;  // 識別用にクライアントにも渡す
  post_id: number;
  vote: VoteValueUpVote | VoteValueDownVote;
  is_cancelled: BooleanNumberFalse | BooleanNumberTrue | boolean;
  is_deleted: BooleanNumberFalse | BooleanNumberTrue | boolean;  // 更新時に更新して良いかチェックするために使用する
  // ユーザ ID は表に出さない
  
  // 以下 DB カラムにはなく画面表示で利用するフィールド
  
  /** その評価がログインユーザ自身によるものか否か */
  is_you: BooleanNumberFalse | BooleanNumberTrue | boolean;
};

/** 管理画面で利用するための評価情報 */
export type VoteForAdmin = {
  id: number;
  post_id: number;
  user_id: number;
  vote: VoteValueUpVote | VoteValueDownVote;
  is_cancelled: BooleanNumberFalse | BooleanNumberTrue | boolean;
  ip_address: string;
  user_agent: string;
  created_at: string;
  is_deleted: BooleanNumberFalse | BooleanNumberTrue | boolean;
  admin_memo: string;
  
  // 紐付く投稿情報
  post_content: string;
  post_is_deleted: BooleanNumberFalse | BooleanNumberTrue | boolean;
  // 紐付く投稿に紐付いているユーザ情報
  post_user_id: number;
  post_user_name: string;
  post_user_is_deleted: BooleanNumberFalse | BooleanNumberTrue | boolean;
  
  // 紐付くユーザ情報
  user_name: string;
  user_is_deleted: BooleanNumberFalse | BooleanNumberTrue | boolean;
};
