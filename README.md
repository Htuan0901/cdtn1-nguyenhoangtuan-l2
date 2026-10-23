# Smart CRM – Tiếp nhận và phân loại yêu cầu bảo hành (Luồng L2)

**Sinh viên:** Nguyễn Hoàng Tuấn – MSSV: 2374802010542

**Track:** SE (Công nghệ phần mềm) · **Lớp:** 03

**Học phần:** Chuyên đề Tốt nghiệp 1 – Trường ĐH Văn Lang · Case study: Smart CRM – Mekong Mobile

## 1. Mô tả bài toán và phạm vi
Khách hàng mang thiết bị đến trung tâm bảo hành → nhân viên tiếp nhận tra cứu khách hàng theo số điện thoại → ghi nhận thiết bị (Serial/IMEI) → nhập mô tả lỗi, chọn nhóm sự cố và mức ưu tiên → hệ thống kiểm tra điều kiện bảo hành, tính hạn cam kết → **phiếu bảo hành được tạo ở trạng thái “Mới”** (thiếu ngày mua: “Chờ xác minh bảo hành”, Quản lý trung tâm bảo hành xét duyệt rồi chuyển “Mới”).

- **Làm:** tra cứu/tạo khách hàng, ghi nhận thiết bị, tạo phiếu bảo hành, phân loại sự cố và mức ưu tiên, sinh hạn cam kết, xét duyệt phiếu chờ xác minh, danh sách và chi tiết phiếu.
- **Không làm:** phân công kỹ thuật viên (L4), tồn kho (L5), dashboard (L6), khảo sát (L8), phân loại bằng AI (L10), SMS/Zalo, quản lý tài khoản, sửa/xóa phiếu.

## 2. Yêu cầu môi trường
- **Node.js 20 LTS** (≥ 20.6, dùng `node --env-file` và `fetch` có sẵn) và npm 10 – kiểm tra: `node -v`
- **PostgreSQL 16** (cổng 5432) – chạy bằng **Docker Desktop** (cách dùng trong README này, TD-11) hoặc cài trực tiếp
- **Git Bash** (Windows) hoặc terminal bất kỳ; trình duyệt Chrome/Edge/Firefox bản mới
- Biến môi trường: `.env` ở thư mục gốc repo, tạo từ `.env.example` (không commit `.env`) – gồm `DATABASE_URL`, `PORT`, `JWT_SECRET`, `FRONTEND_ORIGIN`
- Thư viện backend: `express` 4, `pg` 8, `jsonwebtoken` 9 (cài bằng `npm install`). Giao diện **không cần thư viện** (JavaScript ES modules – TD-13)
- Cổng dùng: **3000** (API), **5173** (giao diện), **5432** (PostgreSQL)

## 3. Cài đặt và chạy (mỗi bước một lệnh – đã thử trên thư mục clone mới)

**Cửa sổ terminal 1 – cơ sở dữ liệu và backend** (mở Docker Desktop trước)

| Bước | Lệnh | Kết quả mong đợi |
|---|---|---|
| 1 | `git clone https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2.git` | có thư mục `cdtn1-nguyenhoangtuan-l2` |
| 2 | `cd cdtn1-nguyenhoangtuan-l2` | vào thư mục gốc repo |
| 3 | `docker run -d --name smartcrm-pg -e POSTGRES_PASSWORD=123456 -e POSTGRES_DB=smartcrm -p 5432:5432 postgres:16` | `docker ps` thấy `smartcrm-pg` Up. Lần sau chỉ cần `docker start smartcrm-pg` |
| 4 | `cp .env.example .env` | tạo `.env`; giá trị mặc định khớp lệnh docker ở bước 3 (dùng PostgreSQL cài sẵn thì sửa mật khẩu trong `DATABASE_URL`) |
| 5 | `cd src/backend` | |
| 6 | `npm install` | `added … packages` |
| 7 | `npm run migrate` | `✓ đã chạy 001, 002, 003` – 6 bảng (chạy lại → “bỏ qua”) |
| 8 | `npm run seed` | nạp **dữ liệu mẫu thật** `data/mau/*.csv`: 378 + 286 khách hàng, 290 thiết bị, 120 phiếu; chạy lại không nhân đôi |
| 9 | `npm test` | `# tests 40` `# pass 40` `# fail 0` (không cần CSDL) |
| 10 | `npm start` | `Smart CRM L2 API chạy tại http://localhost:3000` – **để nguyên cửa sổ này** |

**Cửa sổ terminal 2 – giao diện** (mở Git Bash mới tại thư mục gốc repo)

