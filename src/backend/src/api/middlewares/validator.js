// Validator: kiểm tra hình dạng dữ liệu vào (kiểu, độ dài, enum) theo docs/api-contract.md mục 4.
// Lỗi → 400 VALIDATION_ERROR kèm danh sách trường sai. Quy tắc nghiệp vụ nằm ở lớp ③.
const { badRequest } = require('../../business/errors');

const PRIORITIES = ['CAO', 'TRUNG_BINH', 'THAP'];
const CATEGORIES = ['MAN_HINH', 'PIN', 'SAC', 'PHAN_MEM', 'NUOC_VAO', 'KHAC'];
const STATUSES = ['MOI', 'CHO_XAC_MINH'];
const INT4_MAX = 2147483647; // giới hạn kiểu INT của PostgreSQL (khoá customer, device)
const MAX_PAGE = 10000;
const isPosInt = (v) => Number.isInteger(v) && v > 0 && v <= INT4_MAX;
// Ngày có THẬT trên lịch, không chỉ đúng dạng YYYY-MM-DD (2026-02-30 bị từ chối) – BUG-06
const isDate = (v) => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};
const isPage = (v) => /^\d{1,5}$/.test(v) && Number(v) <= MAX_PAGE; // BUG-07

const isText = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const opt = (v, ok) => v === undefined || v === null || v === '' || ok(v);

const isIdParam = (v) => typeof v === 'string' && /^\d{1,10}$/.test(v) && isPosInt(Number(v));
const has = (b, keys) => keys.some((k) => b[k] !== undefined);
const isMonths = (v) => Number.isInteger(v) && v >= 0 && v <= 60;

const schemas = {
  idParam: (p) => ({ id: isIdParam(p.id) }),
  listCustomers: (q) => ({
    q: q.q === undefined || (typeof q.q === 'string' && q.q.length <= 100),
    page: q.page === undefined || isPage(q.page),
  }),
  // PATCH: chỉ gửi trường cần đổi, phải có ít nhất một trường
  updateCustomer: (b) => ({
    body: has(b, ['fullName', 'phone']),
    fullName: b.fullName === undefined || isText(b.fullName, 100),
    phone: b.phone === undefined || (typeof b.phone === 'string' && b.phone.length <= 20),
  }),
  updateDevice: (b) => ({
    body: has(b, ['modelName', 'purchaseDate', 'warrantyMonths']),
    modelName: b.modelName === undefined || isText(b.modelName, 100),
    purchaseDate: b.purchaseDate === undefined || b.purchaseDate === null || b.purchaseDate === '' || isDate(b.purchaseDate),
    warrantyMonths: b.warrantyMonths === undefined || isMonths(b.warrantyMonths),
    serialImei: b.serialImei === undefined,   // Serial/IMEI không được sửa (QT-03) – ghi nhận thiết bị mới nếu nhập sai
    customerId: b.customerId === undefined,   // không chuyển thiết bị sang khách khác
  }),
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
    page: q.page === undefined || isPage(q.page),
  }),
};

const validate = (name, source = 'body') => (req, _res, next) => {
  const result = schemas[name](req[source] || {});
  const fields = Object.keys(result).filter((k) => !result[k]);
  return fields.length ? next(badRequest('VALIDATION_ERROR', 'Dữ liệu không hợp lệ', fields)) : next();
};

module.exports = { validate };
