# Nhật ký thay đổi thiết kế – Smart CRM · Luồng L2

> Ghi theo mẫu Buổi 8: mỗi thay đổi có mã TD-xx và đủ bốn dòng **phản hồi – quyết định – lý do – ảnh hưởng**.
> File được nối tiếp khi nhận phản hồi BT2, BT3.

## Buổi 12: hoàn thiện tích hợp – nộp Bài tập 2 (ngày 30/10/2026)

### TD-20 Đủ CRUD cho Khách hàng và Thiết bị; thêm màn hình M4 Khách hàng
- **Phản hồi của GV:** (tài liệu Buổi 12) “[SE] Đủ CRUD cho ≥ 2 thực thể (S1)”; “thêm ≥ 1 tính năng phụ nếu còn thời gian”.
- **Quyết định:** BỔ SUNG E9–E15: danh sách/chi tiết/sửa/xoá Khách hàng và Thiết bị, màn hình M4. Sửa dùng PATCH (chỉ gửi trường cần đổi) vì Nhân viên tiếp nhận chỉ thấy SĐT dạng che. Xoá chỉ Quản lý trung tâm bảo hành, và chỉ khi khách chưa có thiết bị / thiết bị chưa có phiếu. **Giữ** TD-07: phiếu bảo hành không có xoá.
- **Lý do:** Phiếu là chứng từ nên không xoá; khách hàng và thiết bị thì cần sửa khi nhập sai (họ tên, ngày mua) và xoá bản ghi tạo nhầm. Không cho sửa Serial/IMEI hay đổi chủ thiết bị để giữ QT-03 – nhập sai Serial thì ghi nhận thiết bị mới rồi xoá bản sai. Khách hàng không gắn trung tâm trong ERD BT1 nên danh sách khách dùng chung các trung tâm; phiếu vẫn lọc theo trung tâm (QT-14). Kiểm tra “đang được dùng” làm ở lớp nghiệp vụ để có thông báo rõ, và vẫn dựa vào khoá ngoại của CSDL cho trường hợp đồng thời (`23503` → `IN_USE` → 409).
- **Ảnh hưởng:** `customerService`, `deviceService`, hai repository, `customerController`, `deviceController`, `routes`, `validator` (idParam, updateCustomer, updateDevice, listCustomers), `data-access/errors.js`; `src/frontend/src/pages/M4-khach-hang`; `scripts/crud.js`; test TC-35…TC-42, TR-06…TR-08; `docs/api-contract.md` E9–E15. Không đổi bảng (vẫn 6 bảng).

## Buổi 11: tích hợp hệ thống và xử lý lỗi – chuẩn bị Bài tập 2 (ngày 28/10/2026)

### TD-17 Xử lý lỗi xuyên lớp: dịch ở lớp dữ liệu, ánh xạ HTTP ở MỘT middleware
- **Phản hồi của GV:** (bài giảng Buổi 11) “Mỗi lớp một trách nhiệm khi có lỗi”; năm kiểu xử lý lỗi sai.
- **Quyết định:** BỔ SUNG `data-access/errors.js` dịch lỗi pg → `DB_UNAVAILABLE` / `DUPLICATE_KEY` / `DB_ERROR`; `errorHandler` là nơi duy nhất ánh xạ lỗi → HTTP: lỗi nghiệp vụ giữ mã 4xx, CSDL không sẵn sàng → 503, lỗi khác → 500, cả hai trả `LOI_HE_THONG` + mã tra cứu; `pool.on('error')` và `connectionTimeoutMillis` để API không chết/treo khi CSDL khởi động lại.
- **Lý do:** Trước đây lỗi CSDL thành 500 chung chung, không truy vết được; API chết khi CSDL khởi động lại (BUG-09, BUG-10 – `docs/bug-log.md`). Lớp nghiệp vụ vẫn không biết HTTP; DeviceService nhận `DUPLICATE_KEY` thay vì mã 23505 của PostgreSQL.
- **Ảnh hưởng:** `data-access/db.js`, `data-access/errors.js`, `api/middlewares/errorHandler.js`, `business/services/deviceService.js`, `app.js` (`/health` kiểm CSDL); `docs/api-contract.md` mục 1 thêm 500/503.

