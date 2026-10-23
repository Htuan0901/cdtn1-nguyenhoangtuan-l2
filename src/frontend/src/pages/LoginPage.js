// Đăng nhập nhân viên → lưu JWT → mở M1. Không gọi fetch trực tiếp (dùng auth.api.js).
import { login } from '../api/auth.api.js';
import { session } from '../auth/session.js';
import { el, errorLine } from '../components/dom.js';

export function renderLogin(view, { navigate }) {
  if (session.token()) return navigate('#/phieu');
  const username = el('input', { id: 'username', name: 'username', autocomplete: 'username', required: true });
  const password = el('input', { id: 'password', name: 'password', type: 'password', autocomplete: 'current-password', required: true });
  const msg = el('div');
  const submit = el('button', { class: 'btn btn-primary', type: 'submit' }, 'Đăng nhập');

  const form = el('form', {
    class: 'card login',
    onSubmit: async (e) => {
      e.preventDefault();
      msg.replaceChildren();
      submit.disabled = true; submit.textContent = 'Đang đăng nhập…';
      try {
        const r = await login(username.value, password.value);
        session.save(r.token, r.staff);
        navigate('#/phieu');
      } catch (err) {
        msg.append(errorLine(err.message));
      } finally {
        submit.disabled = false; submit.textContent = 'Đăng nhập';
      }
    },
  },
  el('h1', {}, 'Đăng nhập'),
  el('label', { for: 'username' }, 'Tên đăng nhập'), username,
  el('label', { for: 'password' }, 'Mật khẩu'), password,
  msg, submit,
  el('p', { class: 'muted small' }, 'Tài khoản mẫu: nv01, ql01 (TT-CT01) · nv02 (TT-CT02) – mật khẩu xem README mục 3.'));
  view.append(form);
  username.focus();
}
