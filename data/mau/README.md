# Dữ liệu mẫu thật (bộ dữ liệu của học phần – case study Smart CRM · Mekong Mobile)

Nạp bằng `cd src/backend && npm run seed` (`scripts/seed-mau.js`, TD-16). Dữ liệu đi qua lớp nghiệp vụ
(CustomerService, DeviceService, TicketService) nên áp đúng quy tắc QT-01…QT-06 như khi nhập trên giao diện.

| Tệp | Số dòng | Nguồn | Dùng để |
|---|---|---|---|
| `customers_raw.csv` | 402 | repo mẫu track DA của học phần (`data/mau/`) | khách hàng (SĐT nhiều định dạng, có dòng thiếu SĐT) |
| `orders_2024_2026.csv` | 302 | repo mẫu track DA | khách hàng + thiết bị đã mua; ngày đơn hàng = ngày mua (3 định dạng ngày) |
| `issue_descriptions.csv` | 2.400 | repo mẫu track AI | mô tả lỗi thật + nhóm sự cố + trung tâm → phiếu (lấy 60 phiếu × 2 trung tâm có nhân viên mẫu) |

Kết quả một lần nạp trên CSDL trống (đếm và giải thích chênh lệch):

| Nguồn | Đọc | Nạp | Đã có | Bị loại | Lý do chênh lệch |
|---|---|---|---|---|---|
| customers_raw | 402 | 378 | 1 | 23 | 22 dòng trống SĐT + 1 dòng `khong-co` không chuẩn hoá được (QT-02); 1 SĐT lặp |
| orders | 302 | 286 | 4 | 12 | 12 dòng SĐT sai; 4 đơn của khách đã có (một khách nhiều máy) |
| thiết bị | 290 | 290 | 0 | 0 | 4 đơn có ngày không đọc được → nạp với ngày mua trống (phiếu “Chờ xác minh”) |
| phiếu | 120 | 120 | 0 | 0 | — |

Chạy lại lần hai: “nạp” = 0, “đã có” = toàn bộ → không nhân đôi dòng.
