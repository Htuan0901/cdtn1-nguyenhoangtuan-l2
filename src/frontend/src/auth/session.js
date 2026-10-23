// Lưu phiên đăng nhập (JWT + thông tin nhân viên) trong localStorage của trình duyệt.
const KEY = 'smartcrm.session';

export const session = {
  get() {
    try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; }
  },
  save(token, staff) { localStorage.setItem(KEY, JSON.stringify({ token, staff })); },
  clear() { localStorage.removeItem(KEY); },
  token() { return this.get()?.token || null; },
  staff() { return this.get()?.staff || null; },
};
