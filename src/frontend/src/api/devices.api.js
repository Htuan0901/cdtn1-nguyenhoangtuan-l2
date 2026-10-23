import { request } from './client.js';

// E3 – tra cứu theo Serial/IMEI; gửi kèm modelName… để ghi nhận thiết bị mới
export const registerOrFindDevice = (input) => request('/devices', { method: 'POST', body: input });
