// One small helper that every function in src/api/ uses to talk to the backend.
// It adds the login token, and turns server errors into normal JavaScript errors
// whose message can be shown to the user.

const BASE = import.meta.env.VITE_API_URL || '/api'; // in development Vite forwards /api to the backend
const TOKEN_KEY = 'revivehub_token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}
export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export async function request(method, path, body) {
  const token = getToken();
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?');
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body
  }

  if (!res.ok) {
    // an expired or invalid token: log out everywhere
    if (res.status === 401 && token && !path.startsWith('/auth/login')) {
      clearToken();
      window.dispatchEvent(new Event('revivehub:logout'));
    }
    const err = new Error(data?.error || `Request failed (${res.status}).`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// like request(), but a 404 gives back null instead of an error
export async function requestOrNull(method, path) {
  try {
    return await request(method, path);
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}
