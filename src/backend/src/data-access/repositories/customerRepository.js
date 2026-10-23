const { pool } = require('../db');

async function findByPhone(phone, db = pool) {
  const { rows } = await db.query('SELECT id, full_name, phone FROM customer WHERE phone = $1', [phone]);
  return rows[0] || null;
}

async function findById(id, db = pool) {
  const { rows } = await db.query('SELECT id, full_name, phone FROM customer WHERE id = $1', [id]);
  return rows[0] || null;
}

async function insert({ fullName, phone }, db = pool) {
  const { rows } = await db.query(
    'INSERT INTO customer (full_name, phone) VALUES ($1, $2) RETURNING id, full_name, phone',
    [fullName, phone],
  );
  return rows[0];
}

module.exports = { findByPhone, findById, insert };
