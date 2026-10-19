// Lớp ④ – Truy cập dữ liệu: pool kết nối PostgreSQL và tiện ích giao dịch.
const { Pool } = require('pg');
const { config } = require('../config');

const pool = new Pool({ connectionString: config.databaseUrl });

// "executor" là pool (truy vấn lẻ) hoặc client (đang trong giao dịch).
// Repository nhận executor để service quyết định khi nào cần giao dịch.
async function withTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK'); // NFR5: lỗi ở bất kỳ bước nào → không lưu dở
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, withTransaction };
