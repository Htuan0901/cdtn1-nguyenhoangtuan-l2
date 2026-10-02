# SRS – Smart CRM (Mekong Mobile)
## Luồng L2: Tiếp nhận và phân loại yêu cầu bảo hành

- **Sinh viên:** Nguyễn Hoàng Tuấn
- **MSSV:** 2374802010542
- **Chuyên ngành:** Công nghệ phần mềm (Track SE)
- **Phiên bản:** 1.0 – Bài thực hành CDTN1 Buổi 4

> Tài liệu được xây dựng theo nội dung báo cáo Buổi 4 đã cung cấp. Các quy tắc chưa được xác nhận trong case study cần được hỏi lại bên liên quan trước khi triển khai.

## 1. Giới thiệu

### 1.1 Mục đích
Mô tả yêu cầu chức năng, phi chức năng, Use Case, quy tắc nghiệp vụ và truy vết yêu cầu cho luồng L2 của Smart CRM – Mekong Mobile.

### 1.2 Phạm vi
- Tra cứu khách hàng bằng số điện thoại; tạo hồ sơ mới nếu chưa tồn tại.
- Tra cứu thiết bị bằng Serial/IMEI.
- Kiểm tra tình trạng bảo hành.
- Ghi nhận mô tả lỗi và nhóm sự cố.
- Xác định mức ưu tiên, tính hạn SLA theo cấu hình.
- Tạo phiếu bảo hành mới.
- Quản lý trung tâm xem danh sách phiếu mới trong ngày.

### 1.3 Thuật ngữ
| Thuật ngữ | Ý nghĩa |
|---|---|
| SRS | Software Requirements Specification – Đặc tả yêu cầu phần mềm |
| US | User Story |
| UC | Use Case |
| FR / NFR | Yêu cầu chức năng / phi chức năng |
| SLA | Service Level Agreement – Thời hạn cam kết xử lý |
| Serial/IMEI | Mã định danh thiết bị |
| MoSCoW | MUST, SHOULD, COULD, WON'T – cách ưu tiên yêu cầu |

## 2. Tổng quan

### 2.1 Actor
| Actor/hệ thống | Trách nhiệm |
|---|---|
| Nhân viên tiếp nhận | Tra cứu khách hàng, thiết bị; kiểm tra bảo hành; ghi nhận sự cố; tạo phiếu |
| Quản lý trung tâm bảo hành | Xem danh sách phiếu mới trong ngày |
| Smart CRM | Kiểm tra dữ liệu, xác định trạng thái bảo hành, mức ưu tiên/SLA và lưu phiếu |

### 2.2 Giả định và ràng buộc
- Người dùng phải được xác thực và phân quyền.
- Dữ liệu khách hàng, thiết bị, thời hạn bảo hành, quy tắc ưu tiên và lịch làm việc cần có sẵn.
- Nếu thiếu ngày mua hoặc thời hạn bảo hành, hệ thống trả `CHƯA_ĐỦ_DỮ_LIỆU`, không tự kết luận.
- Nếu thiếu quy tắc ưu tiên hoặc lịch SLA, hệ thống báo thiếu cấu hình.
- Những quy tắc chưa được xác nhận cần được làm rõ với bên liên quan.

### 2.3 Quy trình tổng quát
1. Tra cứu khách hàng.
2. Tạo hồ sơ khách hàng nếu chưa tồn tại.
3. Tra cứu thiết bị.
4. Kiểm tra tình trạng bảo hành.
5. Nhập mô tả lỗi và nhóm sự cố.
6. Xác định mức ưu tiên và tính SLA.
7. Xác nhận tạo phiếu.
8. Lưu phiếu, sinh mã duy nhất và trả kết quả.
9. Quản lý xem danh sách phiếu mới trong ngày.

## 3. Yêu cầu chức năng

