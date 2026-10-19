// Unit test lớp nghiệp vụ TicketService bằng repository GIẢ – không cần CSDL, không cần npm install.
// Ba loại: (1) luồng đúng · (2) giá trị biên · (3) dữ liệu sai. Mã TC dùng trong docs/test-report (BT2).
const test = require('node:test');
const assert = require('node:assert/strict');
const { createTicketService } = require('../../src/backend/src/business/services/ticketService');
const { createSlaPolicy } = require('../../src/backend/src/business/policies/slaPolicy');

const vn = (s) => new Date(`${s}+07:00`);
const NV = { staffId: 1, role: 'NV_TIEP_NHAN', centerCode: 'TT-CT01' };
const QL = { staffId: 2, role: 'QL_TRUNG_TAM', centerCode: 'TT-CT01' };

/* ---------- Dựng service với dữ liệu giả; ghi nhận mọi lệnh ghi đã COMMIT ---------- */
function setup({ now = '2026-10-02T10:00:00', device = {}, category = {}, ticket = null, failLog = false } = {}) {
  const committed = []; let searchArgs = null; let seq = 6;
  const deps = {
    now: () => vn(now),
    sla: createSlaPolicy(),
    withTransaction: async (work) => {           // giả lập giao dịch: chỉ commit khi work không lỗi
      const tx = { writes: [] };
      const result = await work(tx);
      committed.push(...tx.writes);
      return result;
    },
    customerRepo: { findById: async (id) => (id === 1 ? { id: 1, full_name: 'Nguyễn Minh Anh' } : null) },
    deviceRepo: {
      findById: async (id) => (id === 99 ? null : {
        id, customer_id: 1, purchase_date: '2026-03-15', warranty_months: 12, ...device,
      }),
    },
    categoryRepo: {
      findByCode: async (code) => (code === 'KHONG_CO' ? null : {
        id: 2, code, default_priority: 'TRUNG_BINH', is_active: true, ...category,
      }),
    },
    ticketRepo: {
      nextSequenceNumber: async () => { seq += 1; return seq; },
      insert: async (t, tx) => { tx.writes.push({ table: 'ticket', ...t }); return 100; },
      findByCode: async (code) => ticket || { id: 100, ticket_code: code, center_code: 'TT-CT01' },
      lockByCode: async () => ticket,
      updateReview: async (id, v, tx) => { tx.writes.push({ table: 'ticket.update', id, ...v }); },
      search: async (f) => { searchArgs = f; return { total: 0, rows: [] }; },
    },
    statusLogRepo: {
      insert: async (l, tx) => { if (failLog) throw new Error('mất kết nối'); tx.writes.push({ table: 'log', ...l }); },
      findByTicketId: async () => [],
    },
  };
  return { svc: createTicketService(deps), committed, getSearchArgs: () => searchArgs };
}
const input = { customerId: 1, deviceId: 1, issueDesc: '  Màn hình nhấp nháy  ', categoryCode: 'MAN_HINH' };
const rejects = (p, status, code) => assert.rejects(p, (e) => e.status === status && e.code === code);

/* ================= LOẠI 1: LUỒNG ĐÚNG ================= */
test('TC-01 tạo phiếu còn bảo hành: trạng thái Mới, mã BH-000007/2026, 1 dòng lịch sử', async () => {
  const { svc, committed } = setup();
  await svc.createTicket(NV, input);
  const [t, log] = committed;
  assert.equal(t.ticketCode, 'BH-000007/2026');
  assert.equal(t.status, 'MOI');
  assert.equal(t.warrantyResult, 'CON_BAO_HANH');
  assert.equal(t.issueDesc, 'Màn hình nhấp nháy');
  assert.equal(t.centerCode, 'TT-CT01');
  assert.equal(t.dueAt.getTime(), vn('2026-10-06T10:00:00').getTime()); // AC5.1
  assert.deepEqual([log.fromStatus, log.toStatus, log.changedBy], [null, 'MOI', 1]);
});

test('TC-02 bỏ trống mức ưu tiên → lấy mức mặc định của nhóm sự cố (QT-A1)', async () => {
  const { svc, committed } = setup({ category: { default_priority: 'CAO' } });
  await svc.createTicket(NV, input);
  assert.equal(committed[0].priority, 'CAO');
  assert.equal(committed[0].dueAt.getTime(), vn('2026-10-03T10:00:00').getTime()); // AC5.2
});

test('TC-03 quản lý chấp nhận bảo hành → Mới + Còn bảo hành, lịch sử ghi người và ghi chú', async () => {
  const { svc, committed } = setup({ ticket: { id: 5, ticket_code: 'BH-000002/2026', status: 'CHO_XAC_MINH', center_code: 'TT-CT01' } });
  await svc.reviewTicket(QL, 'BH-000002/2026', { decision: 'CHAP_NHAN', note: ' Có tin nhắn xác nhận ' });
  assert.deepEqual(committed[0], { table: 'ticket.update', id: 5, status: 'MOI', warrantyResult: 'CON_BAO_HANH' });
  assert.deepEqual([committed[1].fromStatus, committed[1].toStatus, committed[1].note], ['CHO_XAC_MINH', 'MOI', 'Có tin nhắn xác nhận']);
});

