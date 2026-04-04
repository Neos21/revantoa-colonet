import type { AnonymousPost } from '../../shared/types/anonymous-post';

export class AnonymousPostsRepository {
  constructor(private db: D1Database) { }
  
  public async getForTimeline(): Promise<Array<AnonymousPost>> {
    const anonymousPostsResult = await this.db
      .prepare(`
        SELECT
          anonymous_posts.content,
          anonymous_posts.created_at
        FROM anonymous_posts
        WHERE
          anonymous_posts.is_deleted = 0
        ORDER BY
          anonymous_posts.created_at DESC
        LIMIT 500
      `)
      .all<AnonymousPost>();
    return anonymousPostsResult.results;
  }
  
  public async add(content: string, ipAddress: string, userAgent: string): Promise<D1Result> {
    return await this.db.prepare('INSERT INTO anonymous_posts (content, ip_address, user_agent) VALUES (?, ?, ?)').bind(content, ipAddress, userAgent).run();
  }
}
