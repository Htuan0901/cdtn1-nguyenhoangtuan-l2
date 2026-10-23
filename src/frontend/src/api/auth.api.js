import { request } from './client.js';

// E0 – POST /api/auth/login → { token, staff }
export const login = (username, password) =>
  request('/auth/login', { method: 'POST', body: { username, password }, auth: false });
