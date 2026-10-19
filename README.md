# Smart CRM – Tiếp nhận và phân loại yêu cầu bảo hành (Luồng L2)

**Sinh viên:** Nguyễn Hoàng Tuấn – MSSV: 2374802010542

**Track:** SE (Công nghệ phần mềm) · **Lớp:** 71K29CNTT06 (nhóm HP 03)

**Học phần:** Chuyên đề Tốt nghiệp 1 – Trường ĐH Văn Lang · Case study: Smart CRM – Mekong Mobile

## 1. Mô tả bài toán và phạm vi
Khách hàng mang thiết bị đến trung tâm bảo hành → nhân viên tiếp nhận tra cứu khách hàng theo số điện thoại → ghi nhận thiết bị (Serial/IMEI) → nhập mô tả lỗi, chọn nhóm sự cố và mức ưu tiên → hệ thống kiểm tra điều kiện bảo hành, tính hạn cam kết → **phiếu bảo hành được tạo ở trạng thái “Mới”** (thiếu ngày mua: “Chờ xác minh bảo hành”, Quản lý trung tâm bảo hành xét duyệt rồi chuyển “Mới”).

- **Làm:** tra cứu/tạo khách hàng, ghi nhận thiết bị, tạo phiếu bảo hành, phân loại sự cố và mức ưu tiên, sinh hạn cam kết, xét duyệt phiếu chờ xác minh, danh sách và chi tiết phiếu.
- **Không làm:** phân công kỹ thuật viên (L4), tồn kho (L5), dashboard (L6), khảo sát (L8), phân loại bằng AI (L10), SMS/Zalo, quản lý tài khoản, sửa/xóa phiếu.

## 2. Yêu cầu môi trường
- **Node.js 20 LTS** (≥ 20.6, dùng `node --env-file`) và npm 10
- **PostgreSQL 16** (cổng 5432), đã tạo database `smartcrm`
- Biến môi trường: sao chép `.env.example` thành `.env` ở thư mục gốc repo rồi điền `DATABASE_URL`, `PORT`, `JWT_SECRET` (không commit `.env`)
- Thư viện backend: `express` 4, `pg` 8, `jsonwebtoken` 9 (cài bằng `npm install`)
- Kiểm thử: `node:test` có sẵn trong Node.js; `npm test` chạy được ngay sau khi clone (repository giả, không cần CSDL)

## 3. Cài đặt và chạy
```bash
# 1. Tạo database (một lần)
psql -U postgres -c "CREATE DATABASE smartcrm;"

# 2. Cấu hình
cp .env.example .env          # Windows: copy .env.example .env  → mở .env sửa mật khẩu

# 3. Cài thư viện và tạo bảng theo DDL BT1 + dữ liệu mẫu
cd src/backend
npm install
npm run migrate               # chạy db/migrations/001, 002 (chạy lại không lỗi)

# 4. Chạy API
npm start                     # http://localhost:3000

# 5. Ở cửa sổ terminal khác (cũng trong src/backend)
npm test                      # 35 unit test (không cần CSDL, không cần npm install)
npm run demo                  # gọi thử 11 tình huống API, in mã HTTP + JSON
npm run token -- nv01         # in JWT để gọi API bằng Postman/curl (nv01, ql01 ở TT-CT01 | nv02 ở TT-CT02)
npm run nfr2                  # kiểm NFR2: 1.000 yêu cầu tạo phiếu đồng thời (chỉ dùng CSDL phát triển)
```
Ví dụ gọi bằng curl (Windows dùng `curl.exe`):
```bash
curl -s localhost:3000/api/tickets -H "Authorization: Bearer <JWT>"
curl -s -X POST localhost:3000/api/tickets -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
     -d "{\"customerId\":1,\"deviceId\":1,\"issueDesc\":\"Màn hình nhấp nháy\",\"categoryCode\":\"MAN_HINH\"}"
```

## 4. Cấu trúc thư mục – ánh xạ với sơ đồ kiến trúc (`docs/architecture.drawio`)
| Lớp trong sơ đồ | Thư mục | Thành phần |
|---|---|---|
| ① Trình bày – React SPA | `src/frontend/src/pages/` | `M1-danh-sach-phieu`, `M2-tao-phieu`, `M3-chi-tiet-phieu` (khung, làm từ buổi 9) |
| ② API – Express | `src/backend/src/api/` | `middlewares/authMiddleware.js`, `middlewares/validator.js`, `controllers/` (Customer, Category, Ticket), `routes/`, `presenters/` (che SĐT, định dạng +07:00) |
| ③ Nghiệp vụ – Services & Policies | `src/backend/src/business/` | `services/` (customerService, categoryService, ticketService), `policies/` (slaPolicy, warrantyPolicy, phonePolicy) |
| Nối lớp ③ với ④ | `src/backend/src/container.js` | nơi duy nhất tạo service với repository thật (TD-10) |
| ④ Truy cập dữ liệu – Repositories | `src/backend/src/data-access/` | `db.js` (pg Pool + giao dịch), `repositories/` (staff, customer, device, category, ticket, statusLog) |
| ⑤ CSDL PostgreSQL 16 | `src/backend/db/migrations/` | `001_tao_bang_theo_ddl_bt1.sql`, `002_du_lieu_mau.sql` |
| Tệp cấu hình SLA | `src/backend/config/sla.config.json` | QT-04, NFR6 |

