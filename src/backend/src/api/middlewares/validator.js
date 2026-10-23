// Validator: kiểm tra hình dạng dữ liệu vào (kiểu, độ dài, enum) theo docs/api-contract.md mục 4.
// Lỗi → 400 VALIDATION_ERROR kèm danh sách trường sai. Quy tắc nghiệp vụ nằm ở lớp ③.
const { badRequest } = require('../../business/errors');

const PRIORITIES = ['CAO', 'TRUNG_BINH', 'THAP'];
const CATEGORIES = ['MAN_HINH', 'PIN', 'SAC', 'PHAN_MEM', 'NUOC_VAO', 'KHAC'];
const STATUSES = ['MOI', 'CHO_XAC_MINH'];
const isPosInt = (v) => Number.isInteger(v) && v > 0;
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v);

const isText = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const opt = (v, ok) => v === undefined || v === null || v === '' || ok(v);

const schemas = {
  login: (b) => ({ username: isText(b.username, 50), password: isText(b.password, 100) }),
  createCustomer: (b) => ({
    fullName: isText(b.fullName, 100),
    phone: typeof b.phone === 'string' && b.phone.length <= 20,
  }),
  registerDevice: (b) => ({
    customerId: isPosInt(b.customerId),
    serialImei: isText(b.serialImei, 50),
    modelName: opt(b.modelName, (v) => isText(v, 100)),
    purchaseDate: opt(b.purchaseDate, isDate),
    warrantyMonths: b.warrantyMonths === undefined || (Number.isInteger(b.warrantyMonths) && b.warrantyMonths >= 0 && b.warrantyMonths <= 60),
  }),
  lookupCustomer: (b) => ({ phone: typeof b.phone === 'string' && b.phone.length <= 20 }),
  createTicket: (b) => ({
    customerId: isPosInt(b.customerId),
    deviceId: isPosInt(b.deviceId),
    issueDesc: typeof b.issueDesc === 'string' && b.issueDesc.trim().length > 0 && b.issueDesc.length <= 5000,
    categoryCode: CATEGORIES.includes(b.categoryCode),
    priority: b.priority === undefined || PRIORITIES.includes(b.priority),
  }),
  reviewTicket: (b) => ({
    decision: ['CHAP_NHAN', 'KHONG_CHAP_NHAN'].includes(b.decision),
    note: b.note === undefined || (typeof b.note === 'string' && b.note.length <= 500),
  }),
  listTickets: (q) => ({
    from: q.from === undefined || isDate(q.from),
    to: q.to === undefined || isDate(q.to),
    status: q.status === undefined || STATUSES.includes(q.status),
    priority: q.priority === undefined || PRIORITIES.includes(q.priority),
    page: q.page === undefined || /^\d+$/.test(q.page),
  }),
};

const validate = (name, source = 'body') => (req, _res, next) => {
  const result = schemas[name](req[source] || {});
  const fields = Object.keys(result).filter((k) => !result[k]);
  return fields.length ? next(badRequest('VALIDATION_ERROR', 'Dữ liệu không hợp lệ', fields)) : next();
};

module.exports = { validate };
