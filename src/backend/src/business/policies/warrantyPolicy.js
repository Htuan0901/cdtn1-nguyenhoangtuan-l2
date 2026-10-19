// QT-05: còn bảo hành nếu ngày tiếp nhận ≤ ngày mua + số tháng bảo hành;
// thiếu ngày mua → CHUA_XAC_MINH (cần Quản lý trung tâm bảo hành xét duyệt).
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

function toLocalDateString(date) {
  return new Date(new Date(date).getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);
}

function addMonths(isoDate, months) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

function checkWarranty({ purchaseDate, warrantyMonths }, receivedAt) {
  if (!purchaseDate) return 'CHUA_XAC_MINH';
  const end = addMonths(purchaseDate, warrantyMonths);
  return toLocalDateString(receivedAt) <= end ? 'CON_BAO_HANH' : 'HET_BAO_HANH';
}

module.exports = { checkWarranty, addMonths };
