import type { BooleanNumberFalse, BooleanNumberTrue } from './boolean-number';
import type { VoteValueDownVote, VoteValueUpVote } from './vote-value';

/** 投稿1件に対する評価1件を表す型 */
type AdminTimelineVote = {
  // `votes` テーブルの `post_id`・`user_id` 以外の全カラム
  vote_id: number;
  vote_vote: VoteValueUpVote | VoteValueDownVote;
  vote_is_cancelled: BooleanNumberFalse | BooleanNumberTrue | boolean;
  vote_ip_address: string;
  vote_user_agent: string;
  vote_created_at: string;
  vote_is_deleted: BooleanNumberFalse | BooleanNumberTrue | boolean;
  vote_admin_memo: string;
  
  // `users` テーブルの `password_hash`・`created_at`・`last_login_at` 以外の全カラム
  user_id: number;
  user_name: string;
  user_is_deleted: BooleanNumberFalse | BooleanNumberTrue | boolean;
  user_admin_memo: string;
};

/** 管理画面で利用するためのタイムライン情報 */
export type AdminTimeline = {
  // `posts` テーブルの `user_id` 以外の全カラム
  post_id: number;
  post_content: string;
  post_ip_address: string;
  post_user_agent: string;
  post_created_at: string;
  post_vote_count_up: number;
  post_vote_count_down: number;
  post_is_deleted: BooleanNumberFalse | BooleanNumberTrue | boolean;
  post_admin_memo: string;
  
  // `users` テーブルの `password_hash`・`created_at`・`last_login_at` 以外の全カラム
  user_id: number;
  user_name: string;
  user_is_deleted: BooleanNumberFalse | BooleanNumberTrue | boolean;
  user_admin_memo: string;
  
  // 評価の配列
  votes: Array<AdminTimelineVote>;
};
