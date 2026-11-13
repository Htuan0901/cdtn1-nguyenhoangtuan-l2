# Bug Log – Smart CRM · Luồng L2 (track SE)

Sinh viên: Nguyễn Hoàng Tuấn – MSSV 2374802010542. Mẫu 7 dòng theo Buổi 11 (Buổi 13 – 16: từ BUG-11 trở đi mỗi bug một commit riêng `fix(…): … (BUG-xx)`); mỗi lỗi được gỡ theo bốn bước
**tái lập → khoanh vùng → sửa nguyên nhân → xác nhận bằng test**. Dòng 5 ghi NGUYÊN NHÂN, không ghi triệu chứng.

| Mã | Mức độ | Tóm tắt | Phát hiện | Commit sửa | Test xác nhận |
|---|---|---|---|---|---|
| BUG-01 | Major | Mở chi tiết phiếu ra 404 vì mã phiếu chứa “/” | Buổi 8 | [7aebb38](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/7aebb38) | `npm run demo` tình huống 7–10, `npm run e2e` bước 7 |
| BUG-02 | Major | Lỗi trong controller async làm request treo | Buổi 8 | [7aebb38](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/7aebb38) | `npm run demo` tình huống 2, 5, 8 |
| BUG-03 | Major | Tìm phiếu theo SĐT có khoảng trắng không ra kết quả | Buổi 10 | [47e2bc2](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/47e2bc2) · test [e1125cf](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/e1125cf) | TC-29 |
| BUG-04 | Minor | `npm run seed` đếm thiết bị vào cột “bị loại” dù đã nạp | Buổi 10 | [6901a7d](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/6901a7d) | chạy lại seed: đọc = nạp + đã có + loại |
| BUG-05 | Minor | TR-05 lỗi “value too long for type character varying(20)” | Buổi 10 | [99996cc](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/99996cc) | TR-05 |
| BUG-06 | Major | Ngày không có thật (30/02) trả 500 | Buổi 11 | [d055c83](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/d055c83) | TC-26 |
| BUG-07 | Major | Số trang / mã khách quá lớn trả 500 | Buổi 11 | [d055c83](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/d055c83) | TC-27 |
| BUG-08 | Major | Mở giao diện bằng 127.0.0.1 → CORS chặn mọi lời gọi API | Buổi 11 | [d055c83](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/d055c83) | TC-28 |
| BUG-09 | Major | CSDL mất kết nối → 500 không mã tra cứu, log không truy vết được | Buổi 11 | [04bb9b7](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/04bb9b7) | TC-30, TC-33 |
| BUG-10 | **Critical** | CSDL khởi động lại khi API đang chạy → API chết hẳn | Buổi 11 | [04bb9b7](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/04bb9b7) | TC-34 |
| BUG-11 | **Critical** | Mật khẩu PostgreSQL ghi trong README, TD-11 và `.env.example` của repo public | Buổi 14 – phản hồi BT2, ST-11 | [d8334bc](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/d8334bc212de71035789147bb00d26e12ae4c8be) | ST-11, TC-46 |
| BUG-12 | Minor | `GET /api/tickets?q=a&q=b` (hoặc `q[x]=1`) trả 500 thay vì 400 | Buổi 14 – ST-08 | [e4632c0](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/e4632c08c45b0abf3bad5e49d344f6f269bc893c) | ST-08, TC-43, TC-44 |
| BUG-13 | Minor | Body JSON lớn hơn 100 KB trả 500 thay vì 413 | Buổi 14 – ST-09 | [3674a17](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/3674a17ed0e32e8e4bcbb85b57fc66169d5a58c5) | ST-09, TC-45 |
| BUG-14 | Major | Bộ test không chạy được trong container: `npm test` không thấy tệp test, `npm run st` đòi tệp `.env` | Buổi 15 – phép thử máy trắng bước 5 | [91b2894](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/91b2894fe1afe17f6c4680807d21012dd8d5e425) | TC-47…TC-49, CI job `dong-goi`, Deployment Guide §5 bước 5–9 |
| BUG-15 | Critical | Một request có body nén gzip kèm byte thừa làm sập tiến trình API (lỗ hổng `body-parser` 1.20.8, CVE-2026-111181) | Buổi 16 – `npm audit` (checklist bảo mật mục 7) | [b057ae0](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/b057ae0) | `npm audit --omit=dev` → 0; CI bước `npm audit --audit-level=high` |

