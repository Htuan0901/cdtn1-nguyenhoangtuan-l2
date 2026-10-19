# Nhật ký thay đổi thiết kế – Smart CRM · Luồng L2

> Ghi theo mẫu Buổi 8: mỗi thay đổi có mã TD-xx và đủ bốn dòng **phản hồi – quyết định – lý do – ảnh hưởng**.
> File được nối tiếp khi nhận phản hồi BT2, BT3.

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
