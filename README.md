# Smart CRM – Tiếp nhận và phân loại yêu cầu bảo hành (Luồng L2)

**Sinh viên:** Nguyễn Hoàng Tuấn – MSSV: 2374802010542

**Track:** SE (Công nghệ phần mềm) · **Lớp:** 03

**Học phần:** Chuyên đề Tốt nghiệp 1 – Trường ĐH Văn Lang · Case study: Smart CRM – Mekong Mobile

## 1. Mô tả bài toán và phạm vi
Khách hàng mang thiết bị đến trung tâm bảo hành → nhân viên tiếp nhận tra cứu khách hàng theo số điện thoại → ghi nhận thiết bị (Serial/IMEI) → nhập mô tả lỗi, chọn nhóm sự cố và mức ưu tiên → hệ thống kiểm tra điều kiện bảo hành, tính hạn cam kết → **phiếu bảo hành được tạo ở trạng thái “Mới”** (thiếu ngày mua: “Chờ xác minh bảo hành”, Quản lý trung tâm bảo hành xét duyệt rồi chuyển “Mới”).

- **Làm:** tra cứu/tạo khách hàng, ghi nhận thiết bị, tạo phiếu bảo hành, phân loại sự cố và mức ưu tiên, sinh hạn cam kết, xét duyệt phiếu chờ xác minh, danh sách và chi tiết phiếu.
- **Không làm:** phân công kỹ thuật viên (L4), tồn kho (L5), dashboard (L6), khảo sát (L8), phân loại bằng AI (L10), SMS/Zalo, quản lý tài khoản, sửa/xóa phiếu.

## 2. Yêu cầu môi trường
- **Node.js 20 LTS** (≥ 20.6, dùng `node --env-file` và `fetch` có sẵn; ghim trong `.nvmrc`) và npm 10 – kiểm tra: `node -v`
- **PostgreSQL 16** (cổng 5432) – chạy bằng **Docker Desktop** (cách dùng trong README này, TD-11) hoặc cài trực tiếp
- **Git Bash** (Windows) hoặc terminal bất kỳ; trình duyệt Chrome/Edge/Firefox bản mới
- Biến môi trường: `.env` ở thư mục gốc repo, tạo từ `.env.example` (không commit `.env`) – gồm `DATABASE_URL`, `DB_PASSWORD`, `PORT`, `JWT_SECRET`, `FRONTEND_ORIGIN`, `LOG_LEVEL`
- Thư viện backend: `express` 4, `pg` 8, `jsonwebtoken` 9 – **phiên bản khoá trong `src/backend/package-lock.json`**, cài đúng bản bằng `npm ci`. Giao diện **không cần thư viện** (JavaScript ES modules – TD-13)
- **Docker Desktop** (Docker Compose v2) – dùng cho PostgreSQL (Cách A), hoặc dựng cả hệ thống bằng 2 lệnh (Cách B)
- Cổng dùng: **3000** (API), **5173** (giao diện), **5432** (PostgreSQL)

## 3. Cài đặt và chạy

### Cách A – chạy bằng Node.js 20 (mỗi bước một lệnh – đã thử trên thư mục clone mới)

**Cửa sổ terminal 1 – cơ sở dữ liệu và backend** (mở Docker Desktop trước)

| Bước | Lệnh | Kết quả mong đợi |
|---|---|---|
| 1 | `git clone --branch v0.2 https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2.git thu-nghiem` | thư mục `thu-nghiem` ở đúng bản nộp Bài tập 2 (tag v0.2) |
| 2 | `cd thu-nghiem` | vào thư mục gốc repo |
| 3 | `docker run -d --name smartcrm-pg -e POSTGRES_PASSWORD=123456 -e POSTGRES_DB=smartcrm -p 5432:5432 postgres:16` | `docker ps` thấy `smartcrm-pg` Up. Lần sau chỉ cần `docker start smartcrm-pg` |
| 4 | `cp .env.example .env` | tạo `.env`; giá trị mặc định khớp lệnh docker ở bước 3 (dùng PostgreSQL cài sẵn thì sửa mật khẩu trong `DATABASE_URL`) |
| 5 | `cd src/backend` | |
| 6 | `npm ci` | `added … packages` – cài **đúng** phiên bản trong `package-lock.json` |
| 7 | `npm run migrate` | `✓ đã chạy 001, 002, 003` – 6 bảng (chạy lại → “bỏ qua”) |
| 8 | `npm run seed` | nạp **dữ liệu mẫu thật** `data/mau/*.csv`: 378 + 286 khách hàng, 290 thiết bị, 120 phiếu; chạy lại không nhân đôi |
| 9 | `npm test` | `# tests 57` `# pass 57` `# fail 0` (không cần CSDL) |
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
| 16 | `npm run test:repo` | 8 test repository trên PostgreSQL thật: `# pass 8` (không để lại dữ liệu) |
| 17 | `npm run crud` | CRUD đủ 4 thao tác cho Khách hàng và Thiết bị qua API: `17/17 bước`, tự dọn dữ liệu thử |