### TD-18 Log JSON có requestId, không thêm thư viện
- **Phản hồi của GV:** (bài giảng Buổi 11) bốn mức log; ba thứ mọi dòng log phải có; thứ tuyệt đối không ghi.
- **Quyết định:** BỔ SUNG `logger.js` tự viết (≈ 40 dòng) thay vì cài pino: mỗi dòng một JSON (thời điểm +07:00, mức, logger, msg, ngữ cảnh), `LOG_LEVEL` từ môi trường, tự che khoá nhạy cảm (password, token, authorization, phone…); middleware `requestId` gắn mã cho mỗi request (header `X-Request-Id`).
- **Lý do:** Theo “bốn câu hỏi trước khi npm install”: nhu cầu nhỏ, không đáng thêm một phụ thuộc và cây phụ thuộc con. Log chỉ ghi ID (customerId, ticketCode, staffId), không ghi tên/SĐT (QT-15). Lỗi người dùng → INFO, lỗi hệ thống → ERROR một lần kèm ngăn xếp.
- **Ảnh hưởng:** `logger.js`, `api/middlewares/requestId.js`, controllers (INFO: tạo phiếu, xét duyệt, đăng nhập, tạo khách, ghi nhận thiết bị), `server.js`; `.env.example` thêm `LOG_LEVEL`.

### TD-19 Đóng gói bằng Docker Compose (db · api · web)
- **Phản hồi của GV:** (bài giảng Buổi 11) BT2 không bắt buộc Docker nhưng được đánh giá cao; BT3 bắt buộc ≤ 2 lệnh từ máy chưa cài gì.
- **Quyết định:** BỔ SUNG `src/backend/Dockerfile` (hai giai đoạn, `npm ci --omit=dev` theo lock, chạy bằng user `node`, HEALTHCHECK `/health`), `src/frontend/Dockerfile`, `docker-compose.yml` (postgres:16-alpine có healthcheck; api chờ `service_healthy`, khởi động bằng migrate → seed → server), `.dockerignore`. Giữ song song cách chạy bằng Node.js (README mục 3, Cách B).
- **Lý do:** Chặn cả năm khác biệt giữa hai máy (runtime, thư viện, .env, CSDL trống, đường dẫn). `DATABASE_URL` trong compose trỏ tới tên dịch vụ `db`; mật khẩu lấy từ `.env` (`DB_PASSWORD`, `JWT_SECRET`), không ghi cứng. CSDL không mở cổng ra máy để không đụng container `smartcrm-pg` đang dùng.
- **Ảnh hưởng:** tệp Docker mới; `scripts/seed-mau.js` đọc `SEED_DATA_DIR`; `.nvmrc`, `.gitattributes`; README mục 2–3.

## Sprint 2 – Buổi 10: module mở rộng và giao diện (ngày 23/10/2026)

Nguồn: tài liệu Buổi 10 (module mở rộng [SE]: frontend ≥ 3 màn hình gọi API thật, DataState, đăng nhập;
chạy end-to-end trên dữ liệu mẫu thật; “ghi nhận phần đã cắt và lý do trong mục điều chỉnh thiết kế”).

### TD-12 Thêm đăng nhập thật thay cho JWT phát từ script
- **Phản hồi của GV:** (tài liệu Buổi 10) [SE] “Đăng nhập; nhận 401 thì xoá token, về trang đăng nhập”.
- **Quyết định:** SỬA TD-08 – thêm `POST /api/auth/login` (AuthService) và migration 003 thêm MỘT cột `staff.password_hash`.
- **Lý do:** Giao diện cần đăng nhập để có JWT; mật khẩu băm bằng scrypt có sẵn trong Node.js (không thêm thư viện), so sánh thời gian hằng; sai tên hoặc sai mật khẩu trả cùng một thông báo để không lộ tài khoản nào tồn tại (NFR4). Vẫn 6 bảng như ERD BT1.
- **Ảnh hưởng:** `db/migrations/003_mat_khau_nhan_vien.sql`, `business/policies/passwordPolicy.js`, `business/services/authService.js`, `api/controllers/authController.js`; `npm run token` vẫn giữ cho Postman/curl. Mật khẩu mẫu ghi ở README mục 3 – chỉ dùng trên máy phát triển.

