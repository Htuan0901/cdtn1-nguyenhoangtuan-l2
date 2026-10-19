// TicketService – nghiệp vụ phiếu bảo hành (FR4–FR8, UC04, UC06–UC08).
// Lớp ③: KHÔNG biết HTTP (không req/res, không mã HTTP trực tiếp), KHÔNG viết SQL.
// Nhận repository qua hàm khởi tạo → test được bằng repository giả, không cần CSDL.
const { badRequest, forbidden, notFound, conflict } = require('../errors');
const { checkWarranty } = require('../policies/warrantyPolicy');

const PAGE_SIZE = 20; // NFR3

const formatTicketCode = (n, receivedAt) =>
  `BH-${String(n).padStart(6, '0')}/${new Date(receivedAt.getTime() + 7 * 3600e3).getUTCFullYear()}`; // QT-A2

function createTicketService({ ticketRepo, statusLogRepo, customerRepo, deviceRepo, categoryRepo,
  withTransaction, sla, now = () => new Date() }) {
  // UC04 – Tạo phiếu bảo hành (bước 8–10)
  async function createTicket(ctx, input) {
    const receivedAt = now();
    const customer = await customerRepo.findById(input.customerId);
    if (!customer) throw notFound('CUSTOMER_NOT_FOUND', 'Không tìm thấy khách hàng');
    const device = await deviceRepo.findById(input.deviceId);
    if (!device) throw notFound('DEVICE_NOT_FOUND', 'Không tìm thấy thiết bị');
    if (device.customer_id !== customer.id) {
      throw conflict('DEVICE_OWNER_MISMATCH', 'Thiết bị không thuộc khách hàng đã chọn');
    }
    const category = await categoryRepo.findByCode(input.categoryCode);
    if (!category) throw notFound('CATEGORY_NOT_FOUND', 'Không tìm thấy nhóm sự cố');
    if (!category.is_active) {
      throw badRequest('CATEGORY_INACTIVE', 'Nhóm sự cố đã ngừng sử dụng – chọn nhóm khác', ['categoryCode']); // 6a
    }

    const priority = input.priority || category.default_priority;                       // QT-A1
    const warrantyResult = checkWarranty(
      { purchaseDate: device.purchase_date, warrantyMonths: device.warranty_months }, receivedAt); // QT-05
    const status = warrantyResult === 'CHUA_XAC_MINH' ? 'CHO_XAC_MINH' : 'MOI';             // UC04 – 8a
    const dueAt = sla.dueAt(receivedAt, priority);                                           // QT-04

    const ticketCode = await withTransaction(async (tx) => {                                 // NFR5
      const code = formatTicketCode(await ticketRepo.nextSequenceNumber(tx), receivedAt);
      const ticketId = await ticketRepo.insert({
        ticketCode: code, customerId: customer.id, deviceId: device.id, categoryId: category.id,
        receivedBy: ctx.staffId, centerCode: ctx.centerCode, issueDesc: input.issueDesc.trim(),
        priority, status, warrantyResult, receivedAt, dueAt,
      }, tx);
      await statusLogRepo.insert({                                                           // QT-06
        ticketId, fromStatus: null, toStatus: status, changedBy: ctx.staffId,
        note: status === 'CHO_XAC_MINH' ? 'Tạo phiếu – thiếu ngày mua' : 'Tạo phiếu',
      }, tx);
      return code;
    });
    return ticketRepo.findByCode(ticketCode);
  }

  // UC06 – Danh sách phiếu bảo hành, chỉ trung tâm của người dùng (QT-14)
  async function listTickets(ctx, filters) {
    const page = Math.max(1, Number(filters.page) || 1);
    const { total, rows } = await ticketRepo.search({
      ...filters, centerCode: ctx.centerCode, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE,
    });
    return { page, pageSize: PAGE_SIZE, total, items: rows };
  }

  // UC08 – Chi tiết phiếu kèm lịch sử trạng thái
  async function getTicket(ctx, code) {
    const ticket = await ticketRepo.findByCode(code);
    if (!ticket) throw notFound('TICKET_NOT_FOUND', 'Không tìm thấy phiếu bảo hành');
    if (ticket.center_code !== ctx.centerCode) throw forbidden('Phiếu thuộc trung tâm khác');
    const history = await statusLogRepo.findByTicketId(ticket.id);
    return { ticket, history };
  }

  // UC07 – Xét duyệt phiếu chờ xác minh bảo hành
  async function reviewTicket(ctx, code, { decision, note }) {
    if (ctx.role !== 'QL_TRUNG_TAM') throw forbidden('Chỉ Quản lý trung tâm bảo hành được xét duyệt'); // 6b
    if (!note || !note.trim()) throw badRequest('NOTE_REQUIRED', 'Ghi chú là bắt buộc', ['note']);       // 5a
    const warrantyResult = { CHAP_NHAN: 'CON_BAO_HANH', KHONG_CHAP_NHAN: 'HET_BAO_HANH' }[decision];
    if (!warrantyResult) {
      throw badRequest('VALIDATION_ERROR', 'decision phải là CHAP_NHAN hoặc KHONG_CHAP_NHAN', ['decision']);
    }
    await withTransaction(async (tx) => {
      const t = await ticketRepo.lockByCode(code, tx);   // khoá dòng: hai quản lý không ghi đè nhau (QT-A3)
      if (!t) throw notFound('TICKET_NOT_FOUND', 'Không tìm thấy phiếu bảo hành');
      if (t.center_code !== ctx.centerCode) throw forbidden('Phiếu thuộc trung tâm khác');                 // 6b
      if (t.status !== 'CHO_XAC_MINH') throw conflict('ALREADY_REVIEWED', 'Phiếu đã được xét duyệt – không ghi đè'); // 6a
      await ticketRepo.updateReview(t.id, { status: 'MOI', warrantyResult }, tx);
      await statusLogRepo.insert({
        ticketId: t.id, fromStatus: t.status, toStatus: 'MOI', changedBy: ctx.staffId, note: note.trim(),
      }, tx);
    });
    return getTicket(ctx, code);
  }

  return { createTicket, listTickets, getTicket, reviewTicket };
}

module.exports = { createTicketService, formatTicketCode, PAGE_SIZE };
