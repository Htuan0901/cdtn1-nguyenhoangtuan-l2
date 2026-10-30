// M4 – Quản lý khách hàng và thiết bị (tính năng phụ Buổi 12, TD-20): danh sách · chi tiết · sửa · xoá.
// Mọi quy tắc (SĐT duy nhất, không sửa Serial/IMEI, chỉ xoá khi chưa dùng) do backend kiểm – trang chỉ hiển thị lỗi.
import { listCustomers, getCustomer, updateCustomer, deleteCustomer } from '../../api/customers.api.js';
import { updateDevice, deleteDevice } from '../../api/devices.api.js';
import { session } from '../../auth/session.js';
import { el, clear, errorLine } from '../../components/dom.js';
import { loadInto } from '../../components/DataState.js';
import { date } from '../../components/labels.js';

const isManager = () => session.staff()?.role === 'QL_TRUNG_TAM';

export function renderCustomerList(view, { navigate }) {
  const f = { q: '', page: 1 };
  const q = el('input', { id: 'c-q', placeholder: 'Họ tên hoặc số điện thoại' });
  const result = el('div', { id: 'customer-list' });
  const load = () => loadInto(result, {
    load: () => listCustomers(f.q, f.page),
    isEmpty: (r) => r.items.length === 0,
    empty: 'Không có khách hàng phù hợp. Thử tìm theo số điện thoại đầy đủ hoặc một phần họ tên.',
    render: (r) => {
      const pages = Math.max(1, Math.ceil(r.total / r.pageSize));
      const go = (p) => { f.page = p; load(); };
      return el('div', {},
        el('table', { class: 'grid' },
          el('thead', {}, el('tr', {}, ['Mã KH', 'Họ tên', 'Số điện thoại', 'Số thiết bị', 'Số phiếu'].map((h) => el('th', {}, h)))),
          el('tbody', {}, r.items.map((c) => el('tr', {
            class: 'clickable', tabindex: 0, onClick: () => navigate(`#/khach-hang/${c.customerId}`),
            onKeydown: (e) => { if (e.key === 'Enter') navigate(`#/khach-hang/${c.customerId}`); },
          }, el('td', {}, c.customerId), el('td', {}, c.fullName), el('td', {}, c.phone),
          el('td', {}, c.deviceCount), el('td', {}, c.ticketCount))))),
        el('div', { class: 'pager' },
          el('span', {}, `${r.total} khách hàng`),
          el('span', {},
            el('button', { class: 'btn', type: 'button', disabled: r.page <= 1, onClick: () => go(r.page - 1) }, '« Trước'),
            el('span', { class: 'page-no' }, ` Trang ${r.page}/${pages} `),
            el('button', { class: 'btn', type: 'button', disabled: r.page >= pages, onClick: () => go(r.page + 1) }, 'Sau »'))));
    },
  });
  view.append(
    el('h1', {}, 'M4 · Khách hàng'),
    el('form', { class: 'filters', onSubmit: (e) => { e.preventDefault(); f.q = q.value.trim(); f.page = 1; load(); } },
      el('label', { class: 'wide' }, 'Tìm khách hàng', q), el('button', { class: 'btn', type: 'submit', id: 'btn-c-search' }, 'Tìm')),
    result);
  load();
}

