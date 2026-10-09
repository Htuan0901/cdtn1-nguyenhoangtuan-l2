# Smart CRM – Tiếp nhận và phân loại yêu cầu bảo hành (Luồng L2)

**Sinh viên:** Nguyễn Hoàng Tuấn – MSSV: 2374802010542
**Track:** SE (Công nghệ phần mềm)
**Học phần:** Chuyên đề Tốt nghiệp 1 – Trường ĐH Văn Lang · Case study: Smart CRM – Mekong Mobile

## 1. Mô tả bài toán
Khách hàng mang thiết bị đến trung tâm bảo hành → nhân viên tiếp nhận tra cứu khách hàng theo số điện thoại → ghi nhận thiết bị (Serial/IMEI) → nhập mô tả lỗi, chọn nhóm sự cố và mức ưu tiên → hệ thống kiểm tra điều kiện bảo hành, tính hạn cam kết → **phiếu bảo hành được tạo ở trạng thái “Mới”** (thiếu ngày mua: “Chờ xác minh bảo hành”, Quản lý trung tâm bảo hành xét duyệt rồi chuyển “Mới”).

## 2. Phạm vi
- Làm: tra cứu/tạo khách hàng, ghi nhận thiết bị, tạo phiếu bảo hành, phân loại sự cố và mức ưu tiên, sinh hạn cam kết, xét duyệt phiếu chờ xác minh, danh sách và chi tiết phiếu.
- Không làm: phân công kỹ thuật viên (L4), tồn kho (L5), dashboard (L6), khảo sát (L8), phân loại bằng AI (L10), SMS/Zalo, quản lý tài khoản.

## 3. Công nghệ dự kiến
| Thành phần | Công nghệ |
|---|---|
| Backend | Node.js 20 LTS + Express (REST API) |
| CSDL | PostgreSQL 16 |
| Frontend | React |
| Quản lý mã nguồn | Git / GitHub |

## 4. Cấu trúc thư mục (Bài tập 1)
```
├── README.md
├── docs/
│   ├── srs.md                 ← Mục 1 + Mục 2 của PDF (SRS, Use Case)
│   ├── usecase.drawio         ← Mục 2 (file gốc draw.io)
│   ├── architecture.drawio    ← Mục 3
│   ├── erd.drawio             ← Mục 4
│   ├── wireframe.drawio       ← Mục 5 (3 trang: M1, M2, M3)
│   ├── ai-declaration.md      ← Phụ lục khai báo AI
│   └── export/*.png           ← ảnh xuất để chèn PDF
├── db/
│   └── schema.sql             ← SQL DDL skeleton (PostgreSQL 16)
└── BT1_2374802010542_NguyenHoangTuan.pdf   ← bản đã nộp E-learning
```
Mở các file `.drawio` bằng https://app.diagrams.net (File → Open from → Device) hoặc draw.io Desktop.
Chạy thử DDL: `psql -U postgres -d smartcrm -f db/schema.sql`.

## 5. Hướng dẫn cài đặt & chạy
Sẽ bổ sung từ Bài tập 2 (giai đoạn hiện thực hoá).

## 6. Khai báo sử dụng công cụ AI
Xem `docs/ai-declaration.md`.
