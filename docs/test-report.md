# Test Report – Smart CRM · Luồng L2 (Bài tập 3)

Sinh viên: Nguyễn Hoàng Tuấn – MSSV 2374802010542 · track SE · Kế hoạch: `docs/test-plan.md` · Lỗi: `docs/bug-log.md`

## 1. Tổng hợp lần chạy
- **Lần 1 và lần 2 (Buổi 14):** Windows 11 + Git Bash · Node.js 20 · PostgreSQL 16 (Docker). CSDL dựng mới (`npm run migrate` + `npm run seed`: 667 khách hàng, 293 thiết bị, 122 phiếu), rồi chạy **lần 1 → sửa bug → lần 2** trên cùng CSDL, nên số đếm của lần 2 nối tiếp lần 1. Cột "Kết quả thực tế" ở mục 2 là của lần 2.
- **Lần 3 (Bài tập 3):** trong container, theo đúng phép thử máy trắng. Clone tag `v1.0` vào thư mục trống → `cp .env.example .env` → `docker compose up -d --build` → chạy các lệnh trong `api` bằng `docker compose exec -T api …`.

| Lần chạy | Mã nguồn | Lệnh (trong `src/backend`) | Kết quả | Ảnh |
|---|---|---|---|---|
| Lần 1 | commit `test(system): 12 test case hệ thống…` – trước khi sửa | `npm run st` | **9/12 PASS · FAIL: ST-08, ST-09, ST-11** | `docs/screenshots/ST-lan1.png` |
| Lần 2 | sau commit sửa BUG-11, BUG-12, BUG-13 | `npm run st` | **12/12 PASS** | `docs/screenshots/ST-01.png` … `ST-12.png` |
| Lần 2 | như trên | `npm test` | **61/61 PASS** (57 của BT2 + TC-43…TC-46) | `docs/screenshots/npm-test.png` |
| Lần 2 | như trên | `npm run test:repo` · `npm run e2e` · `npm run crud` | 8/8 · 10/10 bước · 17/17 bước | `docs/screenshots/tich-hop.png` |
| Lần 3 | tag `v1.0`, trong container (máy trắng) | `docker compose exec -T api npm test` | <!-- ĐIỀN: 64/64 PASS --> | `docs/screenshots/bt3-npm-test.png` |
| Lần 3 | như trên | `docker compose exec -T api npm run st` | <!-- ĐIỀN: 12/12 PASS --> | `docs/screenshots/bt3-st.png` |
| Lần 3 | như trên | `… npm run test:repo` · `… npm run e2e` · `… npm run crud` | <!-- ĐIỀN: 8/8 · 10/10 bước · 17/17 bước --> | `docs/screenshots/bt3-tich-hop.png` |

Trước khi sửa BUG-14, lần 3 **không chạy được**: trên mã của Buổi 14, `docker compose exec -T api npm test` báo không tìm thấy tệp test, và `npm run st` dừng vì không có `.env` (ảnh `BUG-14-truoc.png`). Ba FAIL của lần 1 được ghi trung thực, gỡ theo bốn bước và ghi `docs/bug-log.md` ngay khi gặp: ST-11 → **BUG-11 (Critical)**, ST-08 → **BUG-12**, ST-09 → **BUG-13**; mỗi bug một commit `fix(…): … (BUG-xx)`. Chạy lại một test case bất kỳ: `npm run st -- ST-xx`.

## 2. 12 test case hệ thống (`npm run st`, kết quả thực tế của lần chạy)
Đủ tám cột theo đề BT3 (mã · tiền điều kiện · các bước · dữ liệu thử · kết quả mong đợi · mức ưu tiên · kết quả thực tế · PASS/FAIL), thêm truy vết về use case / quy tắc. Năm loại: luồng đúng 2 · giá trị biên 3 (ST-03 / ST-04 hai bên ranh giới) · dữ liệu sai 4 · bảo mật 2 · tái lập 1. Mỗi test case tự tạo khách hàng, thiết bị mới làm tiền điều kiện; SĐT và Serial thay đổi theo lần chạy (xem ảnh).

