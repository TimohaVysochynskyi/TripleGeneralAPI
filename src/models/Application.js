import { pool } from '../database/connection.js';

export class Application {
  static async findByUserId(userId) {
    const [rows] = await pool.execute(
      `SELECT id, user_id, first_name, last_name, patronymic, birth_date,
       passport_series, passport_number, issuing_authority, place_of_residence,
       passport_photo_url, user_photo_url, digital_signature_url,
       status, created_at, updated_at, processed_at, processed_by, rejection_reason
       FROM applications WHERE user_id = ?`,
      [userId],
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT id, user_id, first_name, last_name, patronymic, birth_date,
       passport_series, passport_number, issuing_authority, place_of_residence,
       passport_photo_url, user_photo_url, digital_signature_url,
       status, created_at, updated_at, processed_at, processed_by, rejection_reason
       FROM applications WHERE id = ?`,
      [id],
    );
    return rows[0] || null;
  }

  static async create(applicationData) {
    const {
      userId,
      firstName,
      lastName,
      patronymic,
      birthDate,
      passportSeries,
      passportNumber,
      issuingAuthority,
      placeOfResidence,
      passportPhotoUrl = null,
      userPhotoUrl = null,
      digitalSignatureUrl = null,
    } = applicationData;

    const [result] = await pool.execute(
      `INSERT INTO applications
       (user_id, first_name, last_name, patronymic, birth_date,
        passport_series, passport_number, issuing_authority, place_of_residence,
        passport_photo_url, user_photo_url, digital_signature_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        firstName,
        lastName,
        patronymic,
        birthDate,
        passportSeries,
        passportNumber,
        issuingAuthority,
        placeOfResidence,
        passportPhotoUrl,
        userPhotoUrl,
        digitalSignatureUrl,
      ],
    );
    return result.insertId;
  }

  static async updateStatus(
    id,
    status,
    processedBy = null,
    rejectionReason = null,
  ) {
    const [result] = await pool.execute(
      `UPDATE applications
       SET status = ?, processed_at = NOW(), processed_by = ?, rejection_reason = ?
       WHERE id = ?`,
      [status, processedBy, rejectionReason, id],
    );
    return result.affectedRows > 0;
  }

  static async updatePhotoUrls(id, photoUrls) {
    const { passportPhotoUrl, userPhotoUrl, digitalSignatureUrl } = photoUrls;

    const setClause = [];
    const values = [];

    if (passportPhotoUrl !== undefined) {
      setClause.push('passport_photo_url = ?');
      values.push(passportPhotoUrl);
    }
    if (userPhotoUrl !== undefined) {
      setClause.push('user_photo_url = ?');
      values.push(userPhotoUrl);
    }
    if (digitalSignatureUrl !== undefined) {
      setClause.push('digital_signature_url = ?');
      values.push(digitalSignatureUrl);
    }

    if (setClause.length === 0) return false;

    values.push(id);

    const [result] = await pool.execute(
      `UPDATE applications SET ${setClause.join(', ')} WHERE id = ?`,
      values,
    );
    return result.affectedRows > 0;
  }

  static async getAll(filters = {}) {
    // Build count query
    let countQuery = `
      SELECT COUNT(*) as total
      FROM applications a
    `;

    // Build main query
    let query = `
      SELECT a.id, a.user_id, a.first_name, a.last_name, a.patronymic, a.birth_date,
             a.passport_series, a.passport_number, a.issuing_authority, a.place_of_residence,
             a.passport_photo_url, a.user_photo_url, a.digital_signature_url,
             a.status, a.created_at, a.updated_at, a.processed_at, a.processed_by, a.rejection_reason,
             u.username, u.email,
             processor.username as processor_username
      FROM applications a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN users processor ON a.processed_by = processor.id
    `;

    const conditions = [];
    const values = [];

    if (filters.status) {
      conditions.push('a.status = ?');
      values.push(filters.status);
    }

    if (filters.userId) {
      conditions.push('a.user_id = ?');
      values.push(filters.userId);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    // Get total count
    const [countRows] = await pool.execute(countQuery, values);
    const total = countRows[0].total;

    // Sorting - map frontend field names to database columns
    const sortByMap = {
      submittedAt: 'a.created_at',
      status: 'a.status',
      firstName: 'a.first_name',
      lastName: 'a.last_name',
      email: 'u.email',
    };

    const sortBy = sortByMap[filters.sortBy] || 'a.created_at';
    const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${sortBy} ${sortOrder}`;

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    query += ' LIMIT ? OFFSET ?';
    values.push(limit, offset);

    const [rows] = await pool.execute(query, values);

    return {
      applications: rows,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async delete(id) {
    const [result] = await pool.execute(
      'DELETE FROM applications WHERE id = ?',
      [id],
    );
    return result.affectedRows > 0;
  }
}
