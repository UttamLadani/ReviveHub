// Auth API.   POST /api/auth/register   POST /api/auth/login   GET /api/auth/me
// The server hashes passwords (bcrypt) and signs a JWT login token.

import { request, setToken, clearToken, getToken } from './http.js';

// who is logged in right now? (null when nobody)
export async function fetchSessionUser() {
  if (!getToken()) return null;
  try {
    return (await request('GET', '/auth/me')).user;
  } catch (e) {
    if (e.status === 401) return null; // token expired
    throw e;
  }
}

export async function registerUser({ name, business, email, password, role }) {
  const { token, user } = await request('POST', '/auth/register', { name, business, email, password, role });
  setToken(token);
  return user;
}

export async function loginUser(email, password) {
  const { token, user } = await request('POST', '/auth/login', { email, password });
  setToken(token);
  return user;
}

export function logoutUser() {
  clearToken();
}
