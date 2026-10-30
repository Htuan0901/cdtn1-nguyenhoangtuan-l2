// Điểm vào giao diện: định tuyến theo hash và thanh tiêu đề (trung tâm, người dùng, đăng xuất).
//   #/dang-nhap · #/phieu (M1) · #/phieu/moi (M2) · #/phieu/<mã phiếu mã hoá> (M3) · #/khach-hang[/<id>] (M4)
import { session } from './auth/session.js';
import { setUnauthorizedHandler } from './api/client.js';
import { el, clear } from './components/dom.js';
import { ROLE } from './components/labels.js';
import { renderLogin } from './pages/LoginPage.js';
import { renderTicketList } from './pages/M1-danh-sach-phieu/index.js';
import { renderCreateTicket } from './pages/M2-tao-phieu/index.js';
import { renderTicketDetail } from './pages/M3-chi-tiet-phieu/index.js';
import { renderCustomerList, renderCustomerDetail } from './pages/M4-khach-hang/index.js';

const app = document.getElementById('app');
const userBox = document.getElementById('user-box');
let flash = null; // thông báo một lần (vd. "Đã tạo phiếu…", "Phiên đăng nhập đã hết hạn")

export function navigate(hash, message) {
  if (message) flash = message;
  if (location.hash === hash) route(); else location.hash = hash;
}

// 401 ở bất kỳ lời gọi API nào → token đã bị xoá → về trang đăng nhập
setUnauthorizedHandler((msg) => navigate('#/dang-nhap', { type: 'error', text: `${msg} – vui lòng đăng nhập lại.` }));

function renderUserBox() {
  const s = session.staff();
  clear(userBox);
  if (!s) return;
  userBox.append(
    el('a', { href: '#/phieu', class: 'nav' }, 'Phiếu bảo hành'),
    el('a', { href: '#/khach-hang', class: 'nav' }, 'Khách hàng'),
    el('span', {}, `Trung tâm: ${s.centerCode}  |  ${s.fullName} (${ROLE[s.role] || s.role})  `),
    el('button', { class: 'link', type: 'button', onClick: () => { session.clear(); navigate('#/dang-nhap'); } }, '[Đăng xuất]'),
  );
}

function route() {
  const hash = location.hash || '#/phieu';
  const msg = flash; flash = null;
  renderUserBox();
  clear(app);
  if (msg) app.append(el('div', { class: `flash flash-${msg.type}`, role: 'status' }, msg.text));
  const view = el('div');
  app.append(view);

  if (!session.token() && hash !== '#/dang-nhap') return navigate('#/dang-nhap');
  if (hash === '#/dang-nhap') return renderLogin(view, { navigate });
  if (hash === '#/phieu') return renderTicketList(view, { navigate });
  if (hash === '#/phieu/moi') return renderCreateTicket(view, { navigate });
  if (hash === '#/khach-hang') return renderCustomerList(view, { navigate });
  if (/^#\/khach-hang\/\d+$/.test(hash)) return renderCustomerDetail(view, { navigate, id: Number(hash.slice(13)) });
  if (hash.startsWith('#/phieu/')) return renderTicketDetail(view, { navigate, code: decodeURIComponent(hash.slice(8)) });
  return navigate('#/phieu');
}

window.addEventListener('hashchange', route);
route();