| Mã | Yêu cầu | User Story | Use Case | Ưu tiên |
|---|---|---|---|---|
| FR-01 | Tra cứu khách hàng theo số điện thoại | US1 | UC-01 | MUST |
| FR-02 | Tạo hồ sơ mới nếu khách hàng chưa tồn tại; không tạo trùng số điện thoại | US2 | UC-02 | MUST |
| FR-03 | Tra cứu thiết bị theo Serial/IMEI và hiển thị thông tin/ngày mua | US3 | UC-03 | MUST |
| FR-04 | Kiểm tra bảo hành dựa trên ngày mua và thời hạn | US4 | UC-04 | MUST |
| FR-05 | Ghi nhận mô tả lỗi và nhóm sự cố; từ chối nếu thiếu mô tả | US5 | UC-05 | MUST |
| FR-06 | Xác định mức ưu tiên theo quy tắc đã cấu hình | US6 | UC-06 | MUST |
| FR-07 | Tính hạn SLA theo mức ưu tiên và lịch làm việc | US7 | UC-06 | SHOULD |
| FR-08 | Tạo phiếu mới có mã duy nhất, trạng thái ban đầu, thời điểm tiếp nhận, mức ưu tiên và SLA | US8 | UC-07 | MUST |
| FR-09 | Xem danh sách phiếu mới trong ngày, gồm mã phiếu, thời điểm và trạng thái | US9 | UC-08 | COULD |

### 3.1 Quy tắc nghiệp vụ
- **BR-01:** Không tạo hồ sơ khách hàng trùng số điện thoại.
- **BR-02:** Không tự tạo thiết bị khi Serial/IMEI không tồn tại.
- **BR-03:** Thiếu ngày mua/thời hạn bảo hành thì trả `CHƯA_ĐỦ_DỮ_LIỆU`.
- **BR-04:** Mô tả lỗi là trường bắt buộc khi tạo phiếu.
- **BR-05:** Mức ưu tiên phải theo quy tắc đã cấu hình.
- **BR-06:** SLA phải dựa trên mức ưu tiên và lịch làm việc đã cấu hình.
- **BR-07:** Phiếu tạo thành công có mã duy nhất và trạng thái ban đầu `Mới`.
- **BR-08:** Quản lý chỉ xem dữ liệu trong phạm vi được phân quyền.

## 4. Yêu cầu phi chức năng

| Mã | Yêu cầu | Tiêu chí kiểm chứng |
|---|---|---|
| NFR-01 | Hiệu năng | 95% API tra cứu phản hồi ≤ 2 giây với tối đa 50 người dùng đồng thời trong môi trường kiểm thử |
| NFR-02 | Bảo mật | 100% endpoint nghiệp vụ yêu cầu xác thực; không trả mật khẩu/dữ liệu bí mật trong response hoặc log |
| NFR-03 | Toàn vẹn dữ liệu | 100% phiếu tạo thành công có mã duy nhất và đủ thông tin bắt buộc |
| NFR-04 | Khả năng kiểm thử | ≥ 90% luồng acceptance quan trọng của story MUST có test case/checklist trong `tests/` |
| NFR-05 | Khả năng bảo trì | Quy tắc ưu tiên và SLA được tách khỏi API handler để kiểm thử độc lập |

## 5. Use Case và đặc tả

### 5.1 Danh sách Use Case
| Mã | Tên Use Case | Actor chính |
|---|---|---|
| UC-01 | Tra cứu khách hàng theo số điện thoại | Nhân viên tiếp nhận |
| UC-02 | Tạo hồ sơ khách hàng mới | Nhân viên tiếp nhận |
| UC-03 | Tra cứu thiết bị theo Serial/IMEI | Nhân viên tiếp nhận |
| UC-04 | Kiểm tra tình trạng bảo hành | Nhân viên tiếp nhận |
| UC-05 | Ghi nhận mô tả lỗi và nhóm sự cố | Nhân viên tiếp nhận |
| UC-06 | Xác định mức ưu tiên và tính hạn SLA | Smart CRM (tự động) |
| UC-07 | Tạo phiếu bảo hành mới | Nhân viên tiếp nhận |
| UC-08 | Xem danh sách phiếu mới trong ngày | Quản lý trung tâm bảo hành |

### 5.2 Đặc tả UC-07 – Tạo phiếu bảo hành mới
**Actor chính:** Nhân viên tiếp nhận.

**Mục tiêu:** Lưu chính thức yêu cầu bảo hành sau khi thông tin đã được xác nhận.

**Điều kiện trước**
- Khách hàng và thiết bị đã được xác định.
- Mô tả lỗi và nhóm sự cố hợp lệ.
- Quy tắc ưu tiên và lịch SLA đã được cấu hình.

**Điều kiện sau**
- Phiếu có mã duy nhất, trạng thái `Mới`, thời điểm tiếp nhận, mức ưu tiên và hạn SLA.