---

### BUG-15 · Critical – Một request nén có byte thừa làm sập tiến trình API (lỗ hổng thư viện body-parser)
| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-15 · **Critical** – lỗ hổng bảo mật làm **dừng hệ thống**. Chỉ một request, không cần đăng nhập (body được đọc trước khi xác thực và định tuyến), là đủ làm tiến trình Node.js của API thoát. Container `api` không có chính sách tự khởi động lại, nên mọi nhân viên mất dịch vụ tới khi có người khởi động lại bằng tay. Cảnh báo gốc: GHSA-27r3-jxmh-p828 / CVE-2026-111181, mức High, CVSS 7.5 (A:H) |
| 2. Phát hiện bởi | Checklist bảo mật mục 7 (Buổi 15–16): chạy `npm audit --omit=dev` trong `src/backend` trước khi gắn tag `v1.0` |
| 3. Triệu chứng | `npm audit --omit=dev` báo **`1 high severity vulnerability`**: `body-parser <1.20.9 – body-parser vulnerable to Denial of Service via trailing bytes after a compressed request body`, `fix available via npm audit fix` (ảnh `sec-audit-truoc.png`). Cây phụ thuộc: express 4.22.3 → body-parser **1.20.8** |
| 4. Cách tái lập | Trên commit trước bản vá: `cd src/backend` → `npm ci` → `npm audit --omit=dev`. Kết quả như dòng 3 (ảnh `sec-audit-truoc.png`). Em tái lập bằng công cụ kiểm phụ thuộc và **không** gửi request tấn công vào hệ thống; điều kiện khai thác lấy từ cảnh báo chính thức |
| 5. Nguyên nhân | API đọc JSON bằng `express.json()`, tức `body-parser` với cấu hình mặc định `inflate: true`, nên chấp nhận body có `Content-Encoding: gzip/deflate`. Ở bản 1.20.8, body nén được đưa qua luồng giải nén mà **không gắn hàm bắt lỗi**. Nếu sau khung nén hợp lệ còn byte thừa, luồng giải nén phát lỗi, lỗi này trở thành *uncaught exception* và làm thoát cả tiến trình. Lỗi nằm trong thư viện bên thứ ba; mã của em không bắt được vì nó xảy ra ngoài chuỗi middleware. Lockfile ghim bản 1.20.8 từ trước khi cảnh báo được công bố |
| 6. Cách sửa | `npm audit fix --omit=dev` nâng **body-parser 1.20.8 → 1.20.9** (bản vá, cùng nhánh 1.20.x mà express 4.22.3 cho phép). Chỉ `package-lock.json` đổi 3 dòng (version, resolved, integrity); không đổi mã nguồn và không đổi API. Không dùng `--force`, nên không nâng bản chính nào. Thêm bước CI `npm audit --omit=dev --audit-level=high`: nếu lỗ hổng mức High/Critical quay lại, CI đỏ |
| 7. Commit và xác nhận | [b057ae0](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/b057ae0) · `npm ls body-parser` → `body-parser@1.20.9` · `npm audit --omit=dev` → **`found 0 vulnerabilities`** (ảnh `sec-audit.png`) · `npm test` 64/64 PASS sau khi nâng · bước CI `npm audit --omit=dev --audit-level=high` là test hồi quy: lệnh trả mã thoát khác 0 khi còn lỗ hổng từ mức High, nên lockfile cũ làm CI đỏ, lockfile mới làm CI xanh |

