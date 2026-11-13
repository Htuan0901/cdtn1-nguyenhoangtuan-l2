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

## Sprint 2 – Buổi 10 (23/10/2026)

| Công cụ | Dùng vào việc gì | Áp dụng ở phần nào | Đã kiểm chứng thế nào |
|---|---|---|---|
| Claude (Anthropic) | Đọc tài liệu Buổi 10 và wireframe M1–M3; gợi ý phạm vi module mở rộng và phần cắt | docs/thay-doi-thiet-ke.md (TD-12…TD-16) | Đối chiếu với 10 mục kiểm chứng của Buổi 10 và User Story BT1 |
| Claude (Anthropic) | Viết mã đăng nhập, E2, E3, CORS, migration 003; giao diện M1–M3 + đăng nhập (client.js, *.api.js, DataState); script nạp dữ liệu mẫu và script e2e | src/backend/, src/frontend/, data/mau/ | Chạy lại toàn bộ từ thư mục clone mới theo README mục 3; thao tác tay 5 test case trên trình duyệt; tắt backend để xem trạng thái lỗi |
| Claude (Anthropic) | Viết 5 unit test (TC-21…TC-25), 5 test repository (TR-01…TR-05), 5 test case thủ công và nhật ký thực thi | tests/, docs/test-cases.md, docs/test-execution.md | `npm test` 40/40, `npm run test:repo` 5/5; đọc lại từng test để giải thích được nó kiểm quy tắc nào |
| Claude (Anthropic) | Soạn báo cáo Buổi 10 | BaoCao_Buoi10_2374802010542_NguyenHoangTuan | Đối chiếu số liệu trong báo cáo với đầu ra lệnh chạy |

## Buổi 11 – chuẩn bị Bài tập 2 (28/10/2026)

| Công cụ | Dùng vào việc gì | Áp dụng ở phần nào | Đã kiểm chứng thế nào |
|---|---|---|---|
| Claude (Anthropic) | Rà repo theo bài giảng Buổi 11 (khoá phiên bản, năm kiểu xử lý lỗi sai, log), tìm và tái lập lỗi | docs/bug-log.md (BUG-06…BUG-10) | Mỗi lỗi được tái lập 3–5 lần trước khi sửa; test hồi quy FAIL trước, PASS sau |
| Claude (Anthropic) | Viết logger, middleware requestId, dịch lỗi CSDL, middleware lỗi; Dockerfile, docker-compose | src/backend/src, Dockerfile, docker-compose.yml | `npm test` 49/49, `npm run test:repo` 5/5, `npm run e2e` 10/10; tắt/bật CSDL 3 lần khi API chạy; tự chạy `docker compose up --build` trên máy |
| Claude (Anthropic) | Soạn test plan, test report, bug log; soạn bản nháp PDF Bài tập 2 | docs/, BT2_2374802010542_NguyenHoangTuan.pdf | Đối chiếu từng số liệu với đầu ra lệnh; ảnh chụp kết quả do em tự chạy |
| Không thêm thư viện nào | Logger tự viết thay vì cài pino (TD-18) | — | `package.json` không đổi phụ thuộc |

## Buổi 12 – hoàn thiện và nộp Bài tập 2 (30/10/2026)

| Công cụ | Dùng vào việc gì | Áp dụng ở phần nào | Đã kiểm chứng thế nào |
|---|---|---|---|
| Claude (Anthropic) | Đối chiếu repo với bảng tiêu chí Buổi 12 (C1–C7, S1–S4), đề xuất bổ sung CRUD 2 thực thể (TD-20) | docs/thay-doi-thiet-ke.md | Đối chiếu từng mục kiểm chứng của tài liệu Buổi 12 |
| Claude (Anthropic) | Viết mã CRUD khách hàng, thiết bị (service, repository, controller, route, validator), màn hình M4, script crud.js | src/backend, src/frontend/src/pages/M4-khach-hang | `npm run crud` 17/17; thao tác tay M4 bằng nv01 và ql01; đọc lại từng hàm để trả lời bộ ba câu hỏi |
| Claude (Anthropic) | Viết TC-35…TC-42, TR-06…TR-08; cập nhật test plan/report; dọn repo theo bảy việc; soạn PDF Bài tập 2 | tests/, docs/, BT2_2374802010542_NguyenHoangTuan.pdf | `npm test` 57/57, `npm run test:repo` 8/8 trên thư mục clone mới; số liệu trong PDF lấy từ đầu ra lệnh |

