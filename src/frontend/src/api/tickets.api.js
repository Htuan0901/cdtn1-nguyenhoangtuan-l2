// Nghiệp vụ phiếu bảo hành – E5..E8 trong docs/api-contract.md
import { request } from './client.js';

const enc = (code) => encodeURIComponent(code); // mã phiếu có dấu "/" → BH-000001%2F2026

export const listTickets = (filters) => request('/tickets', { query: filters });            // E6
export const getTicket = (code) => request(`/tickets/${enc(code)}`);                        // E7
export const createTicket = (input) => request('/tickets', { method: 'POST', body: input }); // E5
export const reviewTicket = (code, decision, note) =>                                        // E8
  request(`/tickets/${enc(code)}/review`, { method: 'POST', body: { decision, note } });
