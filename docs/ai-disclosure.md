# Bảng khai báo sử dụng công cụ AI – BT1
| Công cụ | Dùng vào việc gì | Áp dụng ở phần nào | Đã kiểm chứng thế nào |
|---|---|---|---|
| Claude (Anthropic) – trợ lý AI dạng chat | Đối chiếu bài Buổi 2, Buổi 4 với đề BT1 để chỉ ra chỗ thiếu, sai; đề xuất gộp còn 7 User Story; gợi ý viết lại FR, NFR theo dạng có ngưỡng số. | Mục 1 – SRS; Phụ lục A | Đối chiếu từng FR, NFR với checklist mục 6 của đề bài; tự kiểm phép tính hạn cam kết của AC5.1, AC5.2 bằng lịch tháng 10/2026; giữ nguyên phạm vi L2 đã được duyệt ở buổi 2. |
| Claude (Anthropic) | Gợi ý đặc tả UC04, UC07; cấu trúc 4 lớp và nháp câu lập luận; tách bảng, kiểu dữ liệu, index, SQL DDL; vẽ Use Case, kiến trúc, ERD, 3 wireframe (draw.io). | Mục 2–5; db/schema.sql | Đối chiếu bảy lỗi vẽ Use Case; kiểm mỗi câu lập luận đủ mã NFR, ngưỡng, quyết định, đánh đổi; chạy schema.sql trên PostgreSQL 16 (6 bảng, 4 index); đối chiếu từng trường wireframe với cột ERD. |
| Claude (Anthropic) | Đọc bảng phản hồi BT1, đề xuất phần nào chuyển sang repo để rút gọn bài và soạn Phụ lục A.1. | Phụ lục A.1; docs/checklist-bt1.md | Đối chiếu từng góp ý trong bảng phản hồi; kiểm bản rút gọn vẫn đủ 11 mục kiểm chứng và bảng truy vết không đổi. |
| — không dùng — | Chọn luồng nghiệp vụ, actor, danh sách chức năng và User Story gốc (form phạm vi buổi 2, bài buổi 4). | Phạm vi L2 | Không áp dụng |

*Tôi xác nhận đã đọc, hiểu và chịu trách nhiệm về toàn bộ nội dung nộp.*

Họ tên: **Nguyễn Hoàng Tuấn**   –   MSSV: **2374802010542**   –   Ngày: **17/10/2026**

## Sprint 1 – Buổi 8 (19/10/2026)

| Công cụ | Dùng vào việc gì | Áp dụng ở phần nào | Đã kiểm chứng thế nào |
|---|---|---|---|
| Claude (Anthropic) | Đọc phản hồi BT1, repo mẫu track SE và gợi ý quyết định SỬA/GIỮ cho từng điểm | docs/thay-doi-thiet-ke.md (TD-01…TD-10) | Đối chiếu từng TD với bảng phản hồi của giảng viên và tài liệu Buổi 8 |
| Claude (Anthropic) | Gợi ý khung thư mục theo 4 lớp; viết mã routes/controllers/services/policies/repositories, migration, script demo, script NFR2 và unit test | src/backend/, src/frontend/ (khung), tests/backend/ | Chạy `npm test` (35/35 đạt), `npm run migrate` (6 bảng), `npm run demo` (11 lời gọi đúng mã HTTP như api-contract), `npm run nfr2`; đọc lại từng tệp để giải thích được luồng UC04, UC07 |
| Claude (Anthropic) | Soạn báo cáo Buổi 8 | BaoCao_Buoi8_2374802010542_NguyenHoangTuan | Ảnh kết quả trong báo cáo do em tự chạy và chụp trên máy |
