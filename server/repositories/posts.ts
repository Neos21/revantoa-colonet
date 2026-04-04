import { convertNumberToBoolean } from '../../shared/helpers/convert-number-to-boolean';

import type { Post } from '../../shared/types/post';

export class PostsRepository {
  constructor(private db: D1Database) { }
  
  public async getForTimeline(userIdOrNull: number | null): Promise<Array<Post>> {
    /** 一定時間ごとにグループ化するための数値 (時間単位) */
    const timeBucketHours   = 3;
    /** 低評価への重み付け */
    const weightingDownVote = 2.5;
    
    // `time_bucket`  : 一定時間ごとにグループ化するための数値
    // `is_you`       : 未ログインユーザであれば常に `0` (False)、ログイン済ユーザの場合はその投稿が自身のモノか否かを示す
    // `my_vote`      : 未ログインユーザであれば常に Null (未評価)、ログイン済ユーザの場合はその投稿の評価・未評価なら Null・キャンセルした評価データがある場合は `0` とする
    // `score`        : `good_count` 相当はそのまま合計、`bad_count` は重みを付与してマイナスしたスコア
    // `posts.id % 7` : スコアが同じ場合に `RANDOM()` を使わず、投稿 ID の剰余 (余りの整数値) を疑似ランダム値に使用する方法。5・7・11・13 などの小さい素数を使うと偏りが減る
    const postsResult = await this.db
      .prepare(`
        SELECT
          posts.id,
          posts.content,
          posts.created_at,
          
          CAST((julianday(posts.created_at) * 24) / ? AS INTEGER) AS time_bucket,
          
          CASE
            WHEN ? IS NOT NULL AND posts.user_id = ?
              THEN 1
              ELSE 0
          END AS is_you,
          
          CASE
            WHEN votes_self.is_cancelled = 1
              THEN 0
              ELSE votes_self.vote
          END AS my_vote,
          
          (posts.vote_count_up - (posts.vote_count_down * ?)) AS score
        
        FROM posts
        JOIN users
          ON posts.user_id = users.id
        
        LEFT JOIN votes votes_self
          ON  votes_self.post_id    = posts.id
          AND votes_self.user_id    = ?
          AND votes_self.is_deleted = 0
        
        WHERE
            posts.is_deleted = 0
        AND users.is_deleted = 0
        
        GROUP BY posts.id
        
        ORDER BY
          time_bucket DESC,
          score       DESC,
          posts.id % 7
        
        LIMIT 500
      `)
      .bind(timeBucketHours, userIdOrNull, userIdOrNull, weightingDownVote, userIdOrNull)
      .all<Post>();
    
    // レスポンスに不要なフィールドを削除し真偽値を型変換する
    const posts = postsResult.results.map(post => {
      delete post.time_bucket;
      delete post.score;
      post.is_you = convertNumberToBoolean(post.is_you);
      return post;
    });
    return posts;
  }
  
  public async getAllByUserId(userId: number): Promise<Array<Post>> {
    const postsResult = await this.db
      .prepare(`
        SELECT
          posts.id,
          posts.content,
          posts.created_at
        FROM posts
        WHERE
            posts.user_id = ?
        AND posts.is_deleted = 0
        ORDER BY
          posts.created_at DESC
        LIMIT 500
      `)
      .bind(userId)
      .all<Post>();
    return postsResult.results;
  }
  
  public async existsByUserId(userId: number): Promise<boolean> {
    const exists = await this.db.prepare('SELECT 1 FROM posts WHERE posts.user_id = ? AND posts.is_deleted = 0 LIMIT 1').bind(userId).first();
    return exists != null;
  }
  
  public async add(content: string, userId: number, ipAddress: string, userAgent: string): Promise<D1Result> {
    return await this.db.prepare('INSERT INTO posts (content, user_id, ip_address, user_agent) VALUES (?, ?, ?, ?)').bind(content, userId, ipAddress, userAgent).run();
  }
  
  /** ユーザによる削除操作 : `admin_memo` の Null を考慮しつつ、先頭に「文章\n」を追記し、更新後のカラムに不要な空文字等が含まれないようにする */
  public async removeOneByUser(id: number, adminMemo: string): Promise<D1Result> {
    return await this.db.prepare(`
      UPDATE posts
      SET
        is_deleted = 1,
        admin_memo =
          trim(
            ? || char(10) || COALESCE(NULLIF(trim(admin_memo), ''), ''),
            char(10) || ' '
          )
      WHERE id = ?
    `).bind(adminMemo, id).run();
  }
  
  /** ユーザによるアカウント削除時の操作 */
  public async removeAllByUser(userId: number, adminMemo: string): Promise<D1Result> {
    return await this.db.prepare(`
      UPDATE posts
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
