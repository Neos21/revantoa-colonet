import type { UserForCheckToken, UserForLogin, UserWithId, UserWithRecoveryCode } from '../types/user';

export class UsersRepository {
  constructor(private db: D1Database) { }
  
  /** ログイン時に必要なカラムを取得する : 削除されたユーザはログインできないようにする処理は、本関数の呼び出し元で制御する */
  public async getOneForLogin(name: string): Promise<UserForLogin | null> {
    return await this.db.prepare('SELECT password_hash, last_login_at, is_deleted FROM users WHERE name = ? LIMIT 1').bind(name).first<UserForLogin>();
  }
  
  /** JWT チェック時に必要なカラムを取得する : 削除されたユーザを認証しないようにする処理は、本関数の呼び出し元で制御する */
  public async getOneForCheckToken(name: string): Promise<UserForCheckToken | null> {
    return this.db.prepare('SELECT is_deleted FROM users WHERE name = ? LIMIT 1').bind(name).first<UserForCheckToken>();
  }
  
  /** ユーザ ID を取得したい場合に必要なカラムを取得する : 削除されたユーザによる投稿や評価は認めないようにする処理は、本関数の呼び出し元で制御する */
  public async getOneWithId(name: string): Promise<UserWithId | null> {
    return await this.db.prepare('SELECT id, is_deleted FROM users WHERE name = ? LIMIT 1').bind(name).first<UserWithId>();
  }
  
  /** ユーザ設定の参照時・パスワードリセット時に必要なカラムを取得する : 削除されたユーザのチェックは、本関数の呼び出し元で制御する */
  public async getOneWithRecoveryCode(name: string): Promise<UserWithRecoveryCode | null> {
    return await this.db.prepare('SELECT recovery_code, is_deleted FROM users WHERE name = ? LIMIT 1').bind(name).first<UserWithRecoveryCode>();
  }
  
  public async add(name: string, passwordHash: string, recoveryCode: string): Promise<D1Result> {
    return await this.db.prepare('INSERT INTO users (name, password_hash, recovery_code) VALUES (?, ?, ?)').bind(name, passwordHash, recoveryCode).run();
  }
  
  public async updateLastLoginAt(name: string): Promise<D1Result> {
    return await this.db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE name = ?').bind(name).run();
  }
  
  public async updatePasswordHash(name: string, passwordHash: string): Promise<D1Result> {
    return await this.db.prepare('UPDATE users SET password_hash = ? WHERE name = ?').bind(passwordHash, name).run();
  }
  
  public async updatePasswordHashAndRecoveryCode(name: string, passwordHash: string, recoveryCode: string): Promise<D1Result> {
    return await this.db.prepare('UPDATE users SET password_hash = ?, recovery_code = ? WHERE name = ?').bind(passwordHash, recoveryCode, name).run();
  }
  
  /** ユーザによるアカウント削除時の操作 */
  public async removeOneByUser(id: number, adminMemo: string): Promise<D1Result> {
    return await this.db.prepare(`
      UPDATE users
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
}
