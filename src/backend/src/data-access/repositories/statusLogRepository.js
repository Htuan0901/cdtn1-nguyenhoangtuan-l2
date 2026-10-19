const { pool } = require('../db');

async function insert(log, db = pool) {
  await db.query(
    `INSERT INTO ticket_status_log (ticket_id, from_status, to_status, changed_by, note)
     VALUES ($1, $2, $3, $4, $5)`,
    [log.ticketId, log.fromStatus, log.toStatus, log.changedBy, log.note],
  );
}

async function findByTicketId(ticketId, db = pool) {
  const { rows } = await db.query(
    `SELECT l.changed_at, l.from_status, l.to_status, s.full_name AS changed_by_name, l.note
       FROM ticket_status_log l JOIN staff s ON s.id = l.changed_by
      WHERE l.ticket_id = $1
      ORDER BY l.changed_at, l.id`,
    [ticketId],
  );
  return rows;
}

module.exports = { insert, findByTicketId };
