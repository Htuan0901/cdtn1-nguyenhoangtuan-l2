const { pool } = require('../db');

const COLS = `id, customer_id, serial_imei, model_name,
              to_char(purchase_date, 'YYYY-MM-DD') AS purchase_date, warranty_months`;

async function findById(id, db = pool) {
  const { rows } = await db.query(`SELECT ${COLS} FROM device WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function findBySerial(serialImei, db = pool) {
  const { rows } = await db.query(`SELECT ${COLS} FROM device WHERE serial_imei = $1`, [serialImei]);
  return rows[0] || null;
}

async function findByCustomer(customerId, db = pool) {
  const { rows } = await db.query(`SELECT ${COLS} FROM device WHERE customer_id = $1 ORDER BY id`, [customerId]);
  return rows;
}

async function insert(d, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO device (customer_id, serial_imei, model_name, purchase_date, warranty_months)
     VALUES ($1, $2, $3, $4, $5) RETURNING ${COLS}`,
    [d.customerId, d.serialImei, d.modelName, d.purchaseDate, d.warrantyMonths],
  );
  return rows[0];
}

async function update(id, { modelName, purchaseDate, warrantyMonths }, db = pool) {
  // purchaseDate: undefined = giữ nguyên; null = xoá ngày mua (thiết bị thành "chưa xác minh")
  const { rows } = await db.query(
    `UPDATE device SET model_name = COALESCE($2, model_name),
                       purchase_date = CASE WHEN $3::boolean THEN $4::date ELSE purchase_date END,
                       warranty_months = COALESCE($5, warranty_months)
      WHERE id = $1 RETURNING ${COLS}`,
    [id, modelName ?? null, purchaseDate !== undefined, purchaseDate ?? null, warrantyMonths ?? null],
  );
  return rows[0] || null;
}

async function countTickets(id, db = pool) {
  const { rows } = await db.query('SELECT count(*)::int AS n FROM ticket WHERE device_id = $1', [id]);
  return rows[0].n;
}

async function remove(id, db = pool) {
  const { rowCount } = await db.query('DELETE FROM device WHERE id = $1', [id]);
  return rowCount;
}

module.exports = { findById, findBySerial, findByCustomer, insert, update, countTickets, remove };