| Mã · loại · truy vết | Tiền điều kiện | Các bước | Dữ liệu thử | Kết quả mong đợi | Ưu tiên | Kết quả thực tế | PASS/FAIL · ảnh |
|---|---|---|---|---|---|---|---|
| ST-01 · Luồng đúng — Tạo phiếu cho thiết bị còn bảo hành (UC04 · QT-05 · QT-A1 · QT-15) | Khách hàng mới (SĐT 09…) · thiết bị mới mua 30 ngày trước, BH 12 tháng · đăng nhập `nv01` | `POST /api/tickets` {customerId, deviceId, issueDesc, categoryCode: PIN}, không gửi priority | categoryCode `PIN`, issueDesc “Pin tụt nhanh, máy nóng khi sạc”, không có priority; ngày mua = hôm nay − 30 ngày, BH 12 tháng | 201 · MOI · CON_BAO_HANH · ưu tiên TRUNG_BINH (mặc định nhóm PIN) · SĐT che `09x****xxx` · ticket +1 · log +1 | Cao | 201 · MOI · CON_BAO_HANH · TRUNG_BINH · BH-000138/2026 · SĐT `098****201` · ticket 135 → 136 (+1) · log 138 → 139 (+1) | PASS · `ST-01.png` |
| ST-02 · Luồng đúng — Thiếu ngày mua → Chờ xác minh → Quản lý chấp nhận (UC04-8a · UC07 · QT-06) | Khách hàng mới · thiết bị mới KHÔNG có ngày mua | 1. `nv01`: `POST /api/tickets` · 2. `ql01`: `POST /api/tickets/{mã}/review` {CHAP_NHAN, note} | thiết bị không có `purchaseDate`; review `{decision: CHAP_NHAN, note: "Khách gửi tin nhắn xác nhận đơn hàng"}` bằng `ql01` | B1: 201 CHO_XAC_MINH / CHUA_XAC_MINH · B2: 200 MOI / CON_BAO_HANH, lịch sử 2 dòng · ticket +1 · log +2 | Cao | B1: 201 CHO_XAC_MINH / CHUA_XAC_MINH · B2: 200 MOI / CON_BAO_HANH, lịch sử 2 dòng · ticket 136 → 137 (+1) · log 139 → 141 (+2) | PASS · `ST-02.png` |
| ST-03 · Giá trị biên — Tiếp nhận ĐÚNG ngày hết hạn bảo hành → còn bảo hành (QT-05, phía trong ranh giới) | Thiết bị mua **đúng ngày này năm trước**, BH 12 tháng → hết hạn = hôm nay | `POST /api/tickets` hôm nay | ngày mua = hôm nay năm trước, BH 12 tháng (hết hạn = hôm nay) | 201 · CON_BAO_HANH · MOI | Cao | 201 · CON_BAO_HANH · MOI · BH-000140/2026 | PASS · `ST-03.png` |
| ST-04 · Giá trị biên — Tiếp nhận sau hạn 1 ngày → hết bảo hành (QT-05, phía ngoài ranh giới) | Thiết bị mua **ngày này năm trước trừ 1 ngày** → hết hạn = hôm qua | `POST /api/tickets` hôm nay | ngày mua = hôm nay năm trước − 1 ngày, BH 12 tháng (hết hạn = hôm qua) | 201 · HET_BAO_HANH · phiếu vẫn MOI | Cao | 201 · HET_BAO_HANH · MOI · BH-000141/2026 | PASS · `ST-04.png` |
| ST-05 · Giá trị biên — Mô tả lỗi 5.000 ký tự nhận, 5.001 ký tự từ chối (api-contract E7) | Khách hàng, thiết bị mới | 1. `POST /api/tickets` issueDesc 5.000 ký tự · 2. issueDesc 5.001 ký tự | issueDesc = `"a"` × 5.000 và `"a"` × 5.001 | B1: 201 · B2: 400 VALIDATION_ERROR [issueDesc] · ticket +1 (chỉ B1) | Trung bình | B1: 201 · B2: 400 VALIDATION_ERROR [issueDesc] · ticket 139 → 140 (+1) | PASS · `ST-05.png` |
| ST-06 · Dữ liệu sai — Trường bắt buộc trống, sai enum → 400 nêu rõ trường, không ghi gì (UC04-10a) | Khách hàng, thiết bị hợp lệ | `POST /api/tickets` {issueDesc: "   ", categoryCode: "LOA"} | issueDesc `"   "` (chỉ khoảng trắng), categoryCode `"LOA"` (không có trong danh mục) | 400 VALIDATION_ERROR [issueDesc, categoryCode] · ticket +0 · log +0 | Cao | 400 VALIDATION_ERROR [issueDesc, categoryCode] · ticket 140 → 140 (+0) · log 144 → 144 (+0) | PASS · `ST-06.png` |
| ST-07 · Dữ liệu sai — Id / mã không tồn tại → 404, không phải 500 | Không có khách id 2147483647, 999999; không có phiếu BH-999999/2099 | 1. `POST /api/tickets` customerId 2147483647 · 2. `GET /api/customers/999999` · 3. `GET /api/tickets/BH-999999%2F2099` | customerId `2147483647`; id `999999`; mã `BH-999999/2099` | B1: 404 CUSTOMER_NOT_FOUND · B2: 404 CUSTOMER_NOT_FOUND · B3: 404 TICKET_NOT_FOUND · ticket +0 | Trung bình | B1: 404 CUSTOMER_NOT_FOUND · B2: 404 CUSTOMER_NOT_FOUND · B3: 404 TICKET_NOT_FOUND · ticket 140 → 140 (+0) | PASS · `ST-07.png` |
| ST-08 · Dữ liệu sai — Tham số `q` dạng mảng / đối tượng → 400, không phải 500 | Đăng nhập `nv01` | 1. `GET /api/tickets?q=0901234567&q=BH-000001` · 2. `GET /api/tickets?q[x]=1` | `?q=0901234567&q=BH-000001` (mảng); `?q[x]=1` (đối tượng) | B1: 400 VALIDATION_ERROR [q] · B2: 400 VALIDATION_ERROR [q] | Trung bình | **Lần 1: B1 500 LOI_HE_THONG · B2 500 LOI_HE_THONG → FAIL → BUG-12.** Lần 2: B1 400 VALIDATION_ERROR [q] · B2 400 VALIDATION_ERROR [q] | Lần 1 FAIL · lần 2 PASS · `ST-08.png` |
| ST-09 · Dữ liệu sai — Body lớn hơn 100 KB → 413, không phải 500 | Đăng nhập `nv01`; giới hạn body JSON 100 KB | `POST /api/customers` fullName 120.000 ký tự (≈ 117 KB) | fullName = `"a"` × 120.000 (≈ 117 KB > 100 KB) | 413 PAYLOAD_TOO_LARGE · customer +0 | Thấp | **Lần 1: 500 LOI_HE_THONG · customer 673 → 673 (+0) → FAIL → BUG-13.** Lần 2: 413 PAYLOAD_TOO_LARGE · customer 687 → 687 (+0) | Lần 1 FAIL · lần 2 PASS · `ST-09.png` |
| ST-10 · Bảo mật — Thiếu / giả token → 401; khác trung tâm, sai vai trò → 403 (QT-14, NFR4) | `nv01` (TT-CT01) vừa tạo một phiếu; `nv02` thuộc TT-CT02 | 1. `GET /api/tickets` không token · 2. token giả alg "none" · 3. `nv02` xem phiếu của TT-CT01 · 4. `nv01` `DELETE /api/customers/{id}` | không header Authorization; JWT tự ký `alg: "none"`; token `nv02` (TT-CT02); token `nv01` gọi DELETE | B1: 401 · B2: 401 · B3: 403 FORBIDDEN · B4: 403 FORBIDDEN · customer +0 | Cao | B1: 401 UNAUTHORIZED · B2: 401 UNAUTHORIZED · B3: 403 FORBIDDEN (phiếu BH-000143/2026) · B4: 403 FORBIDDEN · customer 688 → 688 (+0) | PASS · `ST-10.png` |
| ST-11 · Bảo mật — Không có mật khẩu / chuỗi kết nối có mật khẩu trong tài liệu repo (phản hồi BT2) | Quét 19 tệp đã commit: README, `docs/**/*.md`, `docker-compose.yml`, `.env.example` | Tìm `postgres://user:<mật_khẩu>@` và biến POSTGRES_PASSWORD / DB_PASSWORD được gán giá trị (bỏ qua `${BIẾN}` và giá trị mẫu của `.env.example`) | 19 tệp tài liệu / cấu hình đã commit của repo | 0 vị trí lộ mật khẩu | Cao | **Lần 1: 4 vị trí – README.md:34, .env.example:4, .env.example:6, docs/thay-doi-thiet-ke.md:138 → FAIL → BUG-11.** Lần 2: 0 vị trí | Lần 1 FAIL · lần 2 PASS · `ST-11.png` |
| ST-12 · Tái lập — Chạy lại migrate + seed → không lỗi, không nhân đôi (C5) | CSDL đã migrate + seed | Chạy lại `scripts/migrate.js` rồi `scripts/seed-mau.js`; đếm 6 bảng trước/sau | CSDL đã có dữ liệu mẫu + dữ liệu của ST-01…ST-11 | migrate mã thoát 0, bỏ qua 3 migration · seed mã thoát 0 · 6 bảng +0 | Cao | migrate thoát 0, bỏ qua 3 · seed thoát 0 · customer +0 · device +0 · ticket +0 · ticket_status_log +0 · issue_category +0 · staff +0 | PASS · `ST-12.png` |

