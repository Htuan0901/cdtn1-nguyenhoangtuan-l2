# Frontend – Lớp ① Trình bày (giao diện web, JavaScript ES modules)

Ba màn hình theo wireframe BT1 + trang đăng nhập, gọi API thật của `src/backend`. Không cần `npm install`,
không bước build (TD-13). Chạy: `npm start` → http://localhost:5173 (backend phải chạy ở cổng 3000).

| Thư mục / tệp | Màn hình (wireframe BT1) | Use case | API gọi tới |
|---|---|---|---|
| `src/pages/LoginPage.js` | Đăng nhập | — | `POST /api/auth/login` |
| `src/pages/M1-danh-sach-phieu/` | M1 – Danh sách phiếu bảo hành | UC06 → UC08 | `GET /api/tickets` |
| `src/pages/M2-tao-phieu/` | M2 – Tạo phiếu bảo hành | UC04 (UC01, UC02, UC03, UC05) | `POST /api/customers/lookup`, `POST /api/customers`, `POST /api/devices`, `GET /api/issue-categories`, `POST /api/tickets` |
| `src/pages/M3-chi-tiet-phieu/` | M3 – Chi tiết phiếu + Xét duyệt | UC08, UC07 | `GET /api/tickets/{code}`, `POST /api/tickets/{code}/review` |
| `src/api/client.js` | — | — | nơi DUY NHẤT gọi `fetch`: gắn JWT, chuẩn hoá lỗi, 401 → xoá token về đăng nhập, quá 10 giây → báo lỗi |
| `src/api/*.api.js` | — | — | `tickets.api.js`, `customers.api.js`, `devices.api.js`, `categories.api.js`, `auth.api.js` |
| `src/components/DataState.js` | — | — | ba trạng thái: đang tải · rỗng (có câu giải thích) · lỗi (có nút Thử lại) |
| `src/config.js` | — | — | `API_BASE_URL` (mặc định `http://localhost:3000/api`) |
| `server.js` | — | — | máy chủ tĩnh cổng 5173 (đổi bằng biến `FRONTEND_PORT`) |

Quy tắc:
- Không đặt quy tắc nghiệp vụ ở giao diện: hạn cam kết, kiểm tra bảo hành, mã phiếu đều do backend tính.
- Trang trong `pages/` không gọi `fetch(` trực tiếp – kiểm: `grep -rn "fetch(" src/pages` phải rỗng.
- Dữ liệu hiển thị bằng `textContent` (hàm `el()` trong `components/dom.js`), không chèn HTML từ dữ liệu → tránh XSS.