### TD-13 Giao diện viết bằng JavaScript ES modules, không dùng React
- **Phản hồi của GV:** (quyết định kỹ thuật khi hiện thực Sprint 2) – README frontend buổi 8 ghi “React SPA”.
- **Quyết định:** SỬA – 3 màn hình M1–M3 + trang đăng nhập viết bằng JavaScript ES modules chạy thẳng trên trình duyệt, không bước build, không thư viện ngoài.
- **Lý do:** Người chấm clone về chỉ cần `npm start` (không `npm install`, không Vite/webpack) → giảm rủi ro mục “clone thư mục mới và chạy theo README”. Cấu trúc vẫn tách lớp như React: `src/api/client.js` (nơi duy nhất gọi `fetch`), `src/api/*.api.js`, `src/components/DataState.js`, `src/pages/M1…M3`. Phạm vi giao diện nhỏ (3 màn hình) nên không cần framework.
- **Ảnh hưởng:** `src/frontend/` (README cập nhật); nhãn lớp ① trong `docs/architecture.drawio` và `docs/export/architecture.png` đổi từ “React SPA” thành “Giao diện web SPA (JavaScript ES modules)”; dòng Ràng buộc kỹ thuật trong `docs/srs.md` cập nhật. Thành phần và luồng gọi giữa các lớp không đổi.

### TD-14 Giao diện chạy máy chủ riêng (cổng 5173), backend bật CORS có danh sách trắng
- **Phản hồi của GV:** (tài liệu Buổi 10) “Xong khi: tắt backend → thấy thông báo lỗi có nút thử lại”; bảng lỗi tích hợp hay gặp: CORS, sai base URL.
- **Quyết định:** BỔ SUNG – `src/frontend/server.js` phục vụ tệp tĩnh ở cổng 5173; backend chỉ cho phép origin trong biến `FRONTEND_ORIGIN` (không dùng `*`).
- **Lý do:** Nếu backend vừa phục vụ giao diện vừa phục vụ API thì tắt backend là mất luôn giao diện, không kiểm được trạng thái lỗi. Base URL đặt một chỗ (`src/frontend/src/config.js`); mỗi lời gọi có thời hạn 10 giây → không treo.
- **Ảnh hưởng:** `api/middlewares/cors.js`, `config.js` (`FRONTEND_ORIGIN`, `JWT_EXPIRES_IN`), `.env.example`, README mục 3 (thêm cửa sổ terminal thứ ba).

### TD-15 Hiện thực E2, E3 và bổ sung danh sách thiết bị vào E1
- **Phản hồi của GV:** (kế hoạch buổi 8, mục 9) “E2 tạo khách hàng mới, E3 ghi nhận thiết bị” – cần cho M2 chạy end-to-end.
- **Quyết định:** BỔ SUNG `POST /api/customers` (E2) và `POST /api/devices` (E3: tra cứu theo Serial/IMEI, chưa có thì ghi nhận mới); E1 trả thêm mảng `devices` của khách hàng (thêm trường, không đổi trường cũ).
- **Lý do:** Wireframe M2 có nút “Tạo khách hàng mới” (UC04 – 3a) và ô Serial/IMEI “Tra cứu” (UC03, ngoại lệ 5a). Quy tắc mới đặt ở lớp ③: SĐT trùng sau chuẩn hoá → 409 `PHONE_EXISTS` (QT-01, QT-02); Serial/IMEI thuộc khách khác → 409 `DEVICE_OWNED_BY_OTHER` (QT-03); ngày mua không được ở tương lai.
- **Ảnh hưởng:** `customerService.createCustomer`, `deviceService.js`, `deviceController.js`, `validator.js`, `docs/api-contract.md` (E0, E2, E3 chuyển ✅).