**Luồng chính**
1. Nhân viên mở chức năng tạo phiếu.
2. Hệ thống hiển thị thông tin khách hàng và thiết bị.
3. Nhân viên nhập mô tả lỗi, chọn nhóm sự cố.
4. Hệ thống kiểm tra trường bắt buộc.
5. Hệ thống kiểm tra tình trạng bảo hành.
6. Hệ thống xác định mức ưu tiên và tính SLA.
7. Nhân viên kiểm tra và xác nhận.
8. Hệ thống lưu phiếu trong một giao dịch.
9. Hệ thống trả mã phiếu, trạng thái và hạn SLA.

**Luồng ngoại lệ**
- **E4.1:** Thiếu mô tả lỗi hoặc nhóm sự cố không hợp lệ: báo lỗi, không tạo phiếu, cho phép sửa.
- **E5.1:** Thiếu ngày mua/thời hạn bảo hành: trả `CHƯA_ĐỦ_DỮ_LIỆU`, không tự kết luận.
- **E6.1:** Thiếu quy tắc ưu tiên/lịch SLA: báo thiếu cấu hình, không tạo phiếu.
- **E8.1:** Xung đột dữ liệu/mã phiếu: rollback giao dịch, trả lỗi, không tạo phiếu trùng.

### 5.3 Đặc tả UC-08 – Xem danh sách phiếu mới trong ngày
**Actor chính:** Quản lý trung tâm bảo hành.

**Điều kiện trước:** Quản lý đã đăng nhập và có quyền xem dữ liệu của trung tâm được phân công.

**Điều kiện sau:** Danh sách phiếu trong ngày được hiển thị hoặc thông báo danh sách trống.

**Luồng chính**
1. Quản lý mở danh sách phiếu mới trong ngày.
2. Hệ thống xác định ngày hiện tại theo múi giờ cấu hình.
3. Hệ thống lọc phiếu tiếp nhận trong ngày thuộc trung tâm được phân quyền.
4. Hệ thống hiển thị mã phiếu, thời điểm tiếp nhận và trạng thái.
5. Quản lý xem thông tin tổng quan.

**Luồng ngoại lệ**
- **E3.1:** Không có phiếu trong ngày: hiển thị danh sách rỗng kèm thông báo.
- **E3.2:** Không đủ quyền: từ chối truy cập dữ liệu ngoài phạm vi được phân quyền.

## 6. Truy vết yêu cầu

| Yêu cầu | User Story | Use Case | Ưu tiên |
|---|---|---|---|
| FR-01 | US1 | UC-01 | MUST |
| FR-02 | US2 | UC-02 | MUST |
| FR-03 | US3 | UC-03 | MUST |
| FR-04 | US4 | UC-04 | MUST |
| FR-05 | US5 | UC-05 | MUST |
| FR-06 | US6 | UC-06 | MUST |
| FR-07 | US7 | UC-06 | SHOULD |
| FR-08 | US8 | UC-07 | MUST |
| FR-09 | US9 | UC-08 | COULD |

## Phụ lục A – API Contract tham khảo (Track SE)

> Các endpoint dưới đây là đề xuất ở mức phân tích/thiết kế, không khẳng định API đã được triển khai.

| Method | Endpoint | Mục đích | Story | HTTP dự kiến |
|---|---|---|---|---|
| GET | `/api/customers?phone={phone}` | Tra cứu khách hàng | US1 | 200 / 400 / 404 |
| POST | `/api/customers` | Tạo khách hàng | US2 | 201 / 400 / 409 |
| GET | `/api/devices/{serial}` | Tra cứu thiết bị | US3 | 200 / 400 / 404 |
| GET | `/api/devices/{serial}/warranty-status` | Kiểm tra bảo hành | US4 | 200 / 404 |
| POST | `/api/tickets/preview` | Kiểm tra dữ liệu, ưu tiên, SLA | US5–US7 | 200 / 400 / 422 |
| POST | `/api/tickets` | Tạo phiếu bảo hành | US8 | 201 / 400 / 409 |
| GET | `/api/tickets?receivedDate=YYYY-MM-DD` | Danh sách phiếu theo ngày | US9 | 200 / 400 |

## Phụ lục B – Các điểm cần xác nhận
- Thời hạn bảo hành và cách xử lý trường hợp thiếu chứng từ.
- Bảng quy tắc nhóm sự cố → mức ưu tiên.
- Lịch làm việc và cách tính SLA, bao gồm ngày nghỉ.
- Phạm vi dữ liệu mà mỗi quản lý trung tâm được xem.
- Quy tắc sinh mã phiếu và chống tạo phiếu trùng.
