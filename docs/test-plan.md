# Test Plan rút gọn – Smart CRM · Luồng L2 (Bài tập 3)

Sinh viên: Nguyễn Hoàng Tuấn – MSSV 2374802010542 · track SE · tag `v1.0` · Kết quả: `docs/test-report.md` · Lỗi: `docs/bug-log.md`

## 1. Phạm vi kiểm thử và phần CHỦ Ý KHÔNG kiểm
**Kiểm:**
- **Luồng L2 qua API thật:** tra cứu và tạo khách hàng (UC01, UC02), ghi nhận thiết bị (UC03), tiếp nhận phiếu (UC04), xét duyệt phiếu chờ xác minh (UC07), danh sách và chi tiết phiếu (UC06, UC08), CRUD Khách hàng và Thiết bị.
- **Cả 11 quy tắc nghiệp vụ đã hiện thực:** QT-01…QT-06, QT-14, QT-15, QT-A1…QT-A3 (bảng truy vết bên dưới).
- **Kiểm tra dữ liệu vào và xử lý lỗi ở ranh giới HTTP.**
- **Bảo mật:** phân quyền theo vai trò và trung tâm (chủ sở hữu – A01), không có secret trong repo.
- **Tái lập:** chạy lại migrate + seed; dựng toàn hệ thống bằng 2 lệnh (phép thử máy trắng).

**Chủ ý KHÔNG kiểm (lý do):**
- **Giao diện tự động (Playwright…):** giao diện chỉ gọi API và hiển thị, không chứa quy tắc nghiệp vụ nào. Mọi quy tắc đã được kiểm ở API; giao diện có 8 test case thủ công từ BT2 (`docs/test-cases.md`).
- **Hiệu năng / tải lớn, kiểm thử xâm nhập:** ngoài phạm vi CĐTN 1 (đề BT3 mục 1). NFR2 đã đo một lần bằng `npm run nfr2`.
- **Nhiều trình duyệt, thiết bị di động:** người dùng là nhân viên trung tâm, dùng máy tính có Chrome hoặc Edge.
- **Phân công, sửa chữa, trả máy:** thuộc luồng khác (L4…), hệ thống không có các chức năng này.

## 2. Loại test và số lượng mỗi tầng

Mỗi bộ chạy bằng **một lệnh** trong container: `docker compose exec -T api <lệnh>`.

| Tầng | Số lượng | Lệnh | Cần CSDL |
|---|---|---|---|
| Unit – policy, service, validator, middleware, đóng gói (repository giả) | **64** (TC-01…TC-49 + 15 test policy) | `npm test` | Không |
| Integration – repository chạy SQL trên PostgreSQL thật, mỗi test BEGIN … ROLLBACK | **8** (TR-01…TR-08) | `npm run test:repo` | Có |
| **Hệ thống / API – 12 test case của Test Report**, gọi API thật, đếm bản ghi trước/sau | **12** (ST-01…ST-12) | `npm run st` (một case: `npm run st -- ST-05`) | Có, API đang chạy |
| Kịch bản đầu–cuối qua API | e2e 10 bước · CRUD 17 bước | `npm run e2e` · `npm run crud` | Có |
| Phép thử máy trắng | 1 (11 bước kiểm của Deployment Guide §5) | CI job `dong-goi` + tự chạy (ảnh) | — |

Năm loại của 12 test case hệ thống:
- **Luồng đúng** 2: ST-01, ST-02.
- **Giá trị biên** 3: ST-03 / ST-04 ở hai bên ranh giới hạn bảo hành; ST-05 với mô tả 5.000 / 5.001 ký tự.
- **Dữ liệu sai** 4: ST-06…ST-09. Mỗi test kiểm cả mã HTTP **và** `code`/`fields` trong thông báo.
- **Bảo mật** 2: ST-10 kiểm quyền theo chủ sở hữu (A01); ST-11 không lộ mật khẩu.
- **Tái lập** 1: ST-12.

**Truy vết – mỗi quy tắc nghiệp vụ có ít nhất một test luồng đúng, và một test biên ở những quy tắc có ranh giới:**

| Quy tắc | Luồng đúng | Biên | Dữ liệu sai / bảo mật |
|---|---|---|---|
| QT-01 SĐT là duy nhất | TR-01, TC-36 | TC-37 (giữ SĐT của chính mình) | TC-25, TC-39 (409 PHONE_EXISTS) |
| QT-02 Chuẩn hoá SĐT | AC1.1 (+84 901 234 567 → 0901234567), TC-29, TC-35 | AC1.3 (09012 – thiếu số) | TC-25 (SĐT sai → 400) |
| QT-03 Serial/IMEI là duy nhất, không sửa | e2e bước 4 (ghi nhận thiết bị) | — (không có ngưỡng) | TC-24 (409), TC-41 (sửa Serial → 400) |
| QT-04 Hạn cam kết theo ngày làm việc | AC5.1, AC5.2 | thứ Bảy 20:00 → bỏ Chủ nhật | mức ưu tiên lạ → lỗi |
| QT-05 Điều kiện bảo hành | **ST-01**, AC4.1 | **ST-03 / ST-04**, TC-05 / TC-06 | TC-22 (ngày mua ở tương lai) |
| QT-06 Ghi lịch sử mọi lần chuyển trạng thái | **ST-02** (2 dòng lịch sử), TC-01 | — | TC-12 (lỗi ghi lịch sử → huỷ cả giao dịch) |
| QT-14 Chỉ thấy dữ liệu trung tâm mình | TC-04, TR-04 | — | **ST-10** (403 khác trung tâm), TC-15 |
| QT-15 Che SĐT trừ quản lý | **ST-01** (`098****201`), test policy che 4 số giữa | — | — |
| QT-A1 Ưu tiên mặc định theo nhóm | **ST-01** (PIN → TRUNG_BINH), TC-02 | — | TC-18 (sai enum) |
| QT-A2 Mã phiếu BH-NNNNNN/YYYY từ bộ đếm | TC-01, TR-03 | — | — |
| QT-A3 Quyết định xét duyệt không ghi đè, ghi chú bắt buộc | **ST-02**, TC-03 | — | TC-13 (NOTE_REQUIRED), TC-14 (409 ALREADY_REVIEWED), TC-16 |