### TD-16 Dữ liệu mẫu THẬT nạp qua lớp nghiệp vụ; ghi nhận phần đã cắt
- **Phản hồi của GV:** (tài liệu Buổi 10) “Đã chạy trên dữ liệu mẫu THẬT, không phải dữ liệu tự gõ vài dòng”; “ghi nhận phần đã cắt và lý do”.
- **Quyết định:** BỔ SUNG `npm run seed` nạp bộ CSV của học phần (`data/mau/`): 402 khách hàng thô, 302 đơn hàng (→ thiết bị, ngày mua = ngày đơn hàng), 120 mô tả sự cố thật (→ phiếu). **Cắt/hoãn:** (1) chỉ nạp phiếu cho 2 trung tâm có nhân viên mẫu (TT-CT01, TT-CT02), 60 phiếu mỗi trung tâm; (2) không có màn hình quản lý danh mục, tài khoản, đổi mật khẩu; (3) khung ④ của M2 không “xem trước” kết quả bảo hành – kết quả do backend tính khi lưu và hiện ở M3, tránh lặp quy tắc QT-04/QT-05 ở giao diện; (4) chưa có test giao diện tự động trong repo – kiểm bằng 5 test case thủ công (`docs/test-cases.md`).
- **Lý do:** Dữ liệu đi qua CustomerService, DeviceService, TicketService nên áp đúng quy tắc như khi nhập tay; 23 + 12 dòng có SĐT không chuẩn hoá được bị loại và được đếm; chạy lại không nhân đôi (khoá nghiệp vụ: SĐT, Serial/IMEI, thiết bị + mô tả). Phần cắt đều ngoài luồng chính hoặc ngoài User Story BT1.
- **Ảnh hưởng:** `scripts/seed-mau.js`, `data/mau/` (kèm README nguồn), README mục 3.

## Sau phản hồi Bài tập 1 (buổi 8, ngày 19/10/2026)

Điểm BT1: 9.5/10 (Đầy đủ 9.75 · Kỹ thuật 9.25 · Nhất quán 9.75 · Trình bày 7.5). Giảng viên không góp ý về
nội dung thiết kế (SRS, Use Case, kiến trúc, ERD, wireframe); các góp ý tập trung vào trình bày và cách dùng Git.

### TD-01 Rút gọn báo cáo BT1
- **Phản hồi của GV:** Bài dài 17 trang, gần gấp đôi mức gợi ý 6–9 trang; bảng tự kiểm 11 mục và một phần tiêu chí chấp nhận có thể chuyển sang repo.
- **Quyết định:** SỬA
- **Lý do:** Phần chuyển đi là phần trùng lặp hoặc phần tra cứu; giữ nguyên toàn bộ yêu cầu, sơ đồ và bảng truy vết trong PDF.
- **Ảnh hưởng:** PDF còn 13 trang (gồm bìa). Bảng tự kiểm → `docs/checklist-bt1.md`; đủ 9 tiêu chí GWT và bảng danh sách use case chỉ còn ở `docs/srs.md` (PDF trích 3 tiêu chí); bỏ bảng trách nhiệm lớp ở mục 3 PDF vì đã ghi trên `architecture.drawio`; DDL trong PDF bỏ chú thích, trình bày 2 cột.

### TD-02 Commit theo quy ước từ máy, không upload qua web
- **Phản hồi của GV:** Lịch sử Git chủ yếu “Add files via upload” và “Delete …”; nên commit từ máy theo quy ước docs(srs): …, docs(erd): …
- **Quyết định:** SỬA
- **Lý do:** Commit theo đơn vị công việc giúp truy được mỗi thay đổi thuộc yêu cầu nào; là tiêu chí 4 của rubric.
- **Ảnh hưởng:** Từ buổi 8 mọi thay đổi được commit bằng Git trên máy theo `<type>(<scope>): <mô tả>` (README mục 9). Lịch sử cũ giữ nguyên, không viết lại lịch sử đã đẩy lên.

### TD-03 Bỏ file khai báo AI trùng
- **Phản hồi của GV:** Repo có hai file khai báo AI trùng (`ai-declaration.md` và `ai-disclosure.md`).
- **Quyết định:** SỬA
- **Lý do:** Hai nguồn có thể lệch nhau; đề bài dùng tên `ai-disclosure.md`.
- **Ảnh hưởng:** Xóa `docs/ai-declaration.md`; README trỏ tới `docs/ai-disclosure.md`.

### TD-04 Link GitHub đầy đủ trên bìa
- **Phản hồi của GV:** Link trên bìa nên ghi đầy đủ `https://`.
- **Quyết định:** SỬA
- **Lý do:** Một số trình đọc PDF không nhận dạng link thiếu giao thức.
- **Ảnh hưởng:** Bìa PDF ghi `https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2`, bấm được.

