import { pool } from '../../database/connection.js';

export class Session {
  static async create({
    userId,
    accessToken,
    refreshToken,
    accessTokenValidUntil,
    refreshTokenValidUntil,
  }) {
    const [result] = await pool.execute(
      `INSERT INTO sessions (user_id, access_token, refresh_token, access_token_valid_until, refresh_token_valid_until)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        accessToken,
        refreshToken,
        accessTokenValidUntil,
        refreshTokenValidUntil,
      ],
    );
    return result.insertId;
  }

  static async findByAccessToken(accessToken) {
    const [rows] = await pool.execute(
      'SELECT * FROM sessions WHERE access_token = ?',
      [accessToken],
    );
    return rows[0] || null;
  }

  static async findByRefreshToken(refreshToken) {
    const [rows] = await pool.execute(
      'SELECT * FROM sessions WHERE refresh_token = ?',
      [refreshToken],
    );
    return rows[0] || null;
  }

  static async updateTokens(
    sessionId,
    {
      accessToken,
      refreshToken,
      accessTokenValidUntil,
      refreshTokenValidUntil,
    },
  ) {
    await pool.execute(
      `UPDATE sessions
       SET access_token = ?, refresh_token = ?, access_token_valid_until = ?, refresh_token_valid_until = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        accessToken,
        refreshToken,
        accessTokenValidUntil,
        refreshTokenValidUntil,
        sessionId,
      ],
    );
  }

  static async deleteById(sessionId) {
    await pool.execute('DELETE FROM sessions WHERE id = ?', [sessionId]);
  }

  static async deleteByUserId(userId) {
    await pool.execute('DELETE FROM sessions WHERE user_id = ?', [userId]);
  }

  static async deleteExpiredSessions() {
    await pool.execute(
      'DELETE FROM sessions WHERE refresh_token_valid_until < NOW()',
    );
  }
}
