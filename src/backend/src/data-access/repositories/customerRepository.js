const { pool } = require('../db');

const COLS = 'id, full_name, phone';

async function findByPhone(phone, db = pool) {
  const { rows } = await db.query(`SELECT ${COLS} FROM customer WHERE phone = $1`, [phone]);
  return rows[0] || null;
}

async function findById(id, db = pool) {
  const { rows } = await db.query(`SELECT ${COLS} FROM customer WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function insert({ fullName, phone }, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO customer (full_name, phone) VALUES ($1, $2) RETURNING ${COLS}`,
    [fullName, phone],
  );
  return rows[0];
}

// Danh sách có tìm kiếm (SĐT đã chuẩn hoá khớp chính xác, hoặc họ tên chứa chuỗi) + phân trang tại CSDL (NFR3)
async function search({ phone, name, limit, offset }, db = pool) {
  const where = []; const params = [];
  if (phone) { params.push(phone); where.push(`c.phone = $${params.length}`); }
  if (name) { params.push(`%${name}%`); where.push(`c.full_name ILIKE $${params.length}`); }
  const whereSql = where.length ? `WHERE ${where.join(' OR ')}` : '';
  const total = (await db.query(`SELECT count(*)::int AS n FROM customer c ${whereSql}`, params)).rows[0].n;
  params.push(limit, offset);
  const { rows } = await db.query(
    `SELECT c.id, c.full_name, c.phone,
            (SELECT count(*)::int FROM device d WHERE d.customer_id = c.id) AS device_count,
            (SELECT count(*)::int FROM ticket t WHERE t.customer_id = c.id) AS ticket_count
       FROM customer c ${whereSql}
      ORDER BY c.id DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return { total, rows };
}

async function update(id, { fullName, phone }, db = pool) {
  const { rows } = await db.query(
    `UPDATE customer SET full_name = COALESCE($2, full_name), phone = COALESCE($3, phone)
      WHERE id = $1 RETURNING ${COLS}`,
    [id, fullName ?? null, phone ?? null],
  );
  return rows[0] || null;
}

async function countDevices(id, db = pool) {
  const { rows } = await db.query('SELECT count(*)::int AS n FROM device WHERE customer_id = $1', [id]);
  return rows[0].n;
}

async function remove(id, db = pool) {
  const { rowCount } = await db.query('DELETE FROM customer WHERE id = $1', [id]);
  return rowCount;
}

module.exports = { findByPhone, findById, insert, search, update, countDevices, remove };
