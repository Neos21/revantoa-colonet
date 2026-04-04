import type { BooleanNumberFalse, BooleanNumberTrue } from './boolean-number';
import type { VoteValueCancelled, VoteValueDownVote, VoteValueUpVote } from './vote-value';

/** エンドユーザ向けに利用する投稿情報 */
export type Post = {
  id: number;  // 評価時に用いる
  content: string;
  created_at: string;
  
  // 以下 DB カラムにはなく画面表示で利用するフィールド
  
  /** その投稿がログインユーザ自身によるものか否か */
  is_you: BooleanNumberFalse | BooleanNumberTrue | boolean;
  /** ログインユーザによるその投稿への評価内容・評価をキャンセルしていた時は `0`・未評価の場合は `null` */
  my_vote: VoteValueUpVote | VoteValueDownVote | VoteValueCancelled | null;
  
  // 以下 `SELECT` はするがクライアントには返さないフィールド
  
  /** 投稿日時を元に一定期間でグループ化するための値 */
  time_bucket?: number;
  /** 好評価と低評価に重み付けを行ったスコア */
  score?: number;
};

/** 管理画面で利用するための投稿情報 */
export type PostForAdmin = {
  id: number;
  content: string;
  user_id: number;
  ip_address: string;
  user_agent: string;
  created_at: string;
  vote_count_up: number;
  vote_count_down: number;
  is_deleted: BooleanNumberFalse | BooleanNumberTrue | boolean;
  admin_memo: string;
  
  // 紐付くユーザ情報
  user_name: string;
  user_is_deleted: BooleanNumberFalse | BooleanNumberTrue | boolean;
};
