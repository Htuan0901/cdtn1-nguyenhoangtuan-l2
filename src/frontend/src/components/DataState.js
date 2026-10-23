// DataState – bọc mọi vùng dữ liệu bằng 3 trạng thái: ĐANG TẢI · RỖNG · LỖI (có nút "Thử lại").
//   loadInto(container, {
//     load:    () => Promise<data>,        // gọi API
//     isEmpty: (data) => boolean,           // dữ liệu rỗng?
//     empty:   'Câu giải thích khi rỗng',
//     render:  (data) => Node,              // vẽ khi có dữ liệu
//   })
import { el, clear } from './dom.js';

export const loadingView = (text = 'Đang tải dữ liệu…') =>
  el('div', { class: 'state state-loading', 'data-state': 'loading', role: 'status' }, el('span', { class: 'spinner' }), text);

export const emptyView = (text) =>
  el('div', { class: 'state state-empty', 'data-state': 'empty' }, text);

export const errorView = (err, onRetry) =>
  el('div', { class: 'state state-error', 'data-state': 'error', role: 'alert' },
    el('strong', {}, 'Không tải được dữ liệu. '),
    el('span', {}, err?.message || 'Lỗi không xác định'),
    err?.code ? el('span', { class: 'muted' }, ` (${err.code})`) : null,
    onRetry ? el('button', { class: 'btn', type: 'button', onClick: onRetry }, 'Thử lại') : null);

export async function loadInto(container, { load, isEmpty = () => false, empty = 'Không có dữ liệu.', render }) {
  const run = async () => {
    clear(container).append(loadingView());
    try {
      const data = await load();
      clear(container).append(isEmpty(data) ? emptyView(empty) : render(data));
    } catch (err) {
      if (err.status === 401) return; // client.js đã chuyển về trang đăng nhập
      clear(container).append(errorView(err, run));
    }
  };
  await run();
}