export function renderCustomerDetail(view, { navigate, id }) {
  const body = el('div', { id: 'customer-detail' });
  const reload = () => loadInto(body, { load: () => getCustomer(id), render });

  function customerForm(c) {
    const name = el('input', { id: 'c-name', value: c.fullName, maxlength: 100 });
    const phone = el('input', { id: 'c-phone', placeholder: isManager() ? c.phone : 'Để trống nếu không đổi', inputmode: 'tel' });
    const msg = el('div');
    return el('form', {
      class: 'card',
      onSubmit: async (e) => {
        e.preventDefault(); clear(msg);
        const changes = {};
        if (name.value.trim() !== c.fullName) changes.fullName = name.value;
        if (phone.value.trim()) changes.phone = phone.value;
        if (!Object.keys(changes).length) return msg.append(errorLine('Chưa có thay đổi nào'));
        try {
          await updateCustomer(id, changes);
          navigate(`#/khach-hang/${id}`, { type: 'success', text: 'Đã lưu thông tin khách hàng' });
        } catch (err) { msg.append(errorLine(err.message)); }
      },
    },
    el('h2', {}, 'Thông tin khách hàng'),
    el('div', { class: 'grid2' },
      el('label', {}, 'Họ tên *', name),
      el('label', {}, `Số điện thoại (hiện tại: ${c.phone})`, phone)),
    msg,
    el('div', { class: 'actions' },
      isManager() ? el('button', {
        class: 'btn btn-danger', type: 'button', id: 'btn-c-delete',
        onClick: async () => {
          clear(msg);
          if (!window.confirm(`Xoá khách hàng ${c.fullName}?`)) return;
          try { await deleteCustomer(id); navigate('#/khach-hang', { type: 'success', text: `Đã xoá khách hàng ${c.fullName}` }); } catch (err) { msg.append(errorLine(err.message)); }
        },
      }, 'Xoá khách hàng') : null,
      el('button', { class: 'btn btn-primary', type: 'submit', id: 'btn-c-save' }, 'Lưu')));
  }

  function deviceRow(d) {
    const model = el('input', { value: d.modelName, maxlength: 100 });
    const purchase = el('input', { type: 'date', value: d.purchaseDate || '' });
    const months = el('input', { type: 'number', min: 0, max: 60, value: d.warrantyMonths });
    const msg = el('td', { class: 'msg-cell' });
    const save = async () => {
      clear(msg);
      try {
        await updateDevice(d.deviceId, { modelName: model.value, purchaseDate: purchase.value, warrantyMonths: Number(months.value) });
        navigate(`#/khach-hang/${id}`, { type: 'success', text: `Đã lưu thiết bị ${d.serialImei}` });
      } catch (err) { msg.append(errorLine(err.message)); }
    };
    const remove = async () => {
      clear(msg);
      if (!window.confirm(`Xoá thiết bị ${d.serialImei}?`)) return;
      try { await deleteDevice(d.deviceId); navigate(`#/khach-hang/${id}`, { type: 'success', text: `Đã xoá thiết bị ${d.serialImei}` }); } catch (err) { msg.append(errorLine(err.message)); }
    };
    return el('tr', {},
      el('td', {}, d.serialImei), el('td', {}, model), el('td', {}, purchase, el('div', { class: 'muted small' }, d.purchaseDate ? date(d.purchaseDate) : 'chưa có')),
      el('td', {}, months),
      el('td', {}, el('button', { class: 'btn', type: 'button', onClick: save }, 'Lưu'), ' ',
        isManager() ? el('button', { class: 'btn btn-danger', type: 'button', onClick: remove }, 'Xoá') : null),
      msg);
  }

  function render(c) {
    return el('div', {},
      el('h1', {}, `M4 · Khách hàng #${c.customerId}: ${c.fullName}`),
      customerForm(c),
      el('h2', {}, 'Thiết bị của khách hàng'),
      c.devices.length === 0
        ? el('div', { class: 'state state-empty', 'data-state': 'empty' }, 'Khách hàng chưa có thiết bị nào. Thiết bị được ghi nhận ở M2 khi tạo phiếu.')
        : el('table', { class: 'grid', id: 'device-table' },
          el('thead', {}, el('tr', {}, ['Serial/IMEI (không sửa)', 'Tên model', 'Ngày mua', 'Số tháng BH', 'Thao tác', ''].map((h) => el('th', {}, h)))),
          el('tbody', {}, c.devices.map(deviceRow))),
      el('p', { class: 'muted small' }, 'Sửa ngày mua không đổi kết quả kiểm tra bảo hành của phiếu đã tạo (chốt lúc tiếp nhận – QT-05). ',
        'Chỉ Quản lý trung tâm bảo hành được xoá; khách đã có thiết bị và thiết bị đã có phiếu không xoá được.'));
  }

  view.append(body, el('button', { class: 'btn', type: 'button', onClick: () => navigate('#/khach-hang') }, '← Danh sách khách hàng'));
  reload();
}