---

### BUG-14 · Major – Bộ test không chạy được trong container của gói đóng gói
| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-14 · **Major** – hệ thống vẫn lên được, nhưng chức năng quan trọng của gói bàn giao hỏng: người nhận (giảng viên) **không chạy được bộ test** bằng lệnh trong Guide, nên không kiểm chứng được Test Report (mục cốt lõi C3). Có cách làm khác (cài Node.js 20 trên máy, mở cổng 5432 cho CSDL rồi chạy ngoài container), nên chưa tới mức Critical |
| 2. Phát hiện bởi | Phép thử máy trắng lần đầu (Buổi 15, đề BT3 mục 2.4 bước 5): sau `docker compose up -d --build`, chạy lệnh test trong container |
| 3. Triệu chứng | Trên mã Buổi 14 (commit `0493a95`), cả 3 dịch vụ đều healthy, nhưng: (a) `docker compose exec -T api npm test` dừng ngay với **`Could not find '…/tests/backend/slaPolicy.test.js'`**, 0 test được chạy; (b) `docker compose exec -T api npm run st` dừng với **`node: ../../.env: not found`**, không test case nào chạy. Ảnh `BUG-14-truoc.png` |
| 4. Cách tái lập | `git checkout 0493a95` → `cp .env.example .env` → `docker compose up -d --build` → chờ healthy → hai lệnh ở dòng 3. Chạy mỗi lệnh 3 lần: tái lập **3/3 lần** |
| 5. Nguyên nhân | Hai nguyên nhân trong cấu hình đóng gói, không nằm trong mã nghiệp vụ. **(1) Bố cục image khác bố cục repo:** `src/backend/Dockerfile` chép mã vào `/app` và `.dockerignore` loại hẳn thư mục `tests/`. Trong khi đó script `npm test` trỏ tới `../../tests/backend/*.test.js`, và các test `require('../../src/backend/src/…')`, tức là giả định mã nằm ở `<gốc>/src/backend`. Từ `/app`, đường dẫn `../../tests` thành `/tests`, không tồn tại. **(2) Script npm bắt buộc có tệp `.env`:** các script `st`, `e2e`, `crud`, `test:repo` (và `migrate`, `seed`) dùng cờ `node --env-file=../../.env`. Cờ này dừng chương trình khi không có tệp, nhưng trong container không có (và không được có) `.env`, vì biến môi trường do docker compose truyền vào. Lỗi không lộ ra ở BT2 vì mọi bộ test chỉ được chạy trên máy dev, nơi có sẵn `tests/` và `.env` |
| 6. Cách sửa | `src/backend/Dockerfile`: WORKDIR `/repo/src/backend`, chép `tests/` → `/repo/tests`, `data/mau` → `/repo/data/mau`, `docs/*.md` + README + `docker-compose.yml` + `.env.example` → `/repo` (ST-11 quét các tệp này). Image có cùng bố cục với repo, và vẫn không chứa `.env`. `.dockerignore`: bỏ dòng `tests`, đổi `docs` thành `docs/screenshots`. Thêm `scripts/load-env.js`: nạp `../../.env` **nếu có**, không ghi đè biến đã có (giống quy tắc của `--env-file`). `package.json`: mọi script dùng `node -r ./scripts/load-env.js` thay cho `--env-file` |
| 7. Commit và xác nhận | [91b2894](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/91b2894fe1afe17f6c4680807d21012dd8d5e425) · Test hồi quy TC-47, TC-48, TC-49 FAIL trên mã cũ (chưa có `load-env.js`, `.dockerignore` loại `tests`), PASS sau khi sửa · phép thử máy trắng lại từ thư mục trống: `npm test` 64/64, `npm run st` 12/12 trong container (ảnh `bt3-npm-test.png`, `bt3-st.png`) · CI job `dong-goi` xanh |

