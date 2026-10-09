# API Contract – Luồng L2: Tiếp nhận và phân loại yêu cầu bảo hành (track SE)

Sinh viên: Nguyễn Hoàng Tuấn – MSSV 2374802010542 · Bài tập 1 – Chuyên đề tốt nghiệp 1

Thiết kế REST API cho lớp ② (API – Express) trong `architecture.drawio`. Tên trường và giá trị enum khớp với ERD (`erd.drawio`, `db/schema.sql`) và Bảng thuật ngữ trong `srs.md`. Dữ liệu trong ví dụ là dữ liệu minh họa của case study Mekong Mobile.

## 1. Quy ước chung

| Mục | Quy ước |
|---|---|
| Base URL | `/api` |
| Định dạng | JSON, UTF-8; thời gian theo ISO 8601 có múi giờ `+07:00` |
| Xác thực | Header `Authorization: Bearer <JWT>`; JWT chứa `staffId`, `role` (`NV_TIEP_NHAN` / `QL_TRUNG_TAM`), `centerCode` |
| Phân quyền | Chỉ truy cập dữ liệu của `centerCode` trong JWT (QT-14) |
| Che số điện thoại | Vai trò `NV_TIEP_NHAN` nhận `phone` dạng `090****567`; `QL_TRUNG_TAM` nhận đầy đủ (QT-15, NFR4) |

**Mã HTTP dùng chung**

| Mã | Ý nghĩa |
|---|---|
| 200 | Thành công (đọc, cập nhật) |
| 201 | Tạo mới thành công |
| 400 | Dữ liệu vào không hợp lệ |
| 401 | Thiếu hoặc sai JWT |
| 403 | Sai vai trò hoặc khác trung tâm |
| 404 | Không tìm thấy |
| 409 | Xung đột dữ liệu (trùng, đã được xét duyệt) |

**Cấu trúc lỗi chung**
```json
{ "code": "VALIDATION_ERROR", "message": "Thiếu dữ liệu bắt buộc", "fields": ["issueDesc"] }
```

## 2. Danh sách endpoint

| # | Method | Endpoint | Mục đích | FR | US | UC |
|---|---|---|---|---|---|---|
| E1 | POST | `/api/customers/lookup` | Tra cứu khách hàng theo số điện thoại | FR1 | US1 | UC01 |
| E2 | POST | `/api/customers` | Tạo hồ sơ khách hàng mới | FR2 | US2 | UC02 |
| E3 | POST | `/api/devices` | Ghi nhận / tra cứu thiết bị theo Serial/IMEI | FR3 | US3 | UC03 |
| E4 | GET | `/api/issue-categories` | Danh mục nhóm sự cố đang hoạt động + mức ưu tiên mặc định | FR6 | US5 | UC05 |
| E5 | POST | `/api/tickets` | Tạo phiếu bảo hành (kiểm tra bảo hành, sinh hạn cam kết) | FR4, FR5, FR6 | US4, US5 | UC04 |
| E6 | GET | `/api/tickets` | Danh sách phiếu bảo hành có lọc, phân trang | FR8 | US7 | UC06 |
| E7 | GET | `/api/tickets/{ticketCode}` | Chi tiết phiếu + lịch sử trạng thái | FR8 | US7 | UC08 |
| E8 | POST | `/api/tickets/{ticketCode}/review` | Xét duyệt phiếu chờ xác minh bảo hành | FR7 | US6 | UC07 |

## 3. Chi tiết endpoint (story MUST)

### E1. POST /api/customers/lookup
Request:
```json
{ "phone": "+84 901 234 567" }
```
Response 200:
```json
{ "customerId": 1024, "fullName": "Nguyễn Minh Anh", "phone": "090****567" }
```
- 400 `INVALID_PHONE` – không chuẩn hoá được thành 10 chữ số bắt đầu bằng 0 (UC04 bước 2a).
- 404 `CUSTOMER_NOT_FOUND` – "Chưa có khách hàng với số điện thoại này" (UC04 bước 3a).

### E5. POST /api/tickets
Request:
```json
{
  "customerId": 1024,
  "deviceId": 5501,
  "issueDesc": "Màn hình nhấp nháy khi mở máy, đã khởi động lại nhưng không hết.",
  "categoryCode": "MAN_HINH",
  "priority": "TRUNG_BINH"
}
```
`centerCode` và `receivedBy` lấy từ JWT, không nhận từ client.

