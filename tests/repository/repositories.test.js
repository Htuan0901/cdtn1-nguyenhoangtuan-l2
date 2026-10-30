// Buổi 10 – 5 TEST REPOSITORY: chạy trên PostgreSQL THẬT (khác unit test dùng repository giả).
// Kiểm SQL của lớp ④ đúng với DDL: ràng buộc UNIQUE, định dạng ngày, phân trang theo trung tâm, giao dịch.
// Mỗi test chạy trong BEGIN … ROLLBACK nên KHÔNG để lại dữ liệu (riêng TR-05 dùng withTransaction thật).
// Cần: CSDL đã migrate (npm run migrate). Chạy: npm run test:repo
const test = require('node:test');
const assert = require('node:assert/strict');
const { pool, withTransaction } = require('../../src/backend/src/data-access/db');
const customerRepo = require('../../src/backend/src/data-access/repositories/customerRepository');
const deviceRepo = require('../../src/backend/src/data-access/repositories/deviceRepository');
const ticketRepo = require('../../src/backend/src/data-access/repositories/ticketRepository');
const statusLogRepo = require('../../src/backend/src/data-access/repositories/statusLogRepository');
const { translate } = require('../../src/backend/src/data-access/errors');

// Chạy work(tx) trong giao dịch rồi LUÔN rollback. tx dịch lỗi pg giống withTransaction thật (TD-17)
async function inRollback(work) {
  const client = await pool.connect();
  const tx = { query: (...args) => client.query(...args).catch((err) => { throw translate(err); }) };
  try {
    await client.query('BEGIN');
    return await work(tx);
  } finally {
    await client.query('ROLLBACK');
    client.release();
  }
}

// Dựng 1 khách + 1 thiết bị + mã nhân viên/nhóm sự cố có sẵn để tạo phiếu thử
async function fixture(db, suffix) {
  const c = await customerRepo.insert({ fullName: 'Khách Test Repo', phone: `0999${suffix.padStart(6, '0')}` }, db);
  const d = await deviceRepo.insert({ customerId: c.id, serialImei: `TEST-REPO-${suffix}`, modelName: 'Mekong Test',
    purchaseDate: null, warrantyMonths: 12 }, db);
  const staffId = (await db.query("SELECT id FROM staff WHERE username = 'nv01'")).rows[0].id;
  const categoryId = (await db.query("SELECT id FROM issue_category WHERE code = 'PIN'")).rows[0].id;
  return { c, d, staffId, categoryId };
}
const ticketRow = (f, code, center, at) => ({
  ticketCode: code, customerId: f.c.id, deviceId: f.d.id, categoryId: f.categoryId, receivedBy: f.staffId,
  centerCode: center, issueDesc: 'Test repository', priority: 'TRUNG_BINH', status: 'MOI',
  warrantyResult: 'CON_BAO_HANH', receivedAt: at, dueAt: new Date(at.getTime() + 72 * 3600e3),
});

test.after(() => pool.end());

test('TR-01 customerRepository: insert rồi findByPhone trả đúng dòng; SĐT trùng bị UNIQUE chặn (QT-01)', () =>
  inRollback(async (db) => {
    const c = await customerRepo.insert({ fullName: 'Khách Test', phone: '0999000001' }, db);
    const found = await customerRepo.findByPhone('0999000001', db);
    assert.deepEqual(found, { id: c.id, full_name: 'Khách Test', phone: '0999000001' });
    await db.query('SAVEPOINT sp');
    await assert.rejects(customerRepo.insert({ fullName: 'Trùng', phone: '0999000001' }, db), (e) => e.code === 'DUPLICATE_KEY');
    await db.query('ROLLBACK TO SAVEPOINT sp');
  }));

test('TR-02 deviceRepository: ngày mua trả dạng YYYY-MM-DD, NULL giữ nguyên NULL; findByCustomer đủ thiết bị', () =>
  inRollback(async (db) => {
    const c = await customerRepo.insert({ fullName: 'Khách Test', phone: '0999000002' }, db);
    await deviceRepo.insert({ customerId: c.id, serialImei: 'TEST-REPO-A', modelName: 'A', purchaseDate: '2026-02-28', warrantyMonths: 12 }, db);
    await deviceRepo.insert({ customerId: c.id, serialImei: 'TEST-REPO-B', modelName: 'B', purchaseDate: null, warrantyMonths: 6 }, db);
    const a = await deviceRepo.findBySerial('TEST-REPO-A', db);
    assert.equal(a.purchase_date, '2026-02-28');               // không bị lệch ngày do múi giờ
    const list = await deviceRepo.findByCustomer(c.id, db);
    assert.deepEqual(list.map((d) => [d.serial_imei, d.purchase_date, d.warranty_months]),
      [['TEST-REPO-A', '2026-02-28', 12], ['TEST-REPO-B', null, 6]]);
  }));

test('TR-03 ticketRepository.nextSequenceNumber: hai lần gọi liên tiếp cho hai số tăng dần, không trùng (QT-A2)', () =>
  inRollback(async (db) => {
    const n1 = await ticketRepo.nextSequenceNumber(db);
    const n2 = await ticketRepo.nextSequenceNumber(db);
    assert.ok(Number.isInteger(n1) && n1 > 0);
    assert.equal(n2, n1 + 1);
  }));

