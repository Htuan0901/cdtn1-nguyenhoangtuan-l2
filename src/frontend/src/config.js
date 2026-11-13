// Địa chỉ API backend.
// - Chạy trên máy / docker compose: mặc định http://localhost:3000/api (khớp PORT trong .env).
// - Bản deploy công khai: /env.js (do nền tảng sinh lúc build từ biến môi trường API_BASE_URL) đặt
//   window.__API_BASE_URL__ trước khi trang chạy – địa chỉ thật KHÔNG ghi cứng trong mã (TD-27).
export const API_BASE_URL = (typeof window !== 'undefined' && window.__API_BASE_URL__) || 'http://localhost:3000/api';
// Quá thời gian này mà API chưa trả lời → báo lỗi, không để màn hình "treo"
export const REQUEST_TIMEOUT_MS = 10000;
