const { pool } = require('../db');

async function findByPhone(phone, db = pool) {
  const { rows } = await db.query('SELECT id, full_name, phone FROM customer WHERE phone = $1', [phone]);
  return rows[0] || null;
}

async function findById(id, db = pool) {
  const { rows } = await db.query('SELECT id, full_name, phone FROM customer WHERE id = $1', [id]);
  return rows[0] || null;
}

module.exports = { findByPhone, findById };
