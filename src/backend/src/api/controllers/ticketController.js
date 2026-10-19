// TicketController – E5..E8 trong docs/api-contract.md. Chỉ nhận/trả dữ liệu, không chứa quy tắc.
const { ticketService } = require('../../container');
const { ticketSummary, ticketDetail, historyItem } = require('../presenters/ticketPresenter');

// E5 – POST /api/tickets
async function create(req, res) {
  const t = await ticketService.createTicket(req.ctx, req.body);
  res.status(201).json(ticketDetail(t, req.ctx.role));
}

// E6 – GET /api/tickets
async function list(req, res) {
  const { from, to, status, priority, q, page } = req.query;
  const r = await ticketService.listTickets(req.ctx, { from, to, status, priority, q, page });
  res.json({ page: r.page, pageSize: r.pageSize, total: r.total, items: r.items.map((t) => ticketSummary(t, req.ctx.role)) });
}

// E7 – GET /api/tickets/:ticketCode   (mã có dấu "/" → client gửi dạng BH-000001%2F2026)
async function detail(req, res) {
  const { ticket, history } = await ticketService.getTicket(req.ctx, req.params.ticketCode);
  res.json({ ...ticketDetail(ticket, req.ctx.role), history: history.map(historyItem) });
}

// E8 – POST /api/tickets/:ticketCode/review
async function review(req, res) {
  const { ticket, history } = await ticketService.reviewTicket(req.ctx, req.params.ticketCode, req.body);
  res.json({ ...ticketDetail(ticket, req.ctx.role), history: history.map(historyItem) });
}

module.exports = { create, list, detail, review };
