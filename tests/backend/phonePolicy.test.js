// Unit test chuẩn hoá và che số điện thoại (QT-02, QT-15) – AC1.1, AC1.3.
const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizePhone, maskPhone } = require('../../src/backend/src/business/policies/phonePolicy');

test('AC1.1 – "+84 901 234 567" → 0901234567', () => {
  assert.equal(normalizePhone('+84 901 234 567'), '0901234567');
});

test('Dạng 84…, dấu chấm, gạch nối đều chuẩn hoá được', () => {
  assert.equal(normalizePhone('84901234567'), '0901234567');
  assert.equal(normalizePhone('0901.234.567'), '0901234567');
  assert.equal(normalizePhone('0901-234-567'), '0901234567');
});

test('AC1.3 – "09012" không hợp lệ', () => {
  assert.equal(normalizePhone('09012'), null);
});

test('QT-15 – che 4 chữ số giữa', () => {
  assert.equal(maskPhone('0901234567'), '090****567');
});