test('TC-04 danh sách luôn lọc theo trung tâm của người dùng, trang 2 bỏ qua 20 dòng', async () => {
  const { svc, getSearchArgs } = setup();
  const r = await svc.listTickets(NV, { page: '2', centerCode: 'TT-CT02' }); // cố tình gửi trung tâm khác
  assert.equal(getSearchArgs().centerCode, 'TT-CT01');
  assert.deepEqual([getSearchArgs().limit, getSearchArgs().offset, r.page], [20, 20, 2]);
});

/* ================= LOẠI 2: GIÁ TRỊ BIÊN ================= */
test('TC-05 tiếp nhận đúng ngày cuối cùng của hạn bảo hành (23:30) → vẫn Còn bảo hành', async () => {
  const { svc, committed } = setup({ now: '2026-10-02T23:30:00', device: { purchase_date: '2025-10-02' } });
  await svc.createTicket(NV, input);
  assert.equal(committed[0].warrantyResult, 'CON_BAO_HANH');
});

test('TC-06 tiếp nhận ngày kế tiếp sau hạn (00:10) → Hết bảo hành, phiếu vẫn ở trạng thái Mới', async () => {
  const { svc, committed } = setup({ now: '2026-10-03T00:10:00', device: { purchase_date: '2025-10-02' } });
  await svc.createTicket(NV, input);
  assert.deepEqual([committed[0].warrantyResult, committed[0].status], ['HET_BAO_HANH', 'MOI']);
});

test('TC-07 thiết bị không có ngày mua → Chờ xác minh bảo hành (UC04 – 8a)', async () => {
  const { svc, committed } = setup({ device: { purchase_date: null } });
  await svc.createTicket(NV, input);
  assert.deepEqual([committed[0].status, committed[0].warrantyResult], ['CHO_XAC_MINH', 'CHUA_XAC_MINH']);
  assert.equal(committed[1].note, 'Tạo phiếu – thiếu ngày mua');
});

test('TC-08 số trang 0 hoặc không phải số → về trang 1', async () => {
  const { svc, getSearchArgs } = setup();
  assert.equal((await svc.listTickets(NV, { page: '0' })).page, 1);
  assert.equal(getSearchArgs().offset, 0);
});

/* ================= LOẠI 3: DỮ LIỆU SAI ================= */
test('TC-09 thiết bị không thuộc khách hàng → 409, không ghi gì vào CSDL', async () => {
  const { svc, committed } = setup({ device: { customer_id: 2 } });
  await rejects(svc.createTicket(NV, input), 409, 'DEVICE_OWNER_MISMATCH');
  assert.equal(committed.length, 0);
});

test('TC-10 nhóm sự cố đã ngừng sử dụng → 400 CATEGORY_INACTIVE (UC04 – 6a)', async () => {
  const { svc } = setup({ category: { is_active: false } });
  await rejects(svc.createTicket(NV, input), 400, 'CATEGORY_INACTIVE');
});

test('TC-11 khách hàng / thiết bị không tồn tại → 404', async () => {
  const { svc } = setup();
  await rejects(svc.createTicket(NV, { ...input, customerId: 7 }), 404, 'CUSTOMER_NOT_FOUND');
  await rejects(svc.createTicket(NV, { ...input, deviceId: 99 }), 404, 'DEVICE_NOT_FOUND');
});

test('TC-12 lỗi khi ghi lịch sử → cả giao dịch hủy, không có phiếu lưu dở (NFR5)', async () => {
  const { svc, committed } = setup({ failLog: true });
  await assert.rejects(svc.createTicket(NV, input));
  assert.equal(committed.length, 0);
});

test('TC-13 xét duyệt với ghi chú chỉ có khoảng trắng → 400 NOTE_REQUIRED (UC07 – 5a)', async () => {
  const { svc } = setup({ ticket: { id: 5, status: 'CHO_XAC_MINH', center_code: 'TT-CT01' } });
  await rejects(svc.reviewTicket(QL, 'X', { decision: 'CHAP_NHAN', note: '   ' }), 400, 'NOTE_REQUIRED');
});

test('TC-14 xét duyệt phiếu đã ở trạng thái Mới → 409 ALREADY_REVIEWED, không ghi đè (UC07 – 6a)', async () => {
  const { svc, committed } = setup({ ticket: { id: 5, status: 'MOI', center_code: 'TT-CT01' } });
  await rejects(svc.reviewTicket(QL, 'X', { decision: 'KHONG_CHAP_NHAN', note: 'ghi đè' }), 409, 'ALREADY_REVIEWED');
  assert.equal(committed.length, 0);
});

test('TC-15 phiếu thuộc trung tâm khác → 403 khi xem và khi xét duyệt (QT-14)', async () => {
  const other = { id: 5, ticket_code: 'X', status: 'CHO_XAC_MINH', center_code: 'TT-CT02' };
  const { svc } = setup({ ticket: other });
  await rejects(svc.getTicket(NV, 'X'), 403, 'FORBIDDEN');
  await rejects(svc.reviewTicket(QL, 'X', { decision: 'CHAP_NHAN', note: 'ok' }), 403, 'FORBIDDEN');
});

test('TC-16 nhân viên tiếp nhận gọi xét duyệt → 403 (UC07 – 6b)', async () => {
  const { svc } = setup({ ticket: { id: 5, status: 'CHO_XAC_MINH', center_code: 'TT-CT01' } });
  await rejects(svc.reviewTicket(NV, 'X', { decision: 'CHAP_NHAN', note: 'ok' }), 403, 'FORBIDDEN');
});
