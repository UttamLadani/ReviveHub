// Orders API. Order status values match the Order state diagram:
//   Pending -> Confirmed -> Shipped -> Delivered -> Closed      (Cancelled before dispatch)
// The server decides who may move an order to which status, and records the
// commission when an admin closes an order.

import { request, requestOrNull } from './http.js';

// POST /api/orders
export const placeOrder = (_buyer, { listingId, quantity, mode, deliveryCost, days }) =>
  request('POST', '/orders', { listingId, quantity, mode, deliveryCost, days });

export const listOrdersForBuyer = () => request('GET', '/orders/mine');
export const listOrdersForSeller = () => request('GET', '/orders/seller');
export const listAllOrders = () => request('GET', '/admin/orders');

export const getOrder = (id) => requestOrNull('GET', '/orders/' + encodeURIComponent(id));

// action: accept | decline | dispatch | cancel | receive | close
export const advanceOrder = (orderId, action) =>
  request('PATCH', `/orders/${encodeURIComponent(orderId)}/status`, { action });
