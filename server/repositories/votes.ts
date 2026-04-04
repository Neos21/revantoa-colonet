import { voteValue } from '../../shared/constants/vote-value';

import type { Result } from '../../shared/types/result';
import type { Vote } from '../../shared/types/vote';
import type { VoteValueDownVote, VoteValueUpVote } from '../../shared/types/vote-value';

export class VotesRepository {
  constructor(private db: D1Database) { }
  
  public async getOneByPostIdAndUserId(postId: number, userId: number): Promise<Vote | null> {
    return await this.db.prepare('SELECT id, vote, is_cancelled, is_deleted FROM votes WHERE post_id = ? AND user_id = ? LIMIT 1').bind(postId, userId).first<Vote>();
  }
  
  public async addWithVoteCount(postId: number, userId: number, vote: VoteValueUpVote | VoteValueDownVote, ipAddress: string, userAgent: string): Promise<Result<true>> {
    await this.db
      .prepare('INSERT INTO votes (post_id, user_id, vote, ip_address, user_agent, is_cancelled) VALUES (?, ?, ?, ?, ?, 0)')
      .bind(postId, userId, vote, ipAddress, userAgent).run();
    
    // `posts` テーブルの好評価 or 低評価カウントをインクリメントする
    vote === voteValue.upVote ? await this.updatePostsIncrementUp(postId) : await this.updatePostsIncrementDown(postId);  // eslint-disable-line @typescript-eslint/no-unused-expressions
    
    return { result: true };
  }
  
  public async updateWithVoteCount(afterVote: VoteValueUpVote | VoteValueDownVote, afterIsCancelled: boolean, id: number, postId: number, beforeVote: VoteValueUpVote | VoteValueDownVote, beforeIsCancelled: boolean): Promise<Result<true>> {
    await this.db
      .prepare('UPDATE votes SET vote = ?, is_cancelled = ? WHERE id = ?')
      .bind(afterVote, afterIsCancelled, id).run();
    
    if(beforeIsCancelled && !afterIsCancelled) {  // 取消済から有効評価を行った場合
      afterVote === voteValue.upVote ? await this.updatePostsIncrementUp(postId) : await this.updatePostsIncrementDown(postId);  // eslint-disable-line @typescript-eslint/no-unused-expressions
    }
    else if(!beforeIsCancelled && afterIsCancelled) {  // 有効状態から取消評価を行った場合
      afterVote === voteValue.upVote ? await this.updatePostsDecrementUp(postId) : await this.updatePostsDecrementDown(postId);  // eslint-disable-line @typescript-eslint/no-unused-expressions
    }
    else if(!beforeIsCancelled && !afterIsCancelled && beforeVote !== afterVote) {  // 有効評価の内訳を入れ替える場合
      beforeVote === voteValue.upVote ? await this.updatePostsVoteCountDecrementUpIncrementDown(postId) : await this.updatePostsVoteCountIncrementUpDecrementDown(postId);  // eslint-disable-line @typescript-eslint/no-unused-expressions
    }
    else {
      return { error: '実装誤り : 想定外の評価状況' };
    }
    
    return { result: true };
  }
  
  private async updatePostsIncrementUp(postId: number): Promise<D1Result> {
    return await this.updatePostsVoteCount(postId, 'vote_count_up', '+');
  }
  private async updatePostsDecrementUp(postId: number): Promise<D1Result> {
    return await this.updatePostsVoteCount(postId, 'vote_count_up', '-');
  }
  private async updatePostsIncrementDown(postId: number): Promise<D1Result> {
    return await this.updatePostsVoteCount(postId, 'vote_count_down', '+');
  }
  private async updatePostsDecrementDown(postId: number): Promise<D1Result> {
    return await this.updatePostsVoteCount(postId, 'vote_count_down', '-');
  }
  private async updatePostsVoteCount(postId: number, targetColumnName: 'vote_count_up' | 'vote_count_down', operator: '+' | '-'): Promise<D1Result> {
    return await this.db.prepare(`UPDATE posts SET ${targetColumnName} = ${targetColumnName} ${operator} 1 WHERE id = ?`).bind(postId).run();  // 負数に `UPDATE` されそうになったら `CHECK` 制約違反となる
  }
  
  /** 好評価を取り消し低評価を追加する */
  private async updatePostsVoteCountDecrementUpIncrementDown(postId: number): Promise<D1Result> {
    return await this.db.prepare(`
      UPDATE posts
      SET
        vote_count_up   = vote_count_up   - 1,
        vote_count_down = vote_count_down + 1
      WHERE id = ?
    `).bind(postId).run();
  }
  /** 低評価を取り消し好評価を追加する */
  private async updatePostsVoteCountIncrementUpDecrementDown(postId: number): Promise<D1Result> {
    return await this.db.prepare(`
      UPDATE posts
      SET
        vote_count_up   = vote_count_up   + 1,
        vote_count_down = vote_count_down - 1
      WHERE id = ?
    `).bind(postId).run();
  }
  
  /** ユーザによるアカウント削除時の操作 */
  public async removeAllByUser(userId: number, adminMemo: string): Promise<D1Result> {
    return await this.db.prepare(`
      UPDATE votes
      SET
        is_deleted = 1,
        admin_memo =
          trim(
            ? || char(10) || COALESCE(NULLIF(trim(admin_memo), ''), ''),
            char(10) || ' '
          )
      WHERE user_id = ?
    `).bind(adminMemo, userId).run();
  }
}
