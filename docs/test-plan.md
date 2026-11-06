# Test Plan rút gọn – Smart CRM · Luồng L2 (Buổi 14 → Bài tập 3)

Sinh viên: Nguyễn Hoàng Tuấn – MSSV 2374802010542 · track SE · Kết quả: `docs/test-report.md` · Lỗi: `docs/bug-log.md`

## 1. Phạm vi và phần CHỦ Ý KHÔNG kiểm
**Kiểm:** luồng L2 qua API thật – tiếp nhận phiếu (UC04), xét duyệt (UC07), danh sách / chi tiết (UC06, UC08), CRUD Khách hàng và Thiết bị; quy tắc QT-01…QT-06, QT-14, QT-15, QT-A1, QT-A2; kiểm tra dữ liệu vào (validator) và xử lý lỗi ở ranh giới HTTP; phân quyền theo vai trò và trung tâm; không lộ mật khẩu trong repo; chạy lại migrate + seed.

**Chủ ý KHÔNG kiểm (lý do):**
- Kiểm thử giao diện tự động (Playwright…): giao diện chỉ gọi API và hiển thị, không chứa quy tắc nghiệp vụ – đã có 8 test case thủ công (`docs/test-cases.md`).
- Hiệu năng, tải lớn, kiểm thử xâm nhập chuyên sâu: ngoài phạm vi CĐTN 1; NFR2 đã đo một lần bằng `npm run nfr2`.
- Nhiều trình duyệt, thiết bị di động: chỉ Chrome / Edge bản mới.
- Các bước sau xét duyệt (phân công, sửa chữa, trả máy): thuộc luồng khác của case study.

## 2. Loại test và số lượng mỗi tầng
| Tầng | Số lượng | Lệnh | CSDL |
|---|---|---|---|
| Unit – policies, services, validator, middleware (repository giả) | 61 (TC-01…TC-46) | `npm test` | Không |
| Repository – SQL trên PostgreSQL thật, mỗi test BEGIN … ROLLBACK | 8 (TR-01…TR-08) | `npm run test:repo` | Có |
| **Hệ thống – 12 test case chạy qua API, đếm bản ghi trước/sau** | **12 (ST-01…ST-12)** | `npm run st` (một case: `npm run st -- ST-05`) | Có, API chạy |
| Kịch bản tích hợp | e2e 10 bước · CRUD 17 bước | `npm run e2e` · `npm run crud` | Có, API chạy |

Năm loại của 12 test case hệ thống: **luồng đúng** 2 (ST-01, ST-02) · **giá trị biên** 3 (ST-03 / ST-04 hai bên ranh giới hạn bảo hành, ST-05 độ dài 5.000 / 5.001) · **dữ liệu sai** 4 (ST-06…ST-09) · **bảo mật** 2 (ST-10 phân quyền, ST-11 không lộ mật khẩu) · **tái lập** 1 (ST-12).

**Kỹ thuật chọn dữ liệu:**
- *Phân vùng tương đương:* thiết bị có ngày mua còn hạn / hết hạn / không có ngày mua (ST-01, ST-04, ST-02); người gọi đúng vai trò – sai vai trò – khác trung tâm – không token (ST-10).
- *Giá trị biên, lấy hai bên ranh giới:* ngày tiếp nhận = ngày hết hạn (ST-03, còn BH) và = ngày hết hạn + 1 (ST-04, hết BH); mô tả 5.000 / 5.001 ký tự (ST-05); `q` 100 / 101 ký tự (TC-44).
- *Đoán lỗi ở ranh giới HTTP:* tham số trùng tên `?q=a&q=b`, tham số dạng đối tượng `?q[x]=1` (ST-08), body vượt giới hạn 100 KB (ST-09), id không tồn tại (ST-07).

## 3. Tiêu chí thành công đo được
- `npm test` **61/61 PASS**, `npm run test:repo` **8/8**, `npm run e2e` **10/10 bước**, `npm run crud` **17/17 bước**, `npm run st` **12/12 PASS** – mỗi bộ chạy bằng một lệnh.
- Mỗi test case hệ thống ghi kết quả thực tế có mã HTTP và số bản ghi trước → sau; gọi thất bại thì bảng đích **+0**.
- Không còn bug Critical / Major đang mở; mỗi bug đã sửa có một commit `fix(…): … (BUG-xx)` và test hồi quy FAIL trên mã cũ, PASS sau khi sửa.
- Không endpoint nào trả 500 với dữ liệu vào sai (chỉ 400 / 401 / 403 / 404 / 409 / 413).
- CI (`.github/workflows/ci.yml`) xanh trên nhánh main.

## 4. Môi trường và dữ liệu thử
- Windows 11 + Git Bash · Node.js 20 LTS (`.nvmrc`) · PostgreSQL 16 (Docker `postgres:16`) · Chrome; CI: ubuntu-latest + service `postgres:16`.
- CSDL dựng mới cho lần chạy chính thức: `docker rm -f smartcrm-pg` → `docker run --env-file .env …` → `npm run migrate` → `npm run seed` (dữ liệu mẫu THẬT của học phần `data/mau/`, 120 phiếu + 2 phiếu mẫu).
- Mỗi test case hệ thống tự tạo khách hàng (SĐT 09xxxxxxxx) và thiết bị (Serial `ST-<thời điểm>-n`) mới làm tiền điều kiện – không dựa vào dữ liệu còn sót trên máy, chạy lại nhiều lần được.
- Ngày cho test biên tính theo ngày chạy (giờ Việt Nam): ST-03 mua đúng ngày này năm trước, ST-04 sớm hơn một ngày.
- Tài khoản mẫu `nv01`, `ql01` (TT-CT01), `nv02` (TT-CT02), mật khẩu mẫu của seed `Mekong@2026`.
