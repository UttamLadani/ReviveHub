// Listings API. Listing status values match the Listing state diagram:
//   draft -> pending -> live -> sold | closed
// A submitted listing cannot go back to draft by itself; only an admin
// rejection returns it to draft (with a reason). The server enforces this.
//
// The first argument of some functions (seller, user) is kept so the pages did
// not need to change; the server works out who you are from the login token.

import { request, requestOrNull } from './http.js';

// GET /api/listings?query=&categories=&conditions=&minPrice=&maxPrice=&city=&sort=
export async function searchListings(filters = {}) {
  const p = new URLSearchParams();
  if (filters.query) p.set('query', filters.query);
  if (filters.categories?.length) p.set('categories', filters.categories.join(','));
  if (filters.conditions?.length) p.set('conditions', filters.conditions.join(','));
  if (filters.minPrice) p.set('minPrice', filters.minPrice);
  if (filters.maxPrice) p.set('maxPrice', filters.maxPrice);
  if (filters.city) p.set('city', filters.city);
  if (filters.sort) p.set('sort', filters.sort);
  return request('GET', '/listings?' + p.toString());
}

export const getListing = (id) => requestOrNull('GET', '/listings/' + encodeURIComponent(id));

// ---------- sellers ----------

export const listMyListings = () => request('GET', '/listings/mine');

// submit = false -> save as draft; submit = true -> send for approval (status pending)
export function saveListing(_seller, data, { submit }) {
  const body = { ...data, submit: !!submit };
  return data.id
    ? request('PUT', '/listings/' + encodeURIComponent(data.id), body)
    : request('POST', '/listings', body);
}

// rows come from the CSV file (see utils/csv.js); the server saves them as drafts
export const importListings = (_seller, rows) => request('POST', '/listings/import', { rows });

export const withdrawListing = (id) => request('PATCH', `/listings/${encodeURIComponent(id)}/withdraw`);

// ---------- admin ----------

export const listAllListings = () => request('GET', '/admin/listings');
export const listPending = () => request('GET', '/admin/listings?status=pending');

// approve -> live;  reject -> back to draft with a reason the seller can read
export const decideListing = (id, decision, reason = '') =>
  request('PATCH', '/admin/listings/' + encodeURIComponent(id), { decision, reason });
