// Unit test cho WarrantyPolicy (QT-05) – AC4.1, AC4.2.
const test = require('node:test');
const assert = require('node:assert/strict');
const { checkWarranty, addMonths } = require('../../src/backend/src/business/policies/warrantyPolicy');

const recv = new Date('2026-10-02T10:00:00+07:00');

test('AC4.1 – mua 15/03/2026, 12 tháng → Còn bảo hành', () => {
  assert.equal(checkWarranty({ purchaseDate: '2026-03-15', warrantyMonths: 12 }, recv), 'CON_BAO_HANH');
});

test('AC4.2 – không có ngày mua → Chưa xác minh', () => {
  assert.equal(checkWarranty({ purchaseDate: null, warrantyMonths: 12 }, recv), 'CHUA_XAC_MINH');
});

test('Mua 10/01/2024, 12 tháng → Hết bảo hành', () => {
  assert.equal(checkWarranty({ purchaseDate: '2024-01-10', warrantyMonths: 12 }, recv), 'HET_BAO_HANH');
});

test('Ngày cuối cùng còn bảo hành vẫn tính là còn (≤)', () => {
  assert.equal(checkWarranty({ purchaseDate: '2025-10-02', warrantyMonths: 12 }, recv), 'CON_BAO_HANH');
});

test('Cộng tháng giữ ngày cuối tháng hợp lệ (31/01 + 1 tháng → 28/02)', () => {
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28');
});
