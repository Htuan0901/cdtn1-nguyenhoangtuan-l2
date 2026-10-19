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