**Kỹ thuật chọn dữ liệu:**
- **Phân vùng tương đương:** thiết bị còn hạn / hết hạn / không có ngày mua (ST-01, ST-04, ST-02); người gọi đúng vai trò / sai vai trò / khác trung tâm / không có token (ST-10).
- **Giá trị biên, lấy cả hai bên ranh giới:** ngày tiếp nhận = ngày hết hạn (ST-03, còn bảo hành) và ngày hết hạn + 1 (ST-04, hết bảo hành); mô tả 5.000 / 5.001 ký tự (ST-05); `q` 100 / 101 ký tự (TC-44).
- **Đoán lỗi:**
  - ở ranh giới HTTP: tham số trùng tên, tham số dạng đối tượng (ST-08), body > 100 KB (ST-09);
  - ở đóng gói: chạy test trong container khi không có `.env` (TC-48, TC-49).

## 3. Tiêu chí thành công ĐO ĐƯỢC
Kiểm thử được coi là đạt khi **tất cả** các điều sau đều đúng trên bản build từ tag `v1.0`, chạy trong container:
1. `npm test` **64/64 PASS** · `npm run test:repo` **8/8** · `npm run e2e` **10/10 bước** · `npm run crud` **17/17 bước** · `npm run st` **12/12 PASS**.
2. Cả **11/11 quy tắc nghiệp vụ** đều có ít nhất một test luồng đúng PASS (bảng truy vết); các quy tắc có ranh giới (QT-01, 02, 04, 05) có test biên PASS.
3. **0 bug Critical và 0 bug Major đang mở** trong `docs/bug-log.md`. Mỗi bug đã sửa có một commit `fix(…): … (BUG-xx)` mở được, và một test hồi quy FAIL trên mã cũ, PASS sau khi sửa.
4. **Không request sai nào trả 500.** Mọi test dữ liệu sai chỉ nhận 400 / 401 / 403 / 404 / 409 / 413, kèm `code` đúng như tài liệu API.
5. **Phép thử máy trắng đạt:** từ thư mục trống, 2 lệnh của Deployment Guide dựng được hệ thống; 3/3 dịch vụ healthy; chạy migrate + seed lần 2 thì số bản ghi 667 / 293 / 122 không đổi; CI job `dong-goi` xanh.

## 4. Môi trường và dữ liệu thử
- **Môi trường chính thức (BT3):** Docker Compose theo `docs/deployment-guide.md`. Gồm `postgres:16-alpine` (không mở cổng ra máy), `api` (`node:20-alpine`, chứa đủ bộ test – TD-24) và `web`. Lệnh test chạy **trong** container `api`; biến môi trường do Compose truyền vào, không cần `.env` trong image. Máy chạy: Windows 11 + Docker Desktop + Git Bash.
- **CI:** GitHub Actions `ubuntu-latest`. Job `kiem-thu` chạy Node 20 + service `postgres:16`; job `dong-goi` chạy đúng Deployment Guide trên máy sạch.
- **Dữ liệu:**
  - CSDL dựng mới bằng `docker compose down -v` rồi `up`. Migration + seed tự nạp dữ liệu mẫu THẬT của học phần (`data/mau/*.csv`): 667 khách hàng, 293 thiết bị, 122 phiếu, 3 nhân viên, 6 nhóm sự cố.
  - Mỗi test case hệ thống **tự tạo** khách hàng (SĐT `09xxxxxxxx` theo thời điểm) và thiết bị (Serial `ST-<thời điểm>-n`) làm tiền điều kiện. Vì vậy test không phụ thuộc dữ liệu còn sót trên máy và chạy lại được nhiều lần.
  - Test repository bọc trong BEGIN … ROLLBACK, không để lại dữ liệu; `npm run crud` tự xoá dữ liệu thử.
  - Ngày cho test biên tính theo ngày chạy (giờ Việt Nam): ST-03 mua đúng ngày này năm trước, ST-04 sớm hơn một ngày.
- **Dọn:** `docker compose down -v` xoá toàn bộ dữ liệu; lần `up` sau bắt đầu lại từ dữ liệu mẫu.
- **Tài khoản mẫu:** `nv01`, `ql01` (TT-CT01), `nv02` (TT-CT02), mật khẩu mẫu của seed (README mục 3).