## 3. Test hồi quy cho bug của Buổi 14 – 16 (`npm test`, không cần CSDL)
| Mã | Tệp | Hành vi được kiểm | Loại | Trên mã cũ | Sau khi sửa |
|---|---|---|---|---|---|
| TC-43 | `buoi14.test.js` | `q` dạng mảng `['0901234567','BH-000001']` hoặc đối tượng `{x:'1'}` → 400 VALIDATION_ERROR [q] (BUG-12) | Dữ liệu sai | FAIL | PASS |
| TC-44 | `buoi14.test.js` | `q` 100 ký tự được nhận, 101 ký tự bị từ chối (BUG-12) | Biên | FAIL | PASS |
| TC-45 | `buoi14.test.js` | lỗi `entity.too.large` → 413 PAYLOAD_TOO_LARGE, đúng một dòng log mức INFO (BUG-13) | Dữ liệu sai | FAIL | PASS |
| TC-46 | `buoi14.test.js` | quét README, `docs/**/*.md`, `docker-compose.yml`, `.env.example`: không có mật khẩu (BUG-11) | Bảo mật | FAIL (4 vị trí) | PASS |
| TC-47 | `buoi16.test.js` | `load-env` đọc `.env` như `--env-file`: bỏ chú thích, dòng trống, dấu nháy, CRLF (BUG-14) | Luồng đúng | FAIL (chưa có `load-env`) | PASS |
| TC-48 | `buoi16.test.js` | không có `.env` thì không lỗi; biến do docker compose truyền vào không bị ghi đè (BUG-14) | Biên | FAIL | PASS |
| TC-49 | `buoi16.test.js` | không script npm nào dùng `--env-file`; `.dockerignore` loại `.env` nhưng không loại `tests/`; trong container có đủ `tests/`, `data/mau`, `docs/` và KHÔNG có `.env` (BUG-14) | Tái lập / bảo mật | FAIL (`.dockerignore` loại `tests`) | PASS |