## Buổi 14 – kiểm thử hệ thống và xử lý phản hồi BT2 (06/11/2026)

| Công cụ | Dùng vào việc gì | Áp dụng ở phần nào | Đã kiểm chứng thế nào |
|---|---|---|---|
| Claude (Anthropic) | Đọc phản hồi BT2, đề xuất quyết định xử lý (TD-21, TD-22) và cách gỡ mật khẩu khỏi tài liệu (`docker run --env-file`) | `docs/thay-doi-thiet-ke.md`, README, `.env.example`, `docker-compose.yml` | ST-11 / TC-46 quét tài liệu: 4 vị trí → 0; clone mới làm đúng README bước 3 – 4 dựng được CSDL; em tự đổi mật khẩu PostgreSQL trên máy |
| Claude (Anthropic) | Gợi ý 12 test case hệ thống theo năm loại, viết `scripts/system-test.js`, hook `commit-msg`, `.github/workflows/ci.yml` | `src/backend/scripts/`, `.githooks/`, `.github/` | Em chạy `npm run st` trên máy: lần 1 9/12 PASS, lần 2 12/12; chạy lại từng case `npm run st -- ST-xx`; thử hook với thông điệp sai (bị từ chối) và đúng (qua); xem tab Actions |
| Claude (Anthropic) | Tìm lỗi ở ranh giới HTTP (tham số trùng tên, body quá lớn), đề xuất cách sửa BUG-12, BUG-13 và test hồi quy TC-43…TC-45 | `validator.js`, `errorHandler.js`, `tests/backend/buoi14.test.js` | Test hồi quy FAIL trên mã cũ, PASS sau khi sửa; `npm test` 61/61, `test:repo` 8/8, `e2e` 10/10, `crud` 17/17 |
| Claude (Anthropic) | Soạn Test Plan, Test Report, Bug Log BUG-11…BUG-13 | `docs/test-plan.md`, `docs/test-report.md`, `docs/bug-log.md` | Đối chiếu từng ô “kết quả thực tế” với ảnh chụp `docs/screenshots/` của lần chạy trên máy em; phân loại mức độ theo ba câu hỏi của Buổi 13 |

*Tôi xác nhận đã đọc, hiểu và chịu trách nhiệm về toàn bộ nội dung nộp.* – Nguyễn Hoàng Tuấn · 2374802010542 · 06/11/2026

## Buổi 15–16 – đóng gói, tài liệu kỹ thuật và nộp Bài tập 3 (13/11/2026)

Giai đoạn 3 (Buổi 13–16) gồm mục Buổi 14 ở trên và mục này.

