import { pool } from '../../database/connection.js';

export class User {
  static async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT id, username, email, password, name, surname, photo, banned FROM users WHERE email = ?',
      [email],
    );
    return rows[0] || null;
  }

  static async findByUsername(username) {
    const [rows] = await pool.execute(
      'SELECT id, username, email, password, name, surname, photo, banned FROM users WHERE username = ?',
      [username],
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, username, email, name, surname, photo, last_online, balance, passport_valid, is_online, banned FROM users WHERE id = ?',
      [id],
    );
    return rows[0] || null;
  }

  static async create({ username, email, password, name = '', surname = '' }) {
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password, name, surname, photo, last_online, place_online) VALUES (?, ?, ?, ?, ?, "", NOW(), "")',
      [username, email, password, name, surname],
    );
    return result.insertId;
  }

  static async updateLastOnline(id) {
    await pool.execute(
      'UPDATE users SET last_online = NOW(), is_online = 1 WHERE id = ?',
      [id],
    );
  }

  static async setOffline(id) {
    await pool.execute('UPDATE users SET is_online = 0 WHERE id = ?', [id]);
  }
}
