// Định dạng dữ liệu trả về: tên trường camelCase theo api-contract, che SĐT theo vai trò (QT-15).
const { maskPhone } = require('../../business/policies/phonePolicy');

// Thời gian trả về theo ISO 8601 múi giờ +07:00 (docs/api-contract.md mục 1)
const toVnIso = (d) => (d ? new Date(new Date(d).getTime() + 7 * 3600e3).toISOString().replace('Z', '+07:00') : d);

const phoneFor = (phone, role) => (role === 'QL_TRUNG_TAM' ? phone : maskPhone(phone));

const ticketSummary = (t, role) => ({
  ticketCode: t.ticket_code,
  customerName: t.customer_name,
  phone: phoneFor(t.phone, role),
  categoryName: t.category_name,
  priority: t.priority,
  status: t.status,
  receivedAt: toVnIso(t.received_at),
  dueAt: toVnIso(t.due_at),
});

const ticketDetail = (t, role) => ({
  ...ticketSummary(t, role),
  categoryCode: t.category_code,
  warrantyResult: t.warranty_result,
  issueDesc: t.issue_desc,
  centerCode: t.center_code,
  receivedBy: t.received_by_name,
  device: {
    deviceId: t.device_id, serialImei: t.serial_imei, modelName: t.model_name,
    purchaseDate: t.purchase_date, warrantyMonths: t.warranty_months,
  },
});

const deviceItem = (d) => ({
  deviceId: d.id, serialImei: d.serial_imei, modelName: d.model_name,
  purchaseDate: d.purchase_date, warrantyMonths: d.warranty_months,
});

const historyItem = (h) => ({
  changedAt: toVnIso(h.changed_at), fromStatus: h.from_status, toStatus: h.to_status,
  changedBy: h.changed_by_name, note: h.note,
});

module.exports = { toVnIso, phoneFor, ticketSummary, ticketDetail, historyItem, deviceItem };
