// client.js – NƠI DUY NHẤT gọi fetch(). Các trang chỉ gọi hàm trong *.api.js.
// - Gắn JWT vào header Authorization
// - Chuyển mọi lỗi thành ApiError { status, code, message, fields } theo docs/api-contract.md
// - 401 → xoá token và đưa về trang đăng nhập
// - Quá REQUEST_TIMEOUT_MS → báo lỗi thay vì để màn hình treo
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../config.js';
import { session } from '../auth/session.js';

export class ApiError extends Error {
  constructor(status, code, message, fields = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export async function request(path, { method = 'GET', body, query, auth = true } = {}) {
  const url = new URL(API_BASE_URL + path);
  Object.entries(query || {}).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v); });

  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = session.token();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: ctrl.signal });
  } catch (err) {
    if (err.name === 'AbortError') throw new ApiError(0, 'TIMEOUT', 'Máy chủ không phản hồi sau 10 giây.');
    throw new ApiError(0, 'NETWORK_ERROR', `Không kết nối được máy chủ API (${API_BASE_URL}). Kiểm tra backend đã chạy chưa.`);
  } finally {
    clearTimeout(timer);
  }

  const data = await res.json().catch(() => null);
  if (res.status === 401 && auth) {
    session.clear();
    onUnauthorized(data?.message || 'Phiên đăng nhập đã hết hạn');
  }
  if (!res.ok) {
    throw new ApiError(res.status, data?.code || `HTTP_${res.status}`, data?.message || `Lỗi HTTP ${res.status}`, data?.fields || []);
  }
  return data;
}