Lệnh khác (tuỳ chọn): `npm run demo` (11 tình huống API) · `npm run nfr2` (1.000 yêu cầu đồng thời) · `npm run token -- nv01` (JWT cho Postman/curl).

**Log:** backend ghi log JSON ra màn hình (mỗi dòng: thời điểm +07:00, mức, `requestId`, ngữ cảnh) – mức đặt bằng `LOG_LEVEL` trong `.env` (`debug` | `info` | `warn` | `error`). Log không chứa mật khẩu, token, số điện thoại (tự che). Lỗi 5xx trả cho người dùng **mã tra cứu** = `requestId` để tìm đúng dòng log.

### Cách B – Docker Compose, 2 lệnh (không cần cài Node.js, PostgreSQL)
Mở Docker Desktop, tại thư mục gốc repo vừa clone:

| Bước | Lệnh | Kết quả mong đợi |
|---|---|---|
| B1 | `cp .env.example .env` | tạo `.env` (mật khẩu mẫu chỉ dùng trên máy phát triển) |
| B2 | `docker compose up --build` | `db` healthy → `api` chạy migrate + nạp dữ liệu mẫu → `web`; mở **http://localhost:5173**, đăng nhập `nv01` / `Mekong@2026` |

Lệnh thường dùng: `docker compose ps` (trạng thái, phải `healthy`) · `docker compose logs -f api --tail 50` (xem log) · `docker compose down` (dừng, giữ dữ liệu) · `docker compose down -v` (xoá cả dữ liệu, làm lại từ đầu).
Nếu báo `port is already allocated`: tắt các cửa sổ `npm start` và container `smartcrm-pg` cũ (`docker stop smartcrm-pg`) rồi chạy lại B2.

**Lỗi thường gặp**

| Triệu chứng | Cách xử lý |
|---|---|
| `ECONNREFUSED 127.0.0.1:5432` | Docker Desktop chưa mở hoặc container tắt → `docker start smartcrm-pg` |
| Giao diện báo “Hệ thống đang gặp sự cố … Mã tra cứu: xxxxxxxx” | CSDL không sẵn sàng (503) → bật CSDL, bấm **Thử lại**; tìm mã trong log backend để biết nguyên nhân |
| Docker: `api` thoát ngay / `ECONNREFUSED db:5432` | chờ `db` healthy (`docker compose ps`); sửa SQL migration thì `docker compose down -v` rồi up lại |
| `password authentication failed` | sai mật khẩu trong `DATABASE_URL` của `.env` |
| `EADDRINUSE :3000` / `:5173` | cổng đang bị chiếm → tắt cửa sổ cũ (Ctrl + C) hoặc đổi `PORT` trong `.env` và `API_BASE_URL` trong `src/frontend/src/config.js` |
| Giao diện báo “Không kết nối được máy chủ API” | backend (cửa sổ 1) chưa chạy → `npm start` rồi bấm **Thử lại** |
| Trình duyệt báo lỗi CORS | `FRONTEND_ORIGIN` trong `.env` phải đúng `http://localhost:5173` → khởi động lại backend |
| `bad option: --env-file` | Node.js cũ hơn 20.6 → cài Node.js 20 LTS mới |

