// Unit test cho SlaPolicy (QT-04) theo tiêu chí chấp nhận AC5.1, AC5.2 trong docs/srs.md.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createSlaPolicy } = require('../../src/backend/src/business/policies/slaPolicy');

const sla = createSlaPolicy();
const vn = (s) => new Date(`${s}+07:00`);

test('AC5.1 – Trung bình, tiếp nhận thứ Sáu 02/10/2026 10:00 → hạn 06/10/2026 10:00 (bỏ Chủ nhật)', () => {
  assert.equal(sla.dueAt(vn('2026-10-02T10:00:00'), 'TRUNG_BINH').getTime(), vn('2026-10-06T10:00:00').getTime());
});

test('AC5.2 – đổi sang Cao → hạn 03/10/2026 10:00 (thứ Bảy vẫn là ngày làm việc)', () => {
  assert.equal(sla.dueAt(vn('2026-10-02T10:00:00'), 'CAO').getTime(), vn('2026-10-03T10:00:00').getTime());
});

test('Thấp 120 giờ từ thứ Sáu 13:40 → thứ Năm 08/10/2026 13:40', () => {
  assert.equal(sla.dueAt(vn('2026-10-02T13:40:00'), 'THAP').getTime(), vn('2026-10-08T13:40:00').getTime());
});

test('Tiếp nhận thứ Bảy 20:00, Cao → Chủ nhật không tính → thứ Hai 20:00', () => {
  assert.equal(sla.dueAt(vn('2026-10-03T20:00:00'), 'CAO').getTime(), vn('2026-10-05T20:00:00').getTime());
});

test('NFR6 – đổi ngưỡng bằng cấu hình, không sửa code', () => {
  const custom = createSlaPolicy({ hoursByPriority: { CAO: 4, TRUNG_BINH: 8, THAP: 16 }, workingDays: [1, 2, 3, 4, 5, 6], utcOffsetMinutes: 420 });
  assert.equal(custom.dueAt(vn('2026-10-02T10:00:00'), 'CAO').getTime(), vn('2026-10-02T14:00:00').getTime());
});

test('Mức ưu tiên không hợp lệ → báo lỗi', () => {
  assert.throws(() => sla.dueAt(new Date(), 'KHAN_CAP'));
});