### TD-05 Hiện thực SlaPolicy đọc sla.config.json và kiểm thử AC5.1, AC5.2, NFR2
- **Phản hồi của GV (gợi ý BT2):** Hiện thực SlaPolicy đọc `sla.config.json`, viết test cho AC5.1, AC5.2 (bỏ Chủ nhật) và test 1.000 yêu cầu tạo phiếu đồng thời cho NFR2.
- **Quyết định:** SỬA (làm ngay trong Sprint 1)
- **Lý do:** Đây là logic nghiệp vụ cốt lõi của L2 và là căn cứ của lập luận kiến trúc số 1 (NFR6) và số 5 (NFR2).
- **Ảnh hưởng:** `src/backend/config/sla.config.json`; `src/backend/src/business/policies/slaPolicy.js`; `tests/backend/slaPolicy.test.js` (AC5.1, AC5.2, NFR6); `src/backend/scripts/nfr2-concurrency.js`. Thiết kế không đổi.

### TD-06 Giữ nguyên ERD 6 bảng và kiến trúc 4 lớp
- **Phản hồi của GV:** Không có góp ý về ERD và kiến trúc (ERD 6 bảng, 7 FK, DDL chạy được; kiến trúc có trách nhiệm, giao thức, ngoài phạm vi).
- **Quyết định:** GIỮ NGUYÊN
- **Lý do:** Thiết kế đã đáp ứng FR1–FR8; đổi thiết kế lúc này chỉ làm lệch bảng truy vết.
- **Ảnh hưởng:** Migration `001_tao_bang_theo_ddl_bt1.sql` chép nguyên văn `db/schema.sql`, chỉ thêm `IF NOT EXISTS`. Thư mục `src/backend/src/` ánh xạ 1–1 với các lớp ②③④ trong `architecture.drawio` (README mục 4).

### TD-07 “Cập nhật” phiếu chỉ qua xét duyệt; không có xóa phiếu
- **Phản hồi của GV:** (quyết định khi hiện thực CRUD theo yêu cầu Buổi 8)
- **Quyết định:** GIỮ NGUYÊN phạm vi đã đặc tả
- **Lý do:** SRS mục 1.1 xếp “Sửa nội dung hoặc xóa phiếu sau khi tạo” vào WON'T; trạng thái phiếu chỉ đổi qua UC07 và luôn ghi lịch sử (QT-06).
- **Ảnh hưởng:** CRUD phiếu bảo hành = Tạo (E5), Đọc danh sách / chi tiết (E6, E7), Cập nhật trạng thái qua xét duyệt (E8). Không có endpoint DELETE.

### TD-08 Xác thực tạm bằng JWT phát từ script
- **Phản hồi của GV:** (quyết định khi hiện thực)
- **Quyết định:** BỔ SUNG chi tiết hiện thực, không đổi thiết kế
- **Lý do:** Đăng nhập và quản lý tài khoản thuộc WON'T, nhưng NFR4 vẫn yêu cầu 401/403 đúng vai trò và trung tâm.
- **Ảnh hưởng:** `scripts/make-token.js` phát JWT cho nhân viên mẫu (`nv01`, `ql01`, `nv02`); AuthMiddleware kiểm JWT, vai trò; service kiểm lại trung tâm. Mã phiếu chứa “/” nên trong URL gửi dạng `BH-000001%2F2026` (đã ghi vào `api-contract.md`).

### TD-09 Mã trung tâm theo bộ dữ liệu mẫu; chưa thêm bảng service_center
- **Phản hồi của GV:** (Buổi 8 yêu cầu nạp dữ liệu danh mục từ bộ mẫu: service_centers, issue_categories, technicians)
- **Quyết định:** SỬA mã trung tâm · GIỮ NGUYÊN việc không thêm bảng
- **Lý do:** Bộ mẫu Mekong Mobile dùng mã `TT-CT01`, `TT-CT02`…; bản BT1 dùng mã minh họa `TT-Q1` không khớp case study. Danh mục trung tâm và kỹ thuật viên thuộc phạm vi WON'T của L2 (L4 phân công kỹ thuật viên), L2 chỉ cần mã trung tâm để phân quyền (QT-14), nên chưa thêm bảng thứ 7.
- **Ảnh hưởng:** `002_du_lieu_mau.sql` (nhân viên ở TT-CT01, TT-CT02), wireframe M1–M3 và Bảng thuật ngữ BT1 đổi ví dụ sang `TT-CT01`. `issue_category` nạp đủ 6 nhóm như bộ mẫu nhưng giữ mức ưu tiên mặc định theo QT-A1 của em. Nếu BT2 cần tên trung tâm trên giao diện sẽ thêm bảng `service_center` + khóa ngoại và ghi TD mới.