## 4. Cấu trúc thư mục – ánh xạ với sơ đồ kiến trúc (`docs/architecture.drawio`)
| Lớp trong sơ đồ | Thư mục | Thành phần |
|---|---|---|
| ① Trình bày – giao diện web (SPA) | `src/frontend/src/` | `pages/` (LoginPage, `M1-danh-sach-phieu`, `M2-tao-phieu`, `M3-chi-tiet-phieu`, `M4-khach-hang`), `api/client.js` (nơi duy nhất gọi `fetch`, xử lý 401, hết thời gian) + `*.api.js`, `components/DataState.js` (đang tải · rỗng · lỗi + Thử lại) |
| ② API – Express | `src/backend/src/api/` | `middlewares/` (requestId, auth, validator, cors, errorHandler – nơi DUY NHẤT ánh xạ lỗi → HTTP và ghi log lỗi), `controllers/` (Auth, Customer, Device, Category, Ticket), `routes/`, `presenters/` |
| ③ Nghiệp vụ – Services & Policies | `src/backend/src/business/` | `services/` (auth, customer, device, category, ticket), `policies/` (sla, warranty, phone, password) |
| Nối lớp ③ với ④ | `src/backend/src/container.js` | nơi duy nhất tạo service với repository thật (TD-10) |
| ④ Truy cập dữ liệu – Repositories | `src/backend/src/data-access/` | `db.js` (pg Pool + giao dịch), `errors.js` (dịch lỗi pg → DB_UNAVAILABLE / DUPLICATE_KEY / IN_USE), `repositories/` (staff, customer, device, category, ticket, statusLog) |
| Dùng chung | `src/backend/src/logger.js` | log JSON có mức, che dữ liệu nhạy cảm (TD-18) |
| Đóng gói | `docker-compose.yml`, `src/backend/Dockerfile`, `src/frontend/Dockerfile`, `.dockerignore` | db · api · web (TD-19) |
| ⑤ CSDL PostgreSQL 16 | `src/backend/db/migrations/` | `001` 6 bảng theo DDL BT1 · `002` danh mục + tài khoản mẫu · `003` mật khẩu nhân viên |
| Dữ liệu mẫu thật | `data/mau/` | CSV của học phần, nạp bằng `scripts/seed-mau.js` (TD-16) |

```
├── README.md · .env.example · .gitignore · .nvmrc · docker-compose.yml · .dockerignore
├── BT1_2374802010542_NguyenHoangTuan.pdf   ← BT1 (cập nhật sau phản hồi)
├── data/mau/                               ← dữ liệu mẫu thật (customers_raw, orders, issue_descriptions)
├── db/schema.sql                           ← DDL nộp ở BT1
├── docs/                                   ← SRS, .drawio, api-contract, thay-doi-thiet-ke, test-cases, test-execution, ảnh kết quả
├── src/backend/                            ← API Node.js (4 lớp) + scripts/ (migrate, seed, e2e, crud, demo, nfr2)
├── src/frontend/                           ← giao diện M1–M4 + đăng nhập (server.js tĩnh, cổng 5173)
├── tests/backend/                          ← 57 unit test (repository giả, không cần CSDL)
└── tests/repository/                       ← 8 test repository trên PostgreSQL thật
```

