// Repository phiếu bảo hành: chỉ SQL tham số hoá, không chứa quy tắc nghiệp vụ.
const { pool } = require('../db');

const SELECT_VIEW = `
  SELECT t.id, t.ticket_code, t.status, t.priority, t.warranty_result, t.center_code,
         t.issue_desc, t.received_at, t.due_at,
         c.id AS customer_id, c.full_name AS customer_name, c.phone,
         d.id AS device_id, d.serial_imei, d.model_name,
         to_char(d.purchase_date, 'YYYY-MM-DD') AS purchase_date, d.warranty_months,
         ic.code AS category_code, ic.name AS category_name,
         s.full_name AS received_by_name
    FROM ticket t
    JOIN customer c        ON c.id = t.customer_id
    JOIN device d          ON d.id = t.device_id
    JOIN issue_category ic ON ic.id = t.category_id
    JOIN staff s           ON s.id = t.received_by`;

// QT-A2: số thứ tự lấy từ SEQUENCE của CSDL → không trùng khi tạo đồng thời (NFR2)
async function nextSequenceNumber(db = pool) {
  const { rows } = await db.query("SELECT nextval('ticket_code_seq') AS n");
  return Number(rows[0].n);
}

async function insert(t, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO ticket (ticket_code, customer_id, device_id, category_id, received_by, center_code,
                         issue_desc, priority, status, warranty_result, received_at, due_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id`,
    [t.ticketCode, t.customerId, t.deviceId, t.categoryId, t.receivedBy, t.centerCode,
      t.issueDesc, t.priority, t.status, t.warrantyResult, t.receivedAt, t.dueAt],
  );
  return rows[0].id;
}

async function findByCode(code, db = pool) {
  const { rows } = await db.query(`${SELECT_VIEW} WHERE t.ticket_code = $1`, [code]);
  return rows[0] || null;
}

// Khoá dòng phiếu trong giao dịch xét duyệt để hai quản lý không ghi đè nhau (QT-A3)
async function lockByCode(code, db) {
  const { rows } = await db.query(
    'SELECT id, ticket_code, status, center_code FROM ticket WHERE ticket_code = $1 FOR UPDATE',
    [code],
  );
  return rows[0] || null;
}

async function updateReview(id, { status, warrantyResult }, db) {
  await db.query('UPDATE ticket SET status = $2, warranty_result = $3 WHERE id = $1', [id, status, warrantyResult]);
}

// Danh sách theo trung tâm + bộ lọc; dùng index (center_code, received_at) – NFR3
async function search(f, db = pool) {
  const where = ['t.center_code = $1'];
  const params = [f.centerCode];
  const add = (sql, value) => { params.push(value); where.push(sql.replace('?', `$${params.length}`)); };
  if (f.from) add("t.received_at >= (?::date)::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh'", f.from);
  if (f.to) add("t.received_at < ((?::date) + 1)::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh'", f.to);
  if (f.status) add('t.status = ?', f.status);
  if (f.priority) add('t.priority = ?', f.priority);
  if (f.q) {
    params.push(f.q);
    const i = params.length;
    where.push(`(t.ticket_code = $${i} OR c.phone = $${i})`);
  }
  const whereSql = where.join(' AND ');
  const countRes = await db.query(
    `SELECT count(*)::int AS total FROM ticket t JOIN customer c ON c.id = t.customer_id WHERE ${whereSql}`,
    params,
  );
  params.push(f.limit, f.offset);
  const { rows } = await db.query(
    `${SELECT_VIEW} WHERE ${whereSql} ORDER BY t.received_at DESC, t.id DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return { total: countRes.rows[0].total, rows };
}

module.exports = { nextSequenceNumber, insert, findByCode, lockByCode, updateReview, search };