| Bước | Lệnh | Kết quả mong đợi |
|---|---|---|
| 11 | `cd src/frontend` | |
| 12 | `npm start` | `Giao diện Smart CRM L2 chạy tại http://localhost:5173` – **để nguyên cửa sổ này** |
| 13 | Mở trình duyệt: **http://localhost:5173** | trang Đăng nhập |

Tài khoản mẫu (mật khẩu chung **`Mekong@2026`**, chỉ dùng trên máy phát triển – TD-12):

| Tên đăng nhập | Vai trò | Trung tâm |
|---|---|---|
| `nv01` | Nhân viên tiếp nhận – tạo phiếu (M2) | TT-CT01 |
| `ql01` | Quản lý trung tâm bảo hành – xét duyệt (M3) | TT-CT01 |
| `nv02` | Nhân viên tiếp nhận | TT-CT02 |

**Cửa sổ terminal 3 – kiểm thử khi backend đang chạy** (mở Git Bash mới tại thư mục gốc repo)

| Bước | Lệnh | Kết quả mong đợi |
|---|---|---|
| 14 | `cd src/backend` | |
| 15 | `npm run e2e` | luồng chính 10/10 bước: đăng nhập → tra cứu khách → ghi nhận thiết bị → tạo phiếu → chi tiết → xét duyệt → danh sách – `KẾT LUẬN: … không lỗi` |
| 16 | `npm run test:repo` | 5 test repository trên PostgreSQL thật: `# pass 5` (không để lại dữ liệu) |

Lệnh khác (tuỳ chọn): `npm run demo` (11 tình huống API) · `npm run nfr2` (1.000 yêu cầu đồng thời) · `npm run token -- nv01` (JWT cho Postman/curl).

**Lỗi thường gặp**

| Triệu chứng | Cách xử lý |
|---|---|
| `ECONNREFUSED 127.0.0.1:5432` | Docker Desktop chưa mở hoặc container tắt → `docker start smartcrm-pg` |
| `password authentication failed` | sai mật khẩu trong `DATABASE_URL` của `.env` |
| `EADDRINUSE :3000` / `:5173` | cổng đang bị chiếm → tắt cửa sổ cũ (Ctrl + C) hoặc đổi `PORT` trong `.env` và `API_BASE_URL` trong `src/frontend/src/config.js` |
| Giao diện báo “Không kết nối được máy chủ API” | backend (cửa sổ 1) chưa chạy → `npm start` rồi bấm **Thử lại** |
| Trình duyệt báo lỗi CORS | `FRONTEND_ORIGIN` trong `.env` phải đúng `http://localhost:5173` → khởi động lại backend |
| `bad option: --env-file` | Node.js cũ hơn 20.6 → cài Node.js 20 LTS mới |

## 4. Cấu trúc thư mục – ánh xạ với sơ đồ kiến trúc (`docs/architecture.drawio`)
| Lớp trong sơ đồ | Thư mục | Thành phần |
|---|---|---|
| ① Trình bày – giao diện web (SPA) | `src/frontend/src/` | `pages/` (LoginPage, `M1-danh-sach-phieu`, `M2-tao-phieu`, `M3-chi-tiet-phieu`), `api/client.js` (nơi duy nhất gọi `fetch`, xử lý 401, hết thời gian) + `*.api.js`, `components/DataState.js` (đang tải · rỗng · lỗi + Thử lại) |
| ② API – Express | `src/backend/src/api/` | `middlewares/` (auth, validator, cors, errorHandler), `controllers/` (Auth, Customer, Device, Category, Ticket), `routes/`, `presenters/` |
| ③ Nghiệp vụ – Services & Policies | `src/backend/src/business/` | `services/` (auth, customer, device, category, ticket), `policies/` (sla, warranty, phone, password) |
| Nối lớp ③ với ④ | `src/backend/src/container.js` | nơi duy nhất tạo service với repository thật (TD-10) |
| ④ Truy cập dữ liệu – Repositories | `src/backend/src/data-access/` | `db.js` (pg Pool + giao dịch), `repositories/` (staff, customer, device, category, ticket, statusLog) |
| ⑤ CSDL PostgreSQL 16 | `src/backend/db/migrations/` | `001` 6 bảng theo DDL BT1 · `002` danh mục + tài khoản mẫu · `003` mật khẩu nhân viên |
| Dữ liệu mẫu thật | `data/mau/` | CSV của học phần, nạp bằng `scripts/seed-mau.js` (TD-16) |