```
├── README.md · .env.example · .gitignore
├── BT1_2374802010542_NguyenHoangTuan.pdf   ← BT1 (cập nhật sau phản hồi)
├── db/schema.sql                           ← DDL nộp ở BT1
├── docs/                                   ← SRS, sơ đồ .drawio, api-contract, thay-doi-thiet-ke, ảnh kết quả
├── src/backend/                            ← API Node.js (4 lớp như bảng trên) + scripts/
├── src/frontend/                           ← khung React
└── tests/backend/                          ← unit test lớp nghiệp vụ
```

## 5. API đã chạy được (chi tiết: `docs/api-contract.md`)
| Endpoint | Use case | Ghi chú |
|---|---|---|
| `POST /api/customers/lookup` | UC01 | chuẩn hoá SĐT (QT-02), che SĐT theo vai trò (QT-15) |
| `GET /api/issue-categories` | UC05 | mức ưu tiên mặc định (QT-A1) |
| `POST /api/tickets` | UC04 | kiểm tra bảo hành (QT-05), hạn cam kết (QT-04), mã phiếu từ SEQUENCE, phiếu + lịch sử trong 1 giao dịch |
| `GET /api/tickets` | UC06 | lọc ngày/trạng thái/mức ưu tiên/mã phiếu/SĐT, 20 dòng/trang, chỉ trung tâm mình |
| `GET /api/tickets/{ticketCode}` | UC08 | kèm lịch sử trạng thái |
| `POST /api/tickets/{ticketCode}/review` | UC07 | chỉ Quản lý; 400 thiếu ghi chú, 409 đã xét duyệt, 403 khác trung tâm |

## 6. Trạng thái hiện tại (buổi 8 – Sprint 1)
- [x] Ghi quyết định điều chỉnh thiết kế sau phản hồi BT1 (`docs/thay-doi-thiet-ke.md`, TD-01…TD-10)
- [x] Khung `src/` ánh xạ 1–1 với sơ đồ kiến trúc (mục 4)
- [x] Migration 001 tạo 6 bảng theo đúng DDL BT1; migration 002 nạp danh mục nhóm sự cố, 3 nhân viên (TT-CT01, TT-CT02 theo bộ mẫu), 3 khách hàng, 3 thiết bị, 2 phiếu mẫu
- [x] Module cốt lõi **Phiếu bảo hành** chạy qua đủ 3 lớp routes/controllers → services → repositories (Tạo, Đọc danh sách, Đọc chi tiết, Cập nhật trạng thái qua xét duyệt; không có xóa – TD-07)
- [x] SlaPolicy đọc `sla.config.json`; 35 unit test đạt: policy (AC1.1, AC1.3, AC4.1, AC4.2, AC5.1, AC5.2, NFR6), TicketService TC-01…TC-16 (luồng đúng, giá trị biên, dữ liệu sai), Validator TC-17…TC-20
- [x] Script kiểm NFR2 (1.000 yêu cầu đồng thời, đếm mã trùng, p95)
- [ ] E2 tạo khách hàng mới, E3 ghi nhận thiết bị (UC02, UC03) – buổi 9–10
- [ ] Frontend React M1–M3 gọi API – buổi 9–11
- [ ] Test tích hợp API tự động; docs/test-plan.md, test-report.md, bug-log.md cho BT2 – trước buổi 12
- Ảnh chụp kết quả chạy: `docs/anh-ket-qua/`

## 7. Tài liệu thiết kế (BT1)
`docs/srs.md` · `docs/usecase.drawio` · `docs/architecture.drawio` · `docs/erd.drawio` · `docs/wireframe.drawio` · `docs/api-contract.md` · `docs/checklist-bt1.md` · `docs/thay-doi-thiet-ke.md`.
Mở `.drawio` bằng https://app.diagrams.net (File → Open from → Device).

## 8. Khai báo sử dụng công cụ AI
Xem [`docs/ai-disclosure.md`](docs/ai-disclosure.md).

## 9. Quy ước commit
`<type>(<scope>): <mô tả>` – ví dụ `docs(srs): …`, `feat(ticket): …`, `fix(sla): …`, `test(sla): …`, `chore(backend): …`. Mỗi commit một đơn vị công việc, hệ thống vẫn chạy được sau mỗi commit.