---

### BUG-11 · Critical – Mật khẩu CSDL nằm trong tài liệu của repo public
| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-11 · **Critical** – lỗ hổng bảo mật: repo PUBLIC nên ai cũng đọc được mật khẩu PostgreSQL trên máy phát triển (dữ liệu **lộ**); người dùng hay dùng lại mật khẩu ở nơi khác. Theo hướng dẫn Buổi 14, secret trong repo là Critical |
| 2. Phát hiện bởi | Giảng viên khi chấm BT2 (“Không ghi chuỗi kết nối có mật khẩu (kể cả mật khẩu máy cá nhân) vào tài liệu trong repo”); xác nhận bằng ST-11 lần 1 |
| 3. Triệu chứng | ST-11 lần 1 FAIL: **4 vị trí** lộ mật khẩu – `README.md:34` (lệnh `docker run` có ghi thẳng mật khẩu sau biến POSTGRES_PASSWORD), `.env.example:4` (`DATABASE_URL` có mật khẩu thật của máy), `.env.example:6`, `docs/thay-doi-thiet-ke.md:138` (chuỗi kết nối đầy đủ trong TD-11) |
| 4. Cách tái lập | Mở repo ở cửa sổ ẩn danh, tìm `postgres://` hoặc `POSTGRES_PASSWORD` → thấy mật khẩu; hoặc `npm run st -- ST-11` trên commit trước khi sửa. Tái lập **3/3 lần** |
| 5. Nguyên nhân | Khi thêm Cách chạy bằng Docker (TD-11), em chép thẳng mật khẩu PostgreSQL đang dùng trên máy vào lệnh `docker run` của README, vào `.env.example` và vào TD-11 thay vì để lệnh đọc từ `.env`; không có bước kiểm nào chặn mật khẩu trong tài liệu |
| 6. Cách sửa | **Đổi khoá trước:** đổi mật khẩu PostgreSQL trên máy (`ALTER USER postgres PASSWORD …`), cập nhật `.env` (không commit). Sau đó gỡ khỏi repo: `docker run --env-file .env` thay cho mật khẩu viết trong lệnh; `DB_PASSWORD` → `POSTGRES_PASSWORD` dùng chung cho `docker run` và `docker compose`; `.env.example` chỉ còn giá trị mẫu `doi_mat_khau_nay`; TD-11 bỏ chuỗi kết nối. Lịch sử commit cũ vẫn chứa mật khẩu cũ nên mật khẩu đó coi như đã lộ và không dùng lại (không viết lại lịch sử để giữ tag `v0.2` – TD-21) |
| 7. Commit và xác nhận | [d8334bc](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/d8334bc212de71035789147bb00d26e12ae4c8be) · ST-11 lần 2: **0 vị trí** · TC-46 (quét tài liệu trong `npm test`) FAIL trên mã cũ, PASS sau khi sửa · clone mới làm đúng README bước 3 – 4 vẫn dựng được CSDL |

