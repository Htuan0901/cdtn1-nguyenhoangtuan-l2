// QT-02: chuẩn hoá số điện thoại về 10 chữ số bắt đầu bằng 0.
function normalizePhone(input) {
  if (typeof input !== 'string') return null;
  let s = input.replace(/[\s.\-()]/g, '');
  if (s.startsWith('+84')) s = '0' + s.slice(3);
  else if (s.startsWith('84') && s.length === 11) s = '0' + s.slice(2);
  return /^0\d{9}$/.test(s) ? s : null;
}

// QT-15: che 4 chữ số giữa cho mọi vai trò trừ quản lý (NFR4).
function maskPhone(phone) {
  return phone ? `${phone.slice(0, 3)}****${phone.slice(7)}` : phone;
}

module.exports = { normalizePhone, maskPhone };
