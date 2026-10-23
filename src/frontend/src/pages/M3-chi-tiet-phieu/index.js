// M3 – Chi tiết phiếu bảo hành + Xét duyệt (UC08 · UC07 · FR7, FR8 · US6, US7).
import { getTicket, reviewTicket } from '../../api/tickets.api.js';
import { session } from '../../auth/session.js';
import { el, clear, errorLine } from '../../components/dom.js';
import { loadInto } from '../../components/DataState.js';
import { STATUS, PRIORITY, WARRANTY, dateTime, date } from '../../components/labels.js';

const row = (k, v) => el('div', { class: 'kv' }, el('span', { class: 'k' }, `${k}: `), el('span', {}, v ?? '—'));

export function renderTicketDetail(view, { navigate, code }) {
  const body = el('div', { id: 'ticket-detail' });
  const reload = () => loadInto(body, { load: () => getTicket(code), render });

  function reviewPanel(t) {
    const note = el('textarea', { id: 'review-note', rows: 3, maxlength: 500 });
    const msg = el('div');
    const btn = el('button', { class: 'btn btn-primary', type: 'submit', id: 'btn-review' }, 'Lưu quyết định');
    const radio = (value, text) => el('label', { class: 'radio' },
      el('input', { type: 'radio', name: 'decision', value, checked: value === 'CHAP_NHAN' }), text);
    return el('form', {
      class: 'card review',
      onSubmit: async (e) => {
        e.preventDefault(); clear(msg);
        const decision = e.target.querySelector('input[name=decision]:checked').value;
        btn.disabled = true;
        try {
          await reviewTicket(t.ticketCode, decision, note.value);
          navigate(`#/phieu/${encodeURIComponent(t.ticketCode)}`, { type: 'success', text: 'Đã lưu quyết định xét duyệt' });
        } catch (err) {
          const hint = { NOTE_REQUIRED: ' (UC07 – 5a)', ALREADY_REVIEWED: ' (6a)', FORBIDDEN: ' – 403 (6b)' }[err.code] || '';
          msg.append(errorLine(err.message + hint));
        } finally { btn.disabled = false; }
      },
    },
    el('h2', {}, 'Xét duyệt bảo hành'), el('p', { class: 'muted' }, '(chỉ Quản lý trung tâm bảo hành)'),
    radio('CHAP_NHAN', 'Chấp nhận bảo hành'), radio('KHONG_CHAP_NHAN', 'Không chấp nhận bảo hành'),
    el('label', {}, 'Ghi chú *', note), msg, btn);
  }

  function render(t) {
    const canReview = session.staff()?.role === 'QL_TRUNG_TAM' && t.status === 'CHO_XAC_MINH';
    return el('div', {},
      el('h1', {}, `M3 · Chi tiết phiếu bảo hành  ${t.ticketCode}`),
      el('div', { class: 'summary' },
        `Trạng thái: ${STATUS[t.status]}  |  Mức ưu tiên: ${PRIORITY[t.priority]}  |  `
        + `Thời điểm tiếp nhận: ${dateTime(t.receivedAt)}  |  Hạn cam kết: ${dateTime(t.dueAt)}`),
      el('div', { class: canReview ? 'two-col' : '' },
        el('div', { class: 'card' }, el('h2', {}, 'Thông tin phiếu bảo hành'),
          row('Khách hàng', t.customerName), row('Số điện thoại', t.phone),
          row('Serial/IMEI', t.device.serialImei), row('Tên model', t.device.modelName),
          row('Ngày mua', t.device.purchaseDate ? date(t.device.purchaseDate) : '— (không có)'),
          row('Số tháng bảo hành', t.device.warrantyMonths), row('Nhóm sự cố', t.categoryName),
          row('Mô tả lỗi', t.issueDesc), row('Kết quả kiểm tra bảo hành', WARRANTY[t.warrantyResult]),
          row('Trung tâm', t.centerCode), row('Nhân viên tiếp nhận', t.receivedBy)),
        canReview ? reviewPanel(t) : null),
      el('h2', {}, 'Lịch sử trạng thái phiếu'),
      el('table', { class: 'grid', id: 'history' },
        el('thead', {}, el('tr', {}, ['Thời điểm', 'Từ trạng thái', 'Sang trạng thái', 'Người thực hiện', 'Ghi chú'].map((h) => el('th', {}, h)))),
        el('tbody', {}, t.history.map((h) => el('tr', {},
          el('td', {}, dateTime(h.changedAt)), el('td', {}, h.fromStatus ? STATUS[h.fromStatus] : '—'),
          el('td', {}, STATUS[h.toStatus]), el('td', {}, h.changedBy), el('td', {}, h.note || ''))))));
  }

  view.append(body, el('button', { class: 'btn', type: 'button', onClick: () => navigate('#/phieu') }, '← Quay lại danh sách (M1)'));
  reload();
}