### BUG-12 · Minor – Tham số `q` trùng tên làm `GET /api/tickets` trả 500
| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-12 · **Minor** – người dùng vẫn làm được việc (giao diện M1 luôn gửi một chuỗi), dữ liệu không sai và không lộ (người gọi chỉ nhận thông điệp chung + mã tra cứu); nhưng request sai của người gọi bị tính là lỗi hệ thống (500, log ERROR), làm nhiễu việc theo dõi lỗi thật |
| 2. Phát hiện bởi | ST-08 lần 1 (test hệ thống, đoán lỗi ở ranh giới HTTP: tham số trùng tên, tham số dạng đối tượng) |
| 3. Triệu chứng | `GET /api/tickets?q=0901234567&q=BH-000001` và `GET /api/tickets?q[x]=1` → **500 LOI_HE_THONG**; log: `filters.q.trim is not a function` |
| 4. Cách tái lập | `npm start` → `npm run st -- ST-08` (hoặc curl với token của `nv01`). Tái lập **3/3 lần** |
| 5. Nguyên nhân | Express 4 (query parser “extended”) tách `?q=a&q=b` thành MẢNG và `?q[x]=1` thành ĐỐI TƯỢNG. Schema `listTickets` của validator không kiểm `q` nên giá trị không phải chuỗi đi thẳng vào lớp ③; `ticketService.listTickets` (dòng 56) gọi `filters.q.trim()` → TypeError. Khoanh vùng: ngăn xếp lỗi dừng ở `ticketService.js:56`, request đã qua validator |
| 6. Cách sửa | `api/middlewares/validator.js`: `listTickets` kiểm `q` là chuỗi ≤ 100 ký tự (cùng giới hạn với `listCustomers`) → 400 VALIDATION_ERROR [q]; lớp ③ không đổi |
| 7. Commit và xác nhận | [e4632c0](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/e4632c08c45b0abf3bad5e49d344f6f269bc893c) · ST-08 lần 2: 400 VALIDATION_ERROR [q] cả hai bước · TC-43, TC-44 FAIL trên mã cũ, PASS sau khi sửa · `npm test` 61/61 |

### BUG-13 · Minor – Body vượt 100 KB trả 500 thay vì 413
| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-13 · **Minor** – người dùng không bị chặn việc (form không gửi tới 100 KB), không sai hay lộ dữ liệu, không ghi gì vào CSDL; nhưng lỗi của người gửi bị báo thành 500 + log ERROR |
| 2. Phát hiện bởi | ST-09 lần 1 (test hệ thống, dữ liệu sai: body vượt giới hạn) |
| 3. Triệu chứng | `POST /api/customers` với họ tên 120.000 ký tự → **500 LOI_HE_THONG**; customer 673 → 673 (+0); log ERROR “request entity too large” |
| 4. Cách tái lập | `npm start` → `npm run st -- ST-09`. Tái lập **3/3 lần** |
| 5. Nguyên nhân | `app.js` đặt `express.json({ limit: '100kb' })`; khi vượt, body-parser ném lỗi có `type: 'entity.too.large'`, `status: 413`. `errorHandler` chỉ nhận diện `entity.parse.failed` và `AppError`, mọi lỗi khác rơi vào nhánh lỗi hệ thống → 500 |
| 6. Cách sửa | `api/middlewares/errorHandler.js`: lỗi `entity.too.large` → **413 PAYLOAD_TOO_LARGE** “Dữ liệu gửi lên quá lớn (tối đa 100 KB)”, log mức INFO như các lỗi do người gửi |
| 7. Commit và xác nhận | [3674a17](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/3674a17ed0e32e8e4bcbb85b57fc66169d5a58c5) · ST-09 lần 2: 413 PAYLOAD_TOO_LARGE, customer +0 · TC-45 FAIL trên mã cũ, PASS sau khi sửa · `npm test` 61/61 |

---

### BUG-10 · Critical – API dừng hẳn khi CSDL khởi động lại
| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-10 · **Critical** – toàn bộ hệ thống ngừng phục vụ, phải chạy lại `npm start` bằng tay |
| 2. Phát hiện bởi | Kiểm thử thủ công Buổi 11: tắt rồi bật lại PostgreSQL (tương đương `docker restart smartcrm-pg`) khi API đang chạy |
| 3. Triệu chứng | Sau khi CSDL bật lại, giao diện báo “Không kết nối được máy chủ API”; cửa sổ backend đã thoát với `Unhandled 'error' event` |
| 4. Cách tái lập | `npm start` → gọi `GET /api/tickets` một lần (để pool có kết nối rảnh) → dừng PostgreSQL → `curl localhost:3000/health`: không phản hồi. Tái lập **3/3 lần** |
| 5. Nguyên nhân | Khi CSDL đóng kết nối, kết nối RẢNH trong `pg.Pool` phát sự kiện `'error'`; `db.js` không đăng ký listener nên Node.js coi là lỗi chưa xử lý và dừng tiến trình. Khoanh vùng: ngăn xếp lỗi kết thúc ở `BoundPool` (lớp ④), không đi qua controller |
| 6. Cách sửa | `data-access/db.js`: `pool.on('error', …)` ghi WARN – pool tự bỏ kết nối hỏng và tạo kết nối mới; thêm `connectionTimeoutMillis: 5000` để request không treo khi CSDL không trả lời |
| 7. Commit và xác nhận | [04bb9b7](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/04bb9b7) · chạy lại bước 4 ba lần: API vẫn trả 200 sau mỗi lần CSDL bật lại · TC-34 PASS |