### TD-10 Tách composition root để test lớp nghiệp vụ không cần CSDL
- **Phản hồi của GV:** (chuẩn bị cho BT2 – test plan, test report)
- **Quyết định:** BỔ SUNG chi tiết hiện thực, không đổi kiến trúc 4 lớp
- **Lý do:** Service nhận repository qua hàm khởi tạo nên viết được unit test với repository giả cho đủ ba loại: luồng đúng, giá trị biên, dữ liệu sai; `npm test` chạy được ngay sau khi clone, không cần `npm install` hay PostgreSQL.
- **Ảnh hưởng:** `src/backend/src/container.js` (nơi duy nhất nối service với repository thật); `ticketService`, `customerService`, `categoryService` đổi sang dạng `createXxxService({...})`; thêm `tests/backend/ticketService.test.js` (TC-01…TC-16) và `validator.test.js` (TC-17…TC-20). Phép thử ranh giới lớp: `grep -rn "req\.\|res\.\|SELECT" src/backend/src/business/` phải rỗng.

### TD-11 Chạy PostgreSQL 16 bằng Docker trên máy phát triển
- **Phản hồi của GV:** (phát sinh khi chạy Sprint 1 trên máy cá nhân – máy chưa cài PostgreSQL)
- **Quyết định:** BỔ SUNG cách chạy CSDL bằng container `postgres:16` (Docker Desktop), giữ nguyên PostgreSQL 16 và DDL của BT1
- **Lý do:** Một lệnh `docker run` tạo sẵn database `smartcrm`, cùng phiên bản PostgreSQL 16 như thiết kế, không phải cài đặt và cấu hình dịch vụ trên Windows; xóa container là làm sạch dữ liệu, thuận tiện chạy lại migrate và NFR2. Ứng dụng chỉ đọc `DATABASE_URL` nên không phải sửa mã (NFR6).
- **Ảnh hưởng:** README mục 2 và mục 3 (thêm Cách A – Docker); `.env` dùng `postgres://postgres:123456@localhost:5432/smartcrm` trên máy phát triển. Không đổi mã nguồn, migration hay kiến trúc 4 lớp.

## Trước Bài tập 1 – thay đổi so với bài Buổi 2 và Buổi 4

| Nội dung | Bản trước | Bản BT1 và lý do |
|---|---|---|
| Số User Story | Buổi 4: 8 story (US1–US8) | Còn 7 story đúng yêu cầu 5–7: gộp “chuẩn hoá số điện thoại” vào quy tắc QT-02 (không phải mục tiêu của người dùng); thêm US2 tạo khách hàng mới; gộp “xem kết quả bảo hành”, “xem mã phiếu” vào tiêu chí chấp nhận của US4. |
| Mã yêu cầu | FR-01…FR-08, NFR-01…NFR-05, UC-01…UC-10 | Đổi sang FR1…, NFR1…, UC01… theo đúng định dạng đề bài; FR viết lại dạng kiểm chứng được. |
| Use case | 10 use case; UC-08/UC-09 tách “xem danh sách chờ”, “từ chối” | 8 use case: gộp phê duyệt và từ chối thành UC07 Xét duyệt; bỏ “Kiểm tra điều kiện bảo hành” vì là bước hệ thống, không phải mục tiêu của actor (lỗi 4); chú thích sơ đồ chỉ còn ký hiệu thực sự dùng. |
| Trạng thái “Cần bổ sung” | Có ở UC-09 | Bỏ: quản lý luôn ra quyết định Chấp nhận / Không chấp nhận, phiếu chuyển “Mới” – tránh vòng lặp ngoài phạm vi L2. |
| NFR | 5 NFR, NFR-04 trùng với quy tắc | 6 NFR đều có ngưỡng số và cách đo; thêm NFR6 (bảo trì) để làm căn cứ lập luận kiến trúc. |
| Bảng dữ liệu | Buổi 2 dự kiến: ticket, customer, device, issue_category, ticket_status_log | Thêm staff để lưu người tiếp nhận, người xét duyệt và phân quyền theo trung tâm (NFR4); vẫn trong giới hạn 6 bảng. |
| Báo cáo Buổi 4 | Ghi nhầm người thực hiện và số liệu (11 story, 11 FR) | Đã sửa, số liệu trong tài liệu này thống nhất với repo. |
