// M1 – Danh sách phiếu bảo hành (UC06 · FR8 · US7). Bấm một dòng → M3 (UC08).
import { listTickets } from '../../api/tickets.api.js';
import { session } from '../../auth/session.js';
import { el } from '../../components/dom.js';
import { loadInto } from '../../components/DataState.js';
import { STATUS, PRIORITY, dateTime } from '../../components/labels.js';

const option = (value, text, current) => el('option', { value, selected: value === current }, text);

export function renderTicketList(view, { navigate }) {
  const staff = session.staff();
  const f = { from: '', to: '', status: '', priority: '', q: '', page: 1 };

  const from = el('input', { type: 'date', id: 'f-from' });
  const to = el('input', { type: 'date', id: 'f-to' });
  const status = el('select', { id: 'f-status' }, option('', 'Tất cả'), ...Object.entries(STATUS).map(([v, t]) => option(v, t)));
  const priority = el('select', { id: 'f-priority' }, option('', 'Tất cả'), ...Object.entries(PRIORITY).map(([v, t]) => option(v, t)));
  const q = el('input', { id: 'f-q', placeholder: 'BH-… hoặc 09…' });
  const result = el('div', { id: 'ticket-list' });

  const load = () => loadInto(result, {
    load: () => listTickets(f),
    isEmpty: (r) => r.items.length === 0,
    empty: 'Không có phiếu bảo hành phù hợp với bộ lọc. Thử bỏ bớt điều kiện lọc hoặc chọn khoảng ngày khác.', // UC07 – 2a
    render: (r) => table(r),
  });

  const applyFilter = (e) => {
    e.preventDefault();
    Object.assign(f, { from: from.value, to: to.value, status: status.value, priority: priority.value, q: q.value.trim(), page: 1 });
    load();
  };

  function table(r) {
    const first = (r.page - 1) * r.pageSize + 1;
    const last = first + r.items.length - 1;
    const pages = Math.max(1, Math.ceil(r.total / r.pageSize));
    const go = (p) => { f.page = p; load(); };
    return el('div', {},
      el('table', { class: 'grid' },
        el('thead', {}, el('tr', {}, ['Mã phiếu', 'Khách hàng', 'Số điện thoại', 'Nhóm sự cố', 'Mức ưu tiên', 'Trạng thái',
          'Thời điểm tiếp nhận', 'Hạn cam kết'].map((h) => el('th', {}, h)))),
        el('tbody', {}, r.items.map((t) => el('tr', {
          class: 'clickable', tabindex: 0, title: 'Mở chi tiết phiếu',
          onClick: () => navigate(`#/phieu/${encodeURIComponent(t.ticketCode)}`),
          onKeydown: (e) => { if (e.key === 'Enter') navigate(`#/phieu/${encodeURIComponent(t.ticketCode)}`); },
        },
        el('td', {}, t.ticketCode), el('td', {}, t.customerName), el('td', {}, t.phone), el('td', {}, t.categoryName),
        el('td', {}, PRIORITY[t.priority] || t.priority),
        el('td', {}, el('span', { class: `badge badge-${t.status}` }, STATUS[t.status] || t.status)),
        el('td', {}, dateTime(t.receivedAt)), el('td', {}, dateTime(t.dueAt)))))),
      el('div', { class: 'pager' },
        el('span', {}, `Hiển thị ${first}–${last} / ${r.total} phiếu bảo hành`),
        el('span', {},
          el('button', { class: 'btn', type: 'button', disabled: r.page <= 1, onClick: () => go(r.page - 1) }, '« Trước'),
          el('span', { class: 'page-no' }, ` Trang ${r.page}/${pages} `),
          el('button', { class: 'btn', type: 'button', disabled: r.page >= pages, onClick: () => go(r.page + 1) }, 'Sau »'))));
  }

  view.append(
    el('div', { class: 'page-head' },
      el('h1', {}, 'M1 · Danh sách phiếu bảo hành'),
      staff?.role === 'NV_TIEP_NHAN'
        ? el('button', { class: 'btn btn-primary', type: 'button', id: 'btn-new', onClick: () => navigate('#/phieu/moi') }, '+ Tạo phiếu bảo hành')
        : null),
    el('form', { class: 'filters', onSubmit: applyFilter },
      el('label', {}, 'Từ ngày', from), el('label', {}, 'Đến ngày', to),
      el('label', {}, 'Trạng thái', status), el('label', {}, 'Mức ưu tiên', priority),
      el('label', { class: 'wide' }, 'Mã phiếu / SĐT', q),
      el('button', { class: 'btn', type: 'submit', id: 'btn-filter' }, 'Lọc')),
    result,
    el('p', { class: 'muted small' }, 'Bấm vào một dòng để mở M3 – Chi tiết phiếu bảo hành. ',
      'Cột “Số điện thoại” ở dạng che với Nhân viên tiếp nhận; Quản lý trung tâm bảo hành thấy đầy đủ (QT-15).'));
  load();
}