### BUG-09 · Major – CSDL mất kết nối trả 500, người dùng không có mã tra cứu, log không truy vết được
| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-09 · Major – khi có sự cố không biết dòng log nào ứng với lời báo của người dùng |
| 2. Phát hiện bởi | Rà xử lý lỗi theo Buổi 11 (năm kiểu xử lý lỗi sai): dừng PostgreSQL rồi gọi API |
| 3. Triệu chứng | `GET /api/tickets` → 500 “Lỗi hệ thống, vui lòng thử lại”; `/health` vẫn trả OK; log là 36 dòng `console.error` không có thời điểm, mức, requestId |
| 4. Cách tái lập | Dừng PostgreSQL → `curl -H "Authorization: Bearer <JWT>" localhost:3000/api/tickets` (5/5 lần) |
| 5. Nguyên nhân | Lỗi kỹ thuật của thư viện pg (ECONNREFUSED) đi thẳng lên middleware mà không được DỊCH ở lớp dữ liệu, nên middleware không phân biệt được “CSDL không sẵn sàng” (503) với lỗi lập trình (500); ứng dụng không có logger và không gắn requestId cho request |
| 6. Cách sửa | `data-access/errors.js` dịch lỗi pg → DB_UNAVAILABLE / DUPLICATE_KEY / DB_ERROR; middleware lỗi duy nhất trả 503 `LOI_HE_THONG` + “Mã tra cứu: <requestId>”, ghi ERROR **một lần** kèm requestId; `logger.js` JSON có thời điểm +07:00, tự che dữ liệu nhạy cảm; `/health` kiểm cả CSDL |
| 7. Commit và xác nhận | [04bb9b7](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/04bb9b7) · bước 4 → 503 + mã tra cứu, đúng 1 dòng ERROR trong log · TC-30, TC-33 PASS |

### BUG-08 · Major – Mở giao diện bằng 127.0.0.1 thì mọi màn hình báo lỗi kết nối
| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-08 · Major – người chấm làm theo README nhưng gõ 127.0.0.1 sẽ thấy hệ thống “không chạy” |
| 2. Phát hiện bởi | Rà bảng lỗi tích hợp hay gặp (Buổi 10, dòng CORS); thử mở http://127.0.0.1:5173 |
| 3. Triệu chứng | Đăng nhập báo “Không kết nối được máy chủ API” dù backend đang chạy; DevTools báo lỗi CORS |
| 4. Cách tái lập | `curl -i -X OPTIONS localhost:3000/api/tickets -H "Origin: http://127.0.0.1:5173"` → không có header `Access-Control-Allow-Origin` |
| 5. Nguyên nhân | `FRONTEND_ORIGIN` mặc định (config.js và .env.example) chỉ có `http://localhost:5173`; với trình duyệt, localhost và 127.0.0.1 là hai origin khác nhau |
| 6. Cách sửa | Mặc định gồm cả hai origin, cách nhau bằng dấu phẩy; vẫn không dùng “*” (NFR4) |
| 7. Commit và xác nhận | [d055c83](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/d055c83) · bước 4 có header đúng · TC-28 PASS (kể cả origin lạ vẫn bị từ chối) |