## 4. Phụ lục – chi tiết test tự động (từ Bài tập 2, vẫn chạy trong `npm test`)

### A. Unit test (`npm test`) – 57 test của BT2
| Mã | Tệp | Hành vi được kiểm (tên test) | Loại | Kết quả |
|---|---|---|---|---|
| TC-01 | `ticketService.test.js` | tạo phiếu còn bảo hành: trạng thái Mới, mã BH-000007/2026, 1 dòng lịch sử | Luồng đúng | PASS |
| TC-02 | `ticketService.test.js` | bỏ trống mức ưu tiên → lấy mức mặc định của nhóm sự cố (QT-A1) | Luồng đúng | PASS |
| TC-03 | `ticketService.test.js` | quản lý chấp nhận bảo hành → Mới + Còn bảo hành, lịch sử ghi người và ghi chú | Luồng đúng | PASS |
| TC-04 | `ticketService.test.js` | danh sách luôn lọc theo trung tâm của người dùng, trang 2 bỏ qua 20 dòng | Luồng đúng | PASS |
| TC-05 | `ticketService.test.js` | tiếp nhận đúng ngày cuối cùng của hạn bảo hành (23:30) → vẫn Còn bảo hành | Biên | PASS |
| TC-06 | `ticketService.test.js` | tiếp nhận ngày kế tiếp sau hạn (00:10) → Hết bảo hành, phiếu vẫn ở trạng thái Mới | Biên | PASS |
| TC-07 | `ticketService.test.js` | thiết bị không có ngày mua → Chờ xác minh bảo hành (UC04 – 8a) | Biên | PASS |
| TC-08 | `ticketService.test.js` | số trang 0 hoặc không phải số → về trang 1 | Biên | PASS |
| TC-09 | `ticketService.test.js` | thiết bị không thuộc khách hàng → 409, không ghi gì vào CSDL | Dữ liệu sai | PASS |
| TC-10 | `ticketService.test.js` | nhóm sự cố đã ngừng sử dụng → 400 CATEGORY_INACTIVE (UC04 – 6a) | Dữ liệu sai | PASS |
| TC-11 | `ticketService.test.js` | khách hàng / thiết bị không tồn tại → 404 | Dữ liệu sai | PASS |
| TC-12 | `ticketService.test.js` | lỗi khi ghi lịch sử → cả giao dịch hủy, không có phiếu lưu dở (NFR5) | Dữ liệu sai | PASS |
| TC-13 | `ticketService.test.js` | xét duyệt với ghi chú chỉ có khoảng trắng → 400 NOTE_REQUIRED (UC07 – 5a) | Dữ liệu sai | PASS |
| TC-14 | `ticketService.test.js` | xét duyệt phiếu đã ở trạng thái Mới → 409 ALREADY_REVIEWED, không ghi đè (UC07 – 6a) | Dữ liệu sai | PASS |
| TC-15 | `ticketService.test.js` | phiếu thuộc trung tâm khác → 403 khi xem và khi xét duyệt (QT-14) | Dữ liệu sai | PASS |
| TC-16 | `ticketService.test.js` | nhân viên tiếp nhận gọi xét duyệt → 403 (UC07 – 6b) | Dữ liệu sai | PASS |
| TC-17 | `validator.test.js` | body tạo phiếu hợp lệ (bỏ trống priority) → không lỗi | Luồng đúng | PASS |
| TC-18 | `validator.test.js` | sai kiểu và sai enum → liệt kê đúng các trường lỗi | Dữ liệu sai | PASS |
| TC-19 | `validator.test.js` | biên độ dài mô tả lỗi: 5.000 ký tự đạt, 5.001 ký tự lỗi | Biên | PASS |
| TC-20 | `validator.test.js` | bộ lọc danh sách: ngày sai định dạng và trạng thái lạ bị từ chối | Dữ liệu sai | PASS |
| TC-26 | `validator.test.js` | ngày không có thật (30/02, 31/04) bị từ chối ở bộ lọc và ngày mua – không để CSDL báo lỗi 500 (BUG-06) | Dữ liệu sai | PASS |
| TC-27 | `validator.test.js` | số vượt giới hạn: page > 10.000, customerId/deviceId > 2.147.483.647 → 400 thay vì 500 (BUG-07) | Biên | PASS |
| TC-21 | `buoi10.test.js` | đăng nhập đúng: tên có chữ hoa và khoảng trắng vẫn nhận, trả JWT và hồ sơ, không lộ password_hash | Luồng đúng | PASS |
| TC-22 | `buoi10.test.js` | ngày mua: đúng HÔM NAY được ghi nhận, NGÀY MAI bị từ chối PURCHASE_DATE_IN_FUTURE | Biên | PASS |
| TC-23 | `buoi10.test.js` | sai mật khẩu và tài khoản không tồn tại trả CÙNG lỗi 401 – không lộ tên đăng nhập nào có thật | Dữ liệu sai | PASS |
| TC-24 | `buoi10.test.js` | Serial/IMEI đã thuộc khách hàng khác → 409 DEVICE_OWNED_BY_OTHER, không ghi thiết bị (UC04 – 5a) | Dữ liệu sai | PASS |
| TC-25 | `buoi10.test.js` | tạo khách hàng: SĐT "+84 911 222 333" trùng hồ sơ 0911222333 → 409 PHONE_EXISTS; SĐT sai → 400 | Dữ liệu sai | PASS |
| TC-28 | `buoi11.test.js` | mở giao diện bằng http://127.0.0.1:5173 vẫn gọi được API; origin lạ không được cấp quyền (BUG-08) | Dữ liệu sai | PASS |
| TC-29 | `buoi11.test.js` | tìm phiếu theo SĐT gõ có khoảng trắng/+84 vẫn khớp SĐT đã chuẩn hoá trong CSDL (BUG-03) | Luồng đúng | PASS |
| TC-30 | `buoi11.test.js` | CSDL mất kết nối → 503 LOI_HE_THONG kèm mã tra cứu; đúng MỘT dòng ERROR có requestId, không lộ SĐT trong query (BUG-09) | Lỗi hạ tầng | PASS |
| TC-31 | `buoi11.test.js` | lỗi nghiệp vụ (409) ghi mức INFO, không ghi ERROR; lỗi lạ không rõ nguồn → 500 | Dữ liệu sai | PASS |
| TC-32 | `buoi11.test.js` | logger: có thời điểm +07:00, mức, ngữ cảnh; tự che mật khẩu, token, SĐT; tôn trọng LOG_LEVEL | Luồng đúng | PASS |
| TC-33 | `buoi11.test.js` | dịch lỗi pg ở lớp dữ liệu: mất kết nối → DB_UNAVAILABLE, trùng khoá 23505 → DUPLICATE_KEY, còn lại → DB_ERROR | Lỗi hạ tầng | PASS |
| TC-34 | `buoi11.test.js` | pool phát sự kiện error (CSDL khởi động lại) → API KHÔNG chết, chỉ ghi WARN (BUG-10) | Lỗi hạ tầng | PASS |
| TC-35 | `buoi12.test.js` | sửa khách hàng: SĐT "+84 912 000 111" được chuẩn hoá trước khi lưu, họ tên bỏ khoảng trắng thừa | Luồng đúng | PASS |
| TC-36 | `buoi12.test.js` | danh sách khách: ô tìm là SĐT thì tìm theo SĐT đã chuẩn hoá, là chữ thì tìm theo họ tên; trang 2 bỏ qua 20 dòng | Luồng đúng | PASS |
| TC-37 | `buoi12.test.js` | giữ nguyên SĐT của chính mình không bị coi là trùng; số tháng bảo hành 0 và 60 hợp lệ, 61 bị từ chối | Biên | PASS |
| TC-38 | `buoi12.test.js` | sửa ngày mua: hôm nay được, ngày mai bị từ chối; chuỗi rỗng = xoá ngày mua (thiết bị thành chưa xác minh) | Biên | PASS |
| TC-39 | `buoi12.test.js` | đổi SĐT sang số đã thuộc khách khác → 409 PHONE_EXISTS, không ghi gì (QT-01) | Dữ liệu sai | PASS |
| TC-40 | `buoi12.test.js` | xoá khách đã có thiết bị → 409 CUSTOMER_IN_USE; xoá thiết bị đã có phiếu → 409 DEVICE_IN_USE; không xoá gì | Dữ liệu sai | PASS |
| TC-41 | `buoi12.test.js` | validator: PATCH rỗng, sửa Serial/IMEI hoặc đổi chủ thiết bị, id không phải số đều bị từ chối 400 | Dữ liệu sai | PASS |
| TC-42 | `buoi12.test.js` | khoá ngoại bị vi phạm lúc xoá (có người vừa tạo phiếu) → 409, không phải 500 | Lỗi đồng thời | PASS |
| AC, QT | `slaPolicy`, `warrantyPolicy`, `phonePolicy` | 15 test: AC1.1 – "+84 901 234 567" → 0901234567; Dạng 84…, dấu chấm, gạch nối đều chuẩn hoá được; AC1.3 – "09012" không hợp lệ; QT-15 – che 4 chữ số giữa; AC5.1 – Trung bình, tiếp nhận thứ Sáu 02/10/2026 10:00 → hạn 06/10/2026 10:00 (bỏ Chủ nhật); AC5.2 – đổi sang Cao → hạn 03/10/2026 10:00 (thứ Bảy vẫn là ngày làm việc); Thấp 120 giờ từ thứ Sáu 13:40 → thứ Năm 08/10/2026 13:40; Tiếp nhận thứ Bảy 20:00, Cao → Chủ nhật không tính → thứ Hai 20:00; NFR6 – đổi ngưỡng bằng cấu hình, không sửa code; Mức ưu tiên không hợp lệ → báo lỗi; AC4.1 – mua 15/03/2026, 12 tháng → Còn bảo hành; AC4.2 – không có ngày mua → Chưa xác minh; Mua 10/01/2024, 12 tháng → Hết bảo hành; Ngày cuối cùng còn bảo hành vẫn tính là còn (≤); Cộng tháng giữ ngày cuối tháng hợp lệ (31/01 + 1 tháng → 28/02) | Đúng / biên / sai | PASS |

