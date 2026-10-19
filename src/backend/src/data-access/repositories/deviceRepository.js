const { pool } = require('../db');

async function findById(id, db = pool) {
  const { rows } = await db.query(
    `SELECT id, customer_id, serial_imei, model_name,
            to_char(purchase_date, 'YYYY-MM-DD') AS purchase_date, warranty_months
       FROM device WHERE id = $1`,
    [id],
  );
  return rows[0] || null;
}

module.exports = { findById };
