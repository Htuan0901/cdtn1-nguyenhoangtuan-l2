import { request } from './client.js';

export const lookupCustomer = (phone) => request('/customers/lookup', { method: 'POST', body: { phone } }); // E1
export const createCustomer = (fullName, phone) =>                                                           // E2
  request('/customers', { method: 'POST', body: { fullName, phone } });
