const { pool } = require('../db');

async function findByUsername(username, db = pool) {
  const { rows } = await db.query(
    'SELECT id, username, full_name, role, center_code, is_active, password_hash FROM staff WHERE username = $1',
    [username],
  );
  return rows[0] || null;
}

module.exports = { findByUsername };
