import mysql from 'mysql2/promise';
import { env } from '../utils/env.js';

const connectionConfig = {
  host: env('MYSQL_HOST'),
  port: parseInt(env('MYSQL_PORT', '3306')),
  user: env('MYSQL_USER'),
  password: env('MYSQL_PASSWORD'),
  database: env('MYSQL_DATABASE'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

export const pool = mysql.createPool(connectionConfig);

// Test connection
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    console.log('⚠️ Server will continue without database connection');
    return false; // Don't exit process, just warn
  }
};