### BUG-07 · Major – Số trang hoặc mã khách quá lớn trả 500
| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-07 · Major – dữ liệu sai làm lỗi hệ thống thay vì báo người dùng nhập lại |
| 2. Phát hiện bởi | Rà giá trị biên của validator (Buổi 11) |
| 3. Triệu chứng | `GET /api/tickets?page=99999999999999999999` và `POST /api/tickets` với `customerId: 3000000000` → 500 |
| 4. Cách tái lập | Hai lệnh curl ở dòng 3 (3/3 lần); log: `invalid input syntax for type bigint: "2e+21"`, `value "3000000000" is out of range for type integer` |
| 5. Nguyên nhân | Validator chỉ kiểm “là số nguyên dương”, không kiểm giới hạn kiểu INT của PostgreSQL; Number(…) đổi số rất lớn thành dạng mũ `2e+21` |
| 6. Cách sửa | Validator (ranh giới lớp ②) giới hạn `page` ≤ 10.000 và mã ≤ 2.147.483.647 → 400 VALIDATION_ERROR |
| 7. Commit và xác nhận | [d055c83](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/d055c83) · bước 4 → 400 kèm tên trường · TC-27 PASS (biên 10.000 vẫn hợp lệ) |

### BUG-06 · Major – Ngày không có thật trả 500
| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-06 · Major |
| 2. Phát hiện bởi | Rà giá trị biên của validator (Buổi 11) |
| 3. Triệu chứng | Lọc M1 với `from=2026-02-30` hoặc ghi nhận thiết bị có `purchaseDate: "2026-02-30"` → 500 |
| 4. Cách tái lập | `curl "localhost:3000/api/tickets?from=2026-02-30" -H "Authorization: Bearer <JWT>"` (3/3 lần); log: `date/time field value out of range` (22008) |
| 5. Nguyên nhân | `isDate` chỉ kiểm hình dạng `YYYY-MM-DD` bằng biểu thức chính quy, không kiểm ngày có thật trên lịch; lỗi chỉ lộ ra khi PostgreSQL ép kiểu `::date` |
| 6. Cách sửa | `isDate` dựng lại ngày và so khớp chuỗi → 30/02, 31/04 bị từ chối 400; năm nhuận 29/02/2028 vẫn hợp lệ |
| 7. Commit và xác nhận | [d055c83](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/d055c83) · TC-26 PASS |

### BUG-05 · Minor – Test repository TR-05 lỗi “value too long”
| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-05 · Minor – lỗi trong dữ liệu thử, không ảnh hưởng người dùng |
| 2. Phát hiện bởi | `npm run test:repo` lần đầu (Buổi 10) |
| 3. Triệu chứng | TR-05 FAIL: `value too long for type character varying(20)` |
| 4. Cách tái lập | `npm run test:repo` (lần nào cũng FAIL) |
| 5. Nguyên nhân | Mã phiếu thử `TEST-TX-<Date.now()>` dài 21 ký tự; cột `ticket_code` theo DDL BT1 tối đa 20 – lệch hợp đồng dữ liệu giữa test và CSDL |
| 6. Cách sửa | Rút ngắn mã thử (`Date.now() % 1e9`), ghi chú giới hạn ngay cạnh dòng tạo mã |
| 7. Commit và xác nhận | [99996cc](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/99996cc) · TR-05 PASS và vẫn kiểm đúng ROLLBACK |