```
├── README.md · .env.example · .gitignore
├── BT1_2374802010542_NguyenHoangTuan.pdf   ← BT1 (cập nhật sau phản hồi)
├── data/mau/                               ← dữ liệu mẫu thật (customers_raw, orders, issue_descriptions)
├── db/schema.sql                           ← DDL nộp ở BT1
├── docs/                                   ← SRS, .drawio, api-contract, thay-doi-thiet-ke, test-cases, test-execution, ảnh kết quả
├── src/backend/                            ← API Node.js (4 lớp) + scripts/ (migrate, seed, e2e, demo, nfr2)
├── src/frontend/                           ← giao diện M1–M3 + đăng nhập (server.js tĩnh, cổng 5173)
├── tests/backend/                          ← 40 unit test lớp nghiệp vụ (repository giả)
└── tests/repository/                       ← 5 test repository trên PostgreSQL thật
```

## 5. API đã chạy được (chi tiết: `docs/api-contract.md`)
| Endpoint | Use case | Ghi chú |
|---|---|---|
| `POST /api/auth/login` | Đăng nhập | không cần JWT; trả JWT 8 giờ + hồ sơ nhân viên (TD-12) |
| `POST /api/customers/lookup` | UC01 | chuẩn hoá SĐT (QT-02), che SĐT (QT-15), kèm danh sách thiết bị |
| `POST /api/customers` | UC02 | SĐT trùng sau chuẩn hoá → 409 `PHONE_EXISTS` (QT-01) |
| `POST /api/devices` | UC03 | tra cứu Serial/IMEI; chưa có + gửi `modelName` → ghi nhận mới; thuộc khách khác → 409 (QT-03) |
| `GET /api/issue-categories` | UC05 | mức ưu tiên mặc định (QT-A1) |
| `POST /api/tickets` | UC04 | kiểm tra bảo hành (QT-05), hạn cam kết (QT-04), mã phiếu từ SEQUENCE, phiếu + lịch sử trong 1 giao dịch |
| `GET /api/tickets` | UC06 | lọc ngày/trạng thái/mức ưu tiên/mã phiếu/SĐT, 20 dòng/trang, chỉ trung tâm mình |
| `GET /api/tickets/{ticketCode}` | UC08 | kèm lịch sử trạng thái |
| `POST /api/tickets/{ticketCode}/review` | UC07 | chỉ Quản lý; 400 thiếu ghi chú, 409 đã xét duyệt, 403 khác trung tâm |

## 6. Trạng thái hiện tại (buổi 10 – Sprint 2)
- [x] Buổi 8: module cốt lõi Phiếu bảo hành qua 3 lớp; migration theo DDL BT1; 35 unit test; script NFR2 (TD-01…TD-11)
- [x] **Module mở rộng [SE]:** giao diện 3 màn hình theo wireframe BT1 (M1 danh sách, M2 tiếp nhận, M3 chi tiết + xét duyệt) gọi API thật qua `src/api/client.js` + `tickets.api.js`; trang Đăng nhập; 401 → xoá token, về trang đăng nhập
- [x] Mọi vùng dữ liệu bọc bằng `DataState` (đang tải · rỗng có câu giải thích · lỗi có nút **Thử lại**); tắt backend → thấy thông báo lỗi; `grep -rn "fetch(" src/frontend/src/pages` rỗng
- [x] E2 tạo khách hàng, E3 ghi nhận thiết bị (TD-15)
- [x] Luồng chính chạy **end-to-end** trên **dữ liệu mẫu thật** (`npm run seed`, `npm run e2e`, và trên giao diện)
- [x] **40 unit test** (thêm TC-21…TC-25 cho đăng nhập, thiết bị, khách hàng) + **5 test repository** TR-01…TR-05 trên CSDL thật
- [x] 5 test case thủ công trên giao diện và nhật ký thực thi: `docs/test-cases.md`, `docs/test-execution.md`
- [x] Đã thử clone vào thư mục mới và chạy đúng theo mục 3
- [ ] Buổi 11–12: Dockerfile + docker-compose, logging, docs/test-plan.md, test-report.md, bug-log.md cho BT2
- Ảnh chụp kết quả: `docs/anh-ket-qua/` (buổi 8) và `docs/anh-ket-qua/buoi10/`

## 7. Tài liệu thiết kế (BT1)
`docs/srs.md` · `docs/usecase.drawio` · `docs/architecture.drawio` · `docs/erd.drawio` · `docs/wireframe.drawio` · `docs/api-contract.md` · `docs/checklist-bt1.md` · `docs/thay-doi-thiet-ke.md`.
Mở `.drawio` bằng https://app.diagrams.net (File → Open from → Device).

## 8. Khai báo sử dụng công cụ AI
Xem [`docs/ai-disclosure.md`](docs/ai-disclosure.md).

## 9. Quy ước commit
`<type>(<scope>): <mô tả>` – ví dụ `docs(srs): …`, `feat(ticket): …`, `fix(sla): …`, `test(sla): …`, `chore(backend): …`. Mỗi commit một đơn vị công việc, hệ thống vẫn chạy được sau mỗi commit.
