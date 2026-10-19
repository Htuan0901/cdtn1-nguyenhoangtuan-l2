// Chạy các migration trong db/migrations theo thứ tự tên tệp; mỗi tệp chỉ chạy một lần.
// Cách dùng: npm run migrate
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/data-access/db');

(async () => {
  const dir = path.join(__dirname, '..', 'db', 'migrations');
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    file_name VARCHAR(200) PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  const done = new Set((await pool.query('SELECT file_name FROM schema_migrations')).rows.map((r) => r.file_name));
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    if (done.has(file)) { console.log(`- bỏ qua ${file} (đã chạy)`); continue; }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(fs.readFileSync(path.join(dir, file), 'utf8'));
      await client.query('INSERT INTO schema_migrations (file_name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`✓ đã chạy ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`✗ lỗi ở ${file}: ${err.message}`);
      process.exitCode = 1;
      break;
    } finally {
      client.release();
    }
  }
  const { rows } = await pool.query(`SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name <> 'schema_migrations' ORDER BY table_name`);
  console.log(`Bảng hiện có (${rows.length}): ${rows.map((r) => r.table_name).join(', ')}`);
  await pool.end();
})();
