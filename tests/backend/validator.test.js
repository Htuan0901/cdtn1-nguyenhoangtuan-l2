// Unit test Validator (lớp ② – kiểm tra định dạng dữ liệu vào theo docs/api-contract.md mục 4).
const test = require('node:test');
const assert = require('node:assert/strict');
const { validate } = require('../../src/backend/src/api/middlewares/validator');

const run = (name, data, source = 'body') => {
  let err;
  validate(name, source)({ [source]: data }, {}, (e) => { err = e; });
  return err ? err.fields : [];
};
const ok = { customerId: 1, deviceId: 1, issueDesc: 'Màn hình nhấp nháy', categoryCode: 'MAN_HINH' };

test('TC-17 body tạo phiếu hợp lệ (bỏ trống priority) → không lỗi', () => {
  assert.deepEqual(run('createTicket', ok), []);
});

test('TC-18 sai kiểu và sai enum → liệt kê đúng các trường lỗi', () => {
  assert.deepEqual(run('createTicket', { ...ok, customerId: '1', categoryCode: 'MAN', priority: 'GAP' }),
    ['customerId', 'categoryCode', 'priority']);
});

test('TC-19 biên độ dài mô tả lỗi: 5.000 ký tự đạt, 5.001 ký tự lỗi', () => {
  assert.deepEqual(run('createTicket', { ...ok, issueDesc: 'a'.repeat(5000) }), []);
  assert.deepEqual(run('createTicket', { ...ok, issueDesc: 'a'.repeat(5001) }), ['issueDesc']);
});

test('TC-20 bộ lọc danh sách: ngày sai định dạng và trạng thái lạ bị từ chối', () => {
  assert.deepEqual(run('listTickets', { from: '02/10/2026', status: 'DONG' }, 'query'), ['from', 'status']);
});

/* ---------- Test hồi quy Buổi 11 (docs/bug-log.md) ---------- */
test('TC-26 ngày không có thật (30/02, 31/04) bị từ chối ở bộ lọc và ngày mua – không để CSDL báo lỗi 500 (BUG-06)', () => {
  assert.deepEqual(run('listTickets', { from: '2026-02-30', to: '2026-04-31' }, 'query'), ['from', 'to']);
  assert.deepEqual(run('registerDevice', { customerId: 1, serialImei: 'X', modelName: 'A', purchaseDate: '2026-02-30' }), ['purchaseDate']);
  assert.deepEqual(run('listTickets', { from: '2028-02-29', to: '2026-12-31' }, 'query'), []); // năm nhuận vẫn hợp lệ
});

test('TC-27 số vượt giới hạn: page > 10.000, customerId/deviceId > 2.147.483.647 → 400 thay vì 500 (BUG-07)', () => {
  assert.deepEqual(run('listTickets', { page: '99999999999999999999' }, 'query'), ['page']);
  assert.deepEqual(run('listTickets', { page: '10000' }, 'query'), []);                       // biên trên còn hợp lệ
  assert.deepEqual(run('createTicket', { ...ok, customerId: 3000000000, deviceId: 2147483647 }), ['customerId']);
});