## 5. API đã chạy được (chi tiết: `docs/api-contract.md`)
| Endpoint | Use case | Ghi chú |
|---|---|---|
| `GET /health` | — | kiểm cả CSDL: 200 `{"db":"OK"}` hoặc 503 `{"db":"DOWN"}` (Docker HEALTHCHECK) |
| `POST /api/auth/login` | Đăng nhập | không cần JWT; trả JWT 8 giờ + hồ sơ nhân viên (TD-12) |
| `POST /api/customers/lookup` | UC01 | chuẩn hoá SĐT (QT-02), che SĐT (QT-15), kèm danh sách thiết bị |
| `POST /api/customers` | UC02 | SĐT trùng sau chuẩn hoá → 409 `PHONE_EXISTS` (QT-01) |
| `GET /api/customers?q=&page=` | M4 | tìm theo SĐT (chuẩn hoá) hoặc họ tên, 20 dòng/trang (TD-20) |
| `GET` · `PATCH` · `DELETE /api/customers/{id}` | M4 | sửa họ tên/SĐT (SĐT vẫn duy nhất); xoá chỉ Quản lý, 409 nếu khách đã có thiết bị |
| `POST /api/devices` | UC03 | tra cứu Serial/IMEI; chưa có + gửi `modelName` → ghi nhận mới; thuộc khách khác → 409 (QT-03) |
| `GET` · `PATCH` · `DELETE /api/devices/{id}` | M4 | sửa model, ngày mua, số tháng BH (không sửa Serial/IMEI); xoá chỉ Quản lý, 409 nếu đã có phiếu |
| `GET /api/issue-categories` | UC05 | mức ưu tiên mặc định (QT-A1) |
| `POST /api/tickets` | UC04 | kiểm tra bảo hành (QT-05), hạn cam kết (QT-04), mã phiếu từ SEQUENCE, phiếu + lịch sử trong 1 giao dịch |
| `GET /api/tickets` | UC06 | lọc ngày/trạng thái/mức ưu tiên/mã phiếu/SĐT, 20 dòng/trang, chỉ trung tâm mình |
| `GET /api/tickets/{ticketCode}` | UC08 | kèm lịch sử trạng thái |
| `POST /api/tickets/{ticketCode}/review` | UC07 | chỉ Quản lý; 400 thiếu ghi chú, 409 đã xét duyệt, 403 khác trung tâm |

**CRUD theo thực thể:** Khách hàng và Thiết bị đủ Tạo · Đọc · Sửa · Xoá. Phiếu bảo hành có Tạo · Đọc · Sửa trạng thái (xét duyệt), **không có xoá** vì phiếu là chứng từ bảo hành (TD-07).

## 6. Trạng thái hiện tại (buổi 12 – nộp Bài tập 2, tag `v0.2`)
- [x] Buổi 8: module cốt lõi Phiếu bảo hành qua 3 lớp; migration theo DDL BT1; script NFR2 (TD-01…TD-11)
- [x] Buổi 10: giao diện M1–M3 + đăng nhập gọi API thật, `DataState` 3 trạng thái, E2/E3, dữ liệu mẫu thật, luồng chính end-to-end (TD-12…TD-16)
- [x] Buổi 11: khoá phiên bản (`package-lock.json` + `npm ci`, `.nvmrc`), **10 lỗi** gỡ theo bốn bước trong `docs/bug-log.md` (1 Critical), log JSON có `requestId`, xử lý lỗi xuyên lớp (503 + mã tra cứu), Docker Compose (TD-17…TD-19)
- [x] Buổi 12: **CRUD đủ cho Khách hàng và Thiết bị** + màn hình **M4 Khách hàng** (tính năng phụ, TD-20)
- [x] Kiểm thử: **57 unit test** (`npm test`) + 8 test repository + luồng e2e 10 bước + CRUD 17 bước + 8 test case thủ công; `docs/test-plan.md`, `docs/test-report.md`
- [x] Dọn repo theo bảy việc: không `.env`/`node_modules`/secret, tệp khoá đã commit, `.env.example` đủ biến, đã clone vào thư mục mới và chạy theo README
- Ảnh chụp kết quả: `docs/anh-ket-qua/` (buổi 8), `docs/anh-ket-qua/buoi10/`, `docs/anh-ket-qua/bt2/`

## 7. Tài liệu thiết kế (BT1)
`docs/srs.md` · `docs/usecase.drawio` · `docs/architecture.drawio` · `docs/erd.drawio` · `docs/wireframe.drawio` · `docs/api-contract.md` · `docs/checklist-bt1.md` · `docs/thay-doi-thiet-ke.md`.
Kiểm thử và gỡ lỗi (BT2): `docs/test-plan.md` · `docs/test-report.md` · `docs/test-cases.md` · `docs/test-execution.md` · `docs/bug-log.md`.
Mở `.drawio` bằng https://app.diagrams.net (File → Open from → Device).

## 8. Khai báo sử dụng công cụ AI
Xem [`docs/ai-disclosure.md`](docs/ai-disclosure.md).

## 9. Quy ước commit
`<type>(<scope>): <mô tả>` – ví dụ `docs(srs): …`, `feat(ticket): …`, `fix(sla): …`, `test(sla): …`, `chore(backend): …`. Mỗi commit một đơn vị công việc, hệ thống vẫn chạy được sau mỗi commit.
