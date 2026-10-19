const { pool } = require('../db');

async function findAllActive(db = pool) {
  const { rows } = await db.query(
    'SELECT code, name, default_priority FROM issue_category WHERE is_active ORDER BY id',
  );
  return rows;
}

async function findByCode(code, db = pool) {
  const { rows } = await db.query(
    'SELECT id, code, name, default_priority, is_active FROM issue_category WHERE code = $1',
    [code],
  );
  return rows[0] || null;
}

module.exports = { findAllActive, findByCode };
