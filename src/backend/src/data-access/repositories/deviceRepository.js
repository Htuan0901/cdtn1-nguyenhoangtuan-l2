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

module.exports = { findById, findBySerial, findByCustomer, insert };