### B. Test repository (`npm run test:repo`, CSDL thật, mỗi test BEGIN … ROLLBACK)
| Mã | Hành vi được kiểm | Liên quan | Kết quả |
|---|---|---|---|
| TR-01 | insert khách rồi findByPhone trả đúng dòng; SĐT trùng bị UNIQUE chặn | QT-01 | PASS |
| TR-02 | ngày mua trả `YYYY-MM-DD` không lệch múi giờ; NULL giữ nguyên; findByCustomer đủ thiết bị | QT-05 | PASS |
| TR-03 | nextSequenceNumber hai lần cho hai số tăng dần, không trùng | QT-A2, NFR2 | PASS |
| TR-04 | search chỉ trả phiếu của trung tâm được hỏi, ≤ 20 dòng/trang, mới nhất trước | QT-14, NFR3 | PASS |
| TR-05 | withTransaction: lỗi sau INSERT phiếu + lịch sử → ROLLBACK, không còn dòng nào | NFR5 | PASS |
| TR-06 | customerRepository.update chỉ đổi trường được gửi; search theo SĐT chính xác / họ tên không phân biệt hoa thường | QT-01, NFR3 | PASS |
| TR-07 | deviceRepository.update: ngày mua undefined giữ nguyên, null xoá; model, số tháng đổi đúng | QT-05 | PASS |
| TR-08 | xoá thiết bị đã có phiếu bị khoá ngoại chặn (→ IN_USE); thiết bị chưa có phiếu xoá được | TD-07, TD-20 | PASS |

