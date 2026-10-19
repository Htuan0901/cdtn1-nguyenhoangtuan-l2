# Frontend – Lớp ① Trình bày (React SPA)

Khung thư mục theo sơ đồ kiến trúc; mã React bắt đầu từ buổi 9 (frontend gọi API).

| Thư mục | Màn hình (wireframe BT1) | Use case | API gọi tới |
|---|---|---|---|
| `src/pages/M1-danh-sach-phieu/` | M1 – Danh sách phiếu bảo hành | UC06 → UC08 | `GET /api/tickets` |
| `src/pages/M2-tao-phieu/` | M2 – Tạo phiếu bảo hành | UC04 (UC01, UC02, UC03, UC05) | `POST /api/customers/lookup`, `GET /api/issue-categories`, `POST /api/tickets` |
| `src/pages/M3-chi-tiet-phieu/` | M3 – Chi tiết phiếu + Xét duyệt | UC08, UC07 | `GET /api/tickets/{code}`, `POST /api/tickets/{code}/review` |
| `src/api/` | Hàm gọi REST API (gửi JWT) | — | — |

Quy tắc: không đặt quy tắc nghiệp vụ ở frontend (hạn cam kết, kiểm tra bảo hành đều do backend tính).
