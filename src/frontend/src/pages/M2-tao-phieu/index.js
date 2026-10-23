// M2 – Tạo phiếu bảo hành (UC04 gồm UC01, UC02, UC03, UC05 · FR1–FR6 · US1–US5).
// Kết quả kiểm tra bảo hành, trạng thái, hạn cam kết do BACKEND tính (QT-04, QT-05) – trang này không tự tính.
import { lookupCustomer, createCustomer } from '../../api/customers.api.js';
import { registerOrFindDevice } from '../../api/devices.api.js';
import { listCategories } from '../../api/categories.api.js';
import { createTicket } from '../../api/tickets.api.js';
import { el, clear, errorLine } from '../../components/dom.js';
import { loadInto } from '../../components/DataState.js';
import { PRIORITY, date } from '../../components/labels.js';

export function renderCreateTicket(view, { navigate }) {
  const st = { customer: null, device: null, newDevice: false, categories: [] };

  // ① Khách hàng ---------------------------------------------------------------
  const phone = el('input', { id: 'phone', placeholder: '0901 234 567', inputmode: 'tel' });
  const customerInfo = el('div', { id: 'customer-info' });
  const customerMsg = el('div');
  const newName = el('input', { id: 'new-name', placeholder: 'Họ tên khách hàng' });
  const newCustomerBox = el('div', { class: 'inline hidden', id: 'new-customer' },
    el('label', {}, 'Họ tên *', newName),
    el('button', { class: 'btn', type: 'button', id: 'btn-create-customer', onClick: onCreateCustomer }, 'Tạo khách hàng mới'));

  async function onLookup() {
    clear(customerMsg); clear(customerInfo); newCustomerBox.classList.add('hidden');
    setCustomer(null);
    try {
      setCustomer(await lookupCustomer(phone.value));
    } catch (err) {
      customerMsg.append(errorLine(err.code === 'CUSTOMER_NOT_FOUND' ? `${err.message} (UC04 – 3a)` : err.message));
      if (err.code === 'CUSTOMER_NOT_FOUND') { newCustomerBox.classList.remove('hidden'); newName.focus(); }
    }
  }

  async function onCreateCustomer() {
    clear(customerMsg);
    try {
      setCustomer(await createCustomer(newName.value, phone.value));
      newCustomerBox.classList.add('hidden');
    } catch (err) { customerMsg.append(errorLine(err.message)); }
  }

  function setCustomer(c) {
    st.customer = c; setDevice(null);
    clear(customerInfo);
    deviceSection.classList.toggle('disabled', !c);
    if (!c) return;
    customerInfo.append(el('p', { class: 'ok' }, `✓ ${c.fullName} · ${c.phone}`));
    if (c.devices.length) {
      customerInfo.append(el('div', { class: 'chips' }, el('span', { class: 'muted' }, 'Thiết bị đã có: '),
        c.devices.map((d) => el('button', { class: 'chip', type: 'button', onClick: () => { serial.value = d.serialImei; setDevice(d); } },
          `${d.serialImei} · ${d.modelName}`))));
    }
    serial.focus();
  }

  // ② Thiết bị ------------------------------------------------------------------
  const serial = el('input', { id: 'serial', placeholder: 'MM-IMEI-000123' });
  const deviceMsg = el('div');
  const deviceInfo = el('div', { id: 'device-info' });
  const model = el('input', { id: 'model', placeholder: 'Mekong X5' });
  const purchase = el('input', { id: 'purchase', type: 'date' });
  const months = el('input', { id: 'months', type: 'number', min: 0, max: 60, value: 12 });
  const newDeviceBox = el('div', { class: 'grid2 hidden', id: 'new-device' },
    el('label', {}, 'Tên model *', model),
    el('label', {}, 'Ngày mua', purchase, el('small', { class: 'muted' }, 'để trống nếu khách không có hóa đơn')),
    el('label', {}, 'Số tháng bảo hành *', months));

  async function onFindDevice() {
    clear(deviceMsg); setDevice(null);
    if (!st.customer) return deviceMsg.append(errorLine('Tra cứu khách hàng trước'));
    try {
      const d = await registerOrFindDevice({ customerId: st.customer.customerId, serialImei: serial.value });
      setDevice(d);
    } catch (err) {
      if (err.code === 'DEVICE_NOT_FOUND') {
        st.newDevice = true; newDeviceBox.classList.remove('hidden');
        deviceMsg.append(el('p', { class: 'muted' }, 'Chưa có thiết bị này – nhập thông tin để ghi nhận mới (UC03).'));
        model.focus();
      } else {
        deviceMsg.append(errorLine(err.code === 'DEVICE_OWNED_BY_OTHER' ? `${err.message} (5a)` : err.message));
      }
    }
    updateWarrantyHint();
  }

  function setDevice(d) {
    st.device = d; st.newDevice = false;
    newDeviceBox.classList.add('hidden');
    clear(deviceInfo);
    if (d) {
      deviceInfo.append(el('p', { class: 'ok' }, `✓ ${d.modelName} · Ngày mua: ${d.purchaseDate ? date(d.purchaseDate) : '— (không có)'}`
        + ` · ${d.warrantyMonths} tháng bảo hành`));
    }
    updateWarrantyHint();
  }

  const deviceSection = el('section', { class: 'card step disabled' },
    el('h2', {}, '② Thiết bị'),
    el('div', { class: 'inline' }, el('label', {}, 'Serial/IMEI *', serial),
      el('button', { class: 'btn', type: 'button', id: 'btn-find-device', onClick: onFindDevice }, 'Tra cứu')),
    deviceInfo, deviceMsg, newDeviceBox);

  // ③ Mô tả lỗi và phân loại ---------------------------------------------------
  const desc = el('textarea', { id: 'issue-desc', rows: 3, maxlength: 5000, placeholder: 'Mô tả lỗi khách báo…' });
  const category = el('select', { id: 'category' });
  const priority = el('select', { id: 'priority' }, Object.entries(PRIORITY).map(([v, t]) => el('option', { value: v }, t)));
  const categoryBox = el('div', { id: 'category-box' });
  category.addEventListener('change', () => {
    const c = st.categories.find((x) => x.code === category.value);
    if (c) priority.value = c.defaultPriority; // đề xuất theo nhóm sự cố (QT-A1), người dùng có thể đổi
  });
  loadInto(categoryBox, {
    load: listCategories,
    isEmpty: (r) => r.items.length === 0,
    empty: 'Chưa có nhóm sự cố nào đang hoạt động – liên hệ quản trị.',
    render: (r) => {
      st.categories = r.items;
      clear(category).append(el('option', { value: '' }, '— Chọn nhóm sự cố —'),
        ...r.items.map((c) => el('option', { value: c.code }, c.name)));
      return el('div', { class: 'grid2' },
        el('label', {}, 'Nhóm sự cố *', category),
        el('label', {}, 'Mức ưu tiên *', priority, el('small', { class: 'muted' }, 'đề xuất theo nhóm sự cố (QT-A1), có thể đổi')));
    },
  });

  // ④ Kết quả do hệ thống tính ---------------------------------------------------
  const warrantyHint = el('div', { id: 'warranty-hint' });
  function updateWarrantyHint() {
    clear(warrantyHint);
    const noDate = (st.device && !st.device.purchaseDate) || (st.newDevice && !purchase.value);
    if (noDate) {
      warrantyHint.append(el('div', { class: 'warn-box' }, '⚠ Thiếu ngày mua → Kết quả kiểm tra bảo hành: Chưa xác minh. ',
        'Phiếu sẽ ở trạng thái “Chờ xác minh bảo hành” và cần Quản lý trung tâm bảo hành xét duyệt (8a).'));
    }
  }
  purchase.addEventListener('change', updateWarrantyHint);

  // Lưu ---------------------------------------------------------------------------
  const formMsg = el('div', { id: 'form-msg' });
  const submit = el('button', { class: 'btn btn-primary', type: 'submit', id: 'btn-submit' }, 'Tạo phiếu bảo hành');

  async function onSubmit(e) {
    e.preventDefault();
    clear(formMsg);
    const missing = [];
    if (!st.customer) missing.push('Khách hàng');
    if (!st.device && !(st.newDevice && model.value.trim())) missing.push('Thiết bị');
    if (!desc.value.trim()) missing.push('Mô tả lỗi');
    if (!category.value) missing.push('Nhóm sự cố');
    if (missing.length) {
      return formMsg.append(el('div', { class: 'error-box', role: 'alert' },
        `⚠ Thiếu dữ liệu bắt buộc: ${missing.join(', ')}. Phiếu chưa được tạo (10a).`));
    }
    submit.disabled = true; submit.textContent = 'Đang lưu…'; // chặn bấm hai lần
    try {
      let device = st.device;
      if (!device) {
        device = await registerOrFindDevice({
          customerId: st.customer.customerId, serialImei: serial.value, modelName: model.value,
          purchaseDate: purchase.value || undefined, warrantyMonths: Number(months.value),
        });
        setDevice(device);
      }
      const t = await createTicket({
        customerId: st.customer.customerId, deviceId: device.deviceId,
        issueDesc: desc.value, categoryCode: category.value, priority: priority.value,
      });
      navigate(`#/phieu/${encodeURIComponent(t.ticketCode)}`, { type: 'success', text: `Đã tạo phiếu ${t.ticketCode}` });
    } catch (err) {
      formMsg.append(el('div', { class: 'error-box', role: 'alert' }, `⚠ ${err.message}`,
        err.fields?.length ? ` (trường: ${err.fields.join(', ')})` : ''));
    } finally {
      submit.disabled = false; submit.textContent = 'Tạo phiếu bảo hành';
    }
  }

  view.append(el('form', { class: 'create', onSubmit },
    el('h1', {}, 'M2 · Tạo phiếu bảo hành'),
    el('section', { class: 'card step' },
      el('h2', {}, '① Khách hàng'),
      el('div', { class: 'inline' }, el('label', {}, 'Số điện thoại *', phone),
        el('button', { class: 'btn', type: 'button', id: 'btn-lookup', onClick: onLookup }, 'Tra cứu')),
      customerInfo, customerMsg, newCustomerBox),
    deviceSection,
    el('section', { class: 'card step' },
      el('h2', {}, '③ Mô tả lỗi và phân loại'),
      el('label', {}, 'Mô tả lỗi *', desc), categoryBox),
    el('section', { class: 'card step readonly' },
      el('h2', {}, '④ Kết quả do hệ thống tính'),
      el('p', { class: 'muted' }, 'Kết quả kiểm tra bảo hành, trạng thái khi lưu và hạn cam kết do hệ thống tính khi bấm “Tạo phiếu bảo hành” (QT-04, QT-05) và hiện ở màn hình chi tiết.'),
      warrantyHint),
    formMsg,
    el('div', { class: 'actions' },
      el('button', { class: 'btn', type: 'button', onClick: () => navigate('#/phieu') }, 'Hủy'), submit)));
  phone.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); onLookup(); } });
  serial.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); onFindDevice(); } });
  phone.focus();
}
