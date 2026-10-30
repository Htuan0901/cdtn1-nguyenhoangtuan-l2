import { request } from './client.js';

export const lookupCustomer = (phone) => request('/customers/lookup', { method: 'POST', body: { phone } }); // E1
export const createCustomer = (fullName, phone) =>                                                           // E2
  request('/customers', { method: 'POST', body: { fullName, phone } });
export const listCustomers = (q, page) => request('/customers', { query: { q, page } });                    // E9
export const getCustomer = (id) => request(`/customers/${id}`);                                             // E10
export const updateCustomer = (id, changes) => request(`/customers/${id}`, { method: 'PATCH', body: changes }); // E11
export const deleteCustomer = (id) => request(`/customers/${id}`, { method: 'DELETE' });                     // E12