### C. Kiểm thử tích hợp và thủ công (BT2)
| Mã | Các bước | Kết quả mong đợi | Kết quả thực tế | P/F |
|---|---|---|---|---|
| E2E | `npm run e2e`: đăng nhập → tra cứu khách (dữ liệu mẫu) → Serial chưa có (404) → ghi nhận thiết bị (201) → danh mục → tạo phiếu (201) → chi tiết → quản lý đăng nhập → xét duyệt (200) → danh sách | 10/10 bước đúng mã HTTP | 10/10 | PASS |
| TC-B10-01 | Đăng nhập sai/đúng; token sai → 401 | chữ đỏ; về trang đăng nhập | đúng | PASS |
| TC-B10-02 | Tạo phiếu, thiết bị mới có ngày mua | Mới · Còn bảo hành · hạn +72 giờ làm việc | đúng | PASS |
| TC-B10-03 | Thiếu mô tả (10a), thiếu ngày mua (8a), quản lý xét duyệt | chặn 10a; Chờ xác minh → Mới, 2 dòng lịch sử | đúng | PASS |
| TC-B10-04 | Danh sách, đang tải, bộ lọc rỗng | 20 dòng/trang; câu giải thích khi rỗng | đúng | PASS |
| TC-B10-05 | Tắt backend, bấm Thử lại | khung lỗi + Thử lại; bật lại → hiện danh sách | đúng | PASS |
| TC-B11-01 | Dừng PostgreSQL rồi gọi `GET /api/tickets` | 503 `LOI_HE_THONG` + mã tra cứu; `/health` 503 | đúng | PASS |
| TC-B11-02 | Khởi động lại PostgreSQL 3 lần khi API đang chạy | API vẫn phục vụ (200) | đúng | PASS |
| CRUD | `npm run crud`: tạo/đọc/sửa/xoá khách hàng và thiết bị; SĐT trùng 409, sửa Serial 400, NV xoá 403, xoá khi đang dùng 409, đọc sau xoá 404 | 17/17 bước đúng mã HTTP, không để lại dữ liệu | 17/17 | PASS |
| TC-B12-01 | M4: tìm khách, rỗng, sửa SĐT trùng, Quản lý xoá khách đang có thiết bị | câu giải thích khi rỗng; chữ đỏ 409; NV không thấy nút xoá | đúng | PASS |

### D. Ghi chú về tính trung thực (BT2)
- TC-26, TC-27, TC-28 được viết **trước** khi sửa và **FAIL** trên mã cũ, sau khi sửa thì PASS (BUG-06, BUG-07, BUG-08). TC-29 FAIL khi chạy trên `ticketService.js` của commit 436e3a8 (trước BUG-03); TC-34 FAIL khi chạy trên `db.js` của commit 8c62fff (trước BUG-10). TC-30 … TC-33 kiểm hành vi mới của logger và middleware lỗi (BUG-09) nên được viết cùng lúc với mã.
- Trước Buổi 11, API chết khi CSDL khởi động lại (BUG-10, Critical) – không bộ unit test nào phát hiện vì lỗi chỉ xuất hiện khi chạy cả hệ thống với CSDL thật; phát hiện bằng kiểm thử thủ công TC-B11-02.