test('TR-04 ticketRepository.search: chỉ trả phiếu của trung tâm được hỏi, tối đa 20 dòng/trang, mới nhất trước (QT-14, NFR3)', () =>
  inRollback(async (db) => {
    const f = await fixture(db, '4');
    const t0 = new Date('2030-01-01T08:00:00+07:00');
    for (let i = 0; i < 21; i += 1) {
      await ticketRepo.insert(ticketRow(f, `TEST-A-${i}`, 'TT-TEST1', new Date(t0.getTime() + i * 60e3)), db);
    }
    await ticketRepo.insert(ticketRow(f, 'TEST-B-0', 'TT-TEST2', t0), db);
    const p1 = await ticketRepo.search({ centerCode: 'TT-TEST1', limit: 20, offset: 0 }, db);
    assert.equal(p1.total, 21);
    assert.equal(p1.rows.length, 20);
    assert.equal(p1.rows[0].ticket_code, 'TEST-A-20');          // received_at giảm dần
    assert.ok(p1.rows.every((r) => r.center_code === 'TT-TEST1'));
    const p2 = await ticketRepo.search({ centerCode: 'TT-TEST1', limit: 20, offset: 20 }, db);
    assert.deepEqual(p2.rows.map((r) => r.ticket_code), ['TEST-A-0']);
  }));

test('TR-05 withTransaction: lỗi sau khi đã INSERT phiếu → ROLLBACK, CSDL không còn phiếu lẫn lịch sử (NFR5)', async () => {
  const code = `TEST-TX-${Date.now() % 1e9}`;   // ticket_code tối đa 20 ký tự
  let ticketId = null;
  await assert.rejects(withTransaction(async (tx) => {
    const f = await fixture(tx, String(Date.now() % 1e6));
    ticketId = await ticketRepo.insert(ticketRow(f, code, 'TT-TEST1', new Date()), tx);
    await statusLogRepo.insert({ ticketId, fromStatus: null, toStatus: 'MOI', changedBy: f.staffId, note: 'test' }, tx);
    throw new Error('mất kết nối giữa chừng');
  }), /mất kết nối/);
  assert.equal(await ticketRepo.findByCode(code), null);
  const logs = await pool.query('SELECT count(*)::int AS n FROM ticket_status_log WHERE ticket_id = $1', [ticketId]);
  assert.equal(logs.rows[0].n, 0);
});

/* ---------- Buổi 12: SQL của CRUD khách hàng, thiết bị ---------- */
test('TR-06 customerRepository.update: chỉ đổi trường được gửi; search tìm theo SĐT chính xác hoặc họ tên không phân biệt hoa thường', () =>
  inRollback(async (db) => {
    const c = await customerRepo.insert({ fullName: 'Khách Tìm Kiếm', phone: '0999000006' }, db);
    const u = await customerRepo.update(c.id, { fullName: 'Khách Đã Đổi Tên' }, db);
    assert.deepEqual(u, { id: c.id, full_name: 'Khách Đã Đổi Tên', phone: '0999000006' });
    const byPhone = await customerRepo.search({ phone: '0999000006', limit: 20, offset: 0 }, db);
    assert.deepEqual(byPhone.rows.map((r) => r.id), [c.id]);
    const byName = await customerRepo.search({ name: 'đã đổi', limit: 20, offset: 0 }, db);
    assert.ok(byName.rows.some((r) => r.id === c.id && r.device_count === 0 && r.ticket_count === 0));
  }));

test('TR-07 deviceRepository.update: purchaseDate undefined giữ nguyên, null xoá ngày mua; model và số tháng đổi đúng', () =>
  inRollback(async (db) => {
    const c = await customerRepo.insert({ fullName: 'Khách Thiết Bị', phone: '0999000007' }, db);
    const d = await deviceRepo.insert({ customerId: c.id, serialImei: 'TEST-REPO-U', modelName: 'A', purchaseDate: '2026-01-15', warrantyMonths: 12 }, db);
    const a = await deviceRepo.update(d.id, { modelName: 'B', warrantyMonths: 24 }, db);
    assert.deepEqual([a.model_name, a.purchase_date, a.warranty_months], ['B', '2026-01-15', 24]);
    const b = await deviceRepo.update(d.id, { purchaseDate: null }, db);
    assert.equal(b.purchase_date, null);
  }));

test('TR-08 xoá: thiết bị đã có phiếu bị CSDL chặn (khoá ngoại → IN_USE); thiết bị chưa có phiếu xoá được', () =>
  inRollback(async (db) => {
    const f = await fixture(db, '8');
    await ticketRepo.insert(ticketRow(f, 'TEST-FK-8', 'TT-TEST1', new Date()), db);
    assert.equal(await deviceRepo.countTickets(f.d.id, db), 1);
    await db.query('SAVEPOINT sp');
    await assert.rejects(deviceRepo.remove(f.d.id, db), (e) => e.code === 'IN_USE');
    await db.query('ROLLBACK TO SAVEPOINT sp');
    const d2 = await deviceRepo.insert({ customerId: f.c.id, serialImei: 'TEST-REPO-DEL', modelName: 'X', purchaseDate: null, warrantyMonths: 12 }, db);
    assert.equal(await deviceRepo.remove(d2.id, db), 1);
    assert.equal(await deviceRepo.findById(d2.id, db), null);
  }));
