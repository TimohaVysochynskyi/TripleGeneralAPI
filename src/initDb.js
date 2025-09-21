import { pool } from './database/connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const initDatabase = async () => {
  try {
    console.log('🔄 Connecting to database...');

    const sqlPath = path.join(__dirname, 'database', 'sessions.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('🔄 Creating sessions table...');

    await pool.execute(sql);
    console.log('✅ Sessions table created successfully');

    await pool.end();
    console.log('✅ Database initialization completed');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
};

initDatabase();