| Công cụ | Dùng vào việc gì | Áp dụng ở tệp / hàm nào | Em đã kiểm chứng thế nào |
|---|---|---|---|
| Claude (Anthropic) | Đọc đề BT3 và tài liệu Buổi 15–16, đối chiếu repo với bảng C1–C9, S1–S4 để chỉ ra phần còn thiếu | `docs/thay-doi-thiet-ke.md` (TD-24…TD-26) | Tự tick lại bảng 4.2 của đề trên bản tag `v1.0` trước khi nộp |
| Claude (Anthropic) | Khi rà Dockerfile, chỉ ra rằng bộ test không thể chạy trong container; gợi ý nguyên nhân (bố cục `/app`, `.dockerignore` loại `tests/`, cờ `--env-file`) và cách sửa | `src/backend/Dockerfile`, `.dockerignore`, `src/backend/scripts/load-env.js` (`parseEnv`, `loadEnv`), `src/backend/package.json`; Bug Log BUG-14 | Em **tự tái lập** lỗi trên commit `0493a95` (ảnh `BUG-14-truoc.png`), đọc thông báo lỗi để xác nhận đúng hai nguyên nhân; sau khi sửa chạy lại phép thử máy trắng từ thư mục trống: `npm test` 64/64, `npm run st` 12/12 trong container |
| Claude (Anthropic) | Viết test hồi quy TC-47…TC-49 | `tests/backend/buoi16.test.js` | Chạy trên mã cũ (FAIL) và mã mới (PASS); đọc từng assert để giải thích test kiểm điều gì |
| Claude (Anthropic) | Viết job CI `dong-goi` (phép thử máy trắng tự động) | `.github/workflows/ci.yml` | Xem tab Actions: job `dong-goi` xanh, đọc log từng bước khớp với Deployment Guide §5 |
| Claude (Anthropic) | Viết script ghi ví dụ API thật; soạn API docs tiếng Anh 17 endpoint × 7 mục | `src/backend/scripts/api-examples.js`, `docs/api-docs.md` | Em chạy script trên hệ thống dựng bằng `docker compose` của máy em, nên ví dụ là request/response thật (17/17 đúng mã HTTP); đếm route trong `routes/index.js` + `/health` = 17 mục trong tài liệu; đối chiếu bảng mã lỗi với các lần `throw` trong `business/services` |
| Claude (Anthropic) | Soạn Deployment Guide tiếng Anh, checklist bảo mật 7 mục; cập nhật Test Plan (bảng truy vết quy tắc → test), Test Report (8 cột, lần chạy 3 trong container), README | `docs/deployment-guide.md`, `docs/checklist-bao-mat.md`, `docs/test-plan.md`, `docs/test-report.md`, `README.md` | Làm đúng từng bước của Guide trên thư mục trống, không thêm lệnh nào; chạy từng lệnh minh chứng của checklist (`git check-ignore`, `git log -- .env`, `grep` log, xem `password_hash`, `npm audit`, tắt CSDL xem thông báo lỗi) và chụp ảnh; số liệu trong Test Report lấy từ đầu ra lệnh |
| Claude (Anthropic) | Giải thích cảnh báo `npm audit` (GHSA-27r3-jxmh-p828), đề xuất cách vá, viết BUG-15 và bước CI chặn lỗ hổng mức High | `src/backend/package-lock.json`, `docs/bug-log.md` (BUG-15), `.github/workflows/ci.yml` | Em tự chạy `npm audit` (thấy 1 high), `npm audit fix --omit=dev`, `git diff --stat` (chỉ đổi lockfile 3 dòng), `npm test` 64/64, `npm audit` → 0; đọc cảnh báo gốc để hiểu điều kiện khai thác |
| Claude (Anthropic) | Ghim thuật toán JWT HS256 | `src/backend/src/api/middlewares/authMiddleware.js` | ST-10 vẫn PASS (token `alg: none` → 401) |
| Claude (Anthropic) | Soạn khung PDF Bài tập 3 | `BT3_2374802010542_NguyenHoangTuan.pdf` | Mọi ảnh ở mục 7 do em tự chạy và chụp; đối chiếu số liệu trong PDF với `docs/` của tag `v1.0` |
| — không dùng AI — | Chạy phép thử máy trắng, `npm audit`, chụp ảnh minh chứng, gắn tag `v1.0` | — | Không áp dụng |

*Tôi xác nhận đã đọc, hiểu và chịu trách nhiệm về toàn bộ nội dung nộp, kể cả từng test case và từng dòng của Deployment Guide.* – Nguyễn Hoàng Tuấn · 2374802010542 · 13/11/2026