### BUG-04 · Minor – Báo cáo nạp dữ liệu mẫu đếm sai
| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-04 · Minor |
| 2. Phát hiện bởi | Đối chiếu số dòng sau `npm run seed` (Buổi 10, bước 4 – phân loại lỗi logic) |
| 3. Triệu chứng | Bảng kết quả ghi 4 thiết bị “bị loại”, nhưng CSDL có đủ 290 thiết bị |
| 4. Cách tái lập | `npm run seed` trên CSDL trống |
| 5. Nguyên nhân | Lỗi logic: thiết bị có ngày mua không đọc được (vẫn được nạp với ngày mua trống) bị cộng vào bộ đếm “bị loại” |
| 6. Cách sửa | Tách thành dòng ghi chú “nạp với ngày mua trống”; cột “bị loại” chỉ đếm dòng thực sự không nạp |
| 7. Commit và xác nhận | [6901a7d](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/6901a7d) · chạy lại: đọc = nạp + đã có + bị loại ở cả 4 nguồn |

### BUG-03 · Major – Tìm phiếu theo SĐT có khoảng trắng không ra kết quả
| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-03 · Major – nhân viên gõ SĐT như khách đọc (“0901 234 567”) sẽ tưởng khách chưa có phiếu |
| 2. Phát hiện bởi | Rà hợp đồng dữ liệu M1 ↔ E6 khi ghép giao diện (Buổi 10) |
| 3. Triệu chứng | Ô “Mã phiếu / SĐT” ở M1: “0901 234 567” → “Không có phiếu bảo hành phù hợp”, “0901234567” → có kết quả |
| 4. Cách tái lập | `GET /api/tickets?q=0901%20234%20567` |
| 5. Nguyên nhân | Lệch hợp đồng: giao diện gửi SĐT nguyên văn, CSDL lưu SĐT đã chuẩn hoá (QT-02); repository so khớp bằng `=` |
| 6. Cách sửa | `ticketService.listTickets` chuẩn hoá `q` bằng QT-02 trước khi tìm (mã phiếu: bỏ khoảng trắng, chữ hoa) |
| 7. Commit và xác nhận | sửa [47e2bc2](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/47e2bc2) · test [e1125cf](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/e1125cf): TC-29 FAIL trên mã trước khi sửa, PASS sau khi sửa |

### BUG-02 · Major – Lỗi trong controller async làm request treo
| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-02 · Major |
| 2. Phát hiện bởi | Chạy `npm run demo` lần đầu (Buổi 8), tình huống SĐT không hợp lệ |
| 3. Triệu chứng | Lời gọi không bao giờ trả về; terminal báo `UnhandledPromiseRejection` |
| 4. Cách tái lập | `POST /api/customers/lookup` với `{"phone":"09012"}` |
| 5. Nguyên nhân | Express 4 không tự chuyển Promise bị reject của hàm async tới middleware lỗi; lỗi nghiệp vụ ném trong controller không đi tới `errorHandler` |
| 6. Cách sửa | Bọc mọi controller bằng `wrap()` trong `api/routes/index.js` để `catch(next)` |
| 7. Commit và xác nhận | [7aebb38](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/7aebb38) · demo tình huống 2, 5, 8 trả 400 ngay |

### BUG-01 · Major – Mở chi tiết phiếu ra 404 vì mã phiếu có dấu “/”
| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-01 · Major |
| 2. Phát hiện bởi | Viết `npm run demo` (Buổi 8), gọi chi tiết phiếu vừa tạo |
| 3. Triệu chứng | `GET /api/tickets/BH-000003/2026` → 404 ROUTE_NOT_FOUND |
| 4. Cách tái lập | curl đường dẫn ở dòng 3 |
| 5. Nguyên nhân | Mã phiếu theo QT-A2 có dấu “/”, trùng ký tự phân tách đường dẫn URL nên router hiểu thành hai đoạn |
| 6. Cách sửa | Hợp đồng API quy định client gửi mã đã mã hoá `BH-000003%2F2026` (`encodeURIComponent`); ghi vào api-contract mục 1; giao diện dùng `tickets.api.js` mã hoá tự động |
| 7. Commit và xác nhận | [7aebb38](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/7aebb38) · `npm run e2e` bước 7, 9, 10 dùng mã đã mã hoá → 200 |