Response 201:
```json
{
  "ticketCode": "BH-000123/2026",
  "status": "MOI",
  "warrantyResult": "CON_BAO_HANH",
  "categoryCode": "MAN_HINH",
  "priority": "TRUNG_BINH",
  "receivedAt": "2026-10-02T10:00:00+07:00",
  "dueAt": "2026-10-06T10:00:00+07:00"
}
```
Thiết bị không có ngày mua → `"status": "CHO_XAC_MINH"`, `"warrantyResult": "CHUA_XAC_MINH"` (UC04 bước 8a).

- 400 `VALIDATION_ERROR` – thiếu trường bắt buộc (bước 10a); 400 `CATEGORY_INACTIVE` – nhóm sự cố ngừng sử dụng (bước 6a).
- 404 – `customerId` / `deviceId` không tồn tại; 409 `DEVICE_OWNER_MISMATCH` – thiết bị không thuộc khách hàng.
- Phiếu và dòng `ticket_status_log` đầu tiên được ghi trong một giao dịch (NFR5).

### E8. POST /api/tickets/{ticketCode}/review
Chỉ vai trò `QL_TRUNG_TAM`.

Request:
```json
{ "decision": "CHAP_NHAN", "note": "Khách cung cấp tin nhắn xác nhận đơn hàng ngày 20/05/2026" }
```
Response 200:
```json
{ "ticketCode": "BH-000125/2026", "status": "MOI", "warrantyResult": "CON_BAO_HANH",
  "reviewedBy": "Đặng Văn Khoa", "reviewedAt": "2026-10-02T14:30:00+07:00" }
```
- `decision`: `CHAP_NHAN` → `CON_BAO_HANH`; `KHONG_CHAP_NHAN` → `HET_BAO_HANH`.
- 400 `NOTE_REQUIRED` (UC07 bước 5a) · 409 `ALREADY_REVIEWED` (bước 6a) · 403 (bước 6b).

### E6. GET /api/tickets
Query: `from`, `to` (ngày tiếp nhận), `status`, `priority`, `q` (mã phiếu hoặc số điện thoại), `page` (mặc định 1, 20 dòng/trang – NFR3).

Response 200:
```json
{
  "page": 1, "pageSize": 20, "total": 236,
  "items": [
    { "ticketCode": "BH-000125/2026", "customerName": "Phạm Thu Hà", "phone": "097****045",
      "categoryName": "Pin", "priority": "TRUNG_BINH", "status": "CHO_XAC_MINH",
      "receivedAt": "2026-10-02T11:05:00+07:00", "dueAt": "2026-10-06T11:05:00+07:00" }
  ]
}
```
Không có kết quả → 200 với `"items": []` (UC07 bước 2a).

E2, E3, E4, E7 theo cùng quy ước; chi tiết sẽ hoàn thiện ở Bài tập 2.

## 4. Quy tắc validation

| Trường | Bắt buộc | Kiểu / độ dài | Quy tắc |
|---|---|---|---|
| `phone` | Có (E1, E2) | String ≤ 20 ký tự đầu vào | Chuẩn hoá về 10 chữ số bắt đầu bằng 0 (QT-02); duy nhất khi tạo (QT-01) |
| `fullName` | Có (E2) | String 1–100 | Không rỗng sau khi trim |
| `serialImei` | Có (E3) | String 1–50 | Duy nhất; không thuộc khách hàng khác (QT-03) → 409 |
| `modelName` | Có khi tạo thiết bị | String 1–100 | — |
| `purchaseDate` | Không | Date `YYYY-MM-DD` | Không lớn hơn ngày hiện tại; trống → Chưa xác minh (QT-05) |
| `warrantyMonths` | Có khi tạo thiết bị | Integer 0–60 | Mặc định 12 |
| `customerId`, `deviceId` | Có (E5) | Integer dương | Phải tồn tại; thiết bị thuộc khách hàng đã gửi |
| `issueDesc` | Có (E5) | String 1–5.000 | Không rỗng sau khi trim |
| `categoryCode` | Có (E5) | Enum | `MAN_HINH`, `PIN`, `SAC`, `PHAN_MEM`, `NUOC_VAO`, `KHAC`; phải đang hoạt động |
| `priority` | Có (E5) | Enum | `CAO`, `TRUNG_BINH`, `THAP` |
| `decision` | Có (E8) | Enum | `CHAP_NHAN`, `KHONG_CHAP_NHAN` |
| `note` | Có (E8) | String 1–500 | Không rỗng (QT-A3) |

## 5. Tự kiểm
- Mỗi endpoint truy vết được về ít nhất một User Story (bảng mục 2).
- Mọi trường trả về đều có cột tương ứng trong ERD.
- Mỗi luồng ngoại lệ của UC04, UC07 có mã HTTP và mã lỗi riêng.
