import { request } from './client.js';

// E3 – tra cứu theo Serial/IMEI; gửi kèm modelName… để ghi nhận thiết bị mới
export const registerOrFindDevice = (input) => request('/devices', { method: 'POST', body: input });
export const updateDevice = (id, changes) => request(`/devices/${id}`, { method: 'PATCH', body: changes }); // E14
export const deleteDevice = (id) => request(`/devices/${id}`, { method: 'DELETE' });                       // E15
