import { createContext, useContext, useEffect, useState } from 'react';
import { fetchSessionUser, loginUser, logoutUser, registerUser } from '../api/auth.js';

const AuthContext = createContext(null);

// Where each role lands after logging in.
export function homePathFor(role) {
  if (role === 'seller') return '/seller/listings';
  if (role === 'admin') return '/admin/approvals';
  return '/search';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false); // false while we ask the server who is logged in

  useEffect(() => {
    let active = true;
    fetchSessionUser()
      .then((u) => active && setUser(u))
      .catch(() => {})
      .finally(() => active && setReady(true));
    // the server said our token is no longer valid
    const onForcedLogout = () => setUser(null);
    window.addEventListener('revivehub:logout', onForcedLogout);
    return () => {
      active = false;
      window.removeEventListener('revivehub:logout', onForcedLogout);
    };
  }, []);

  const value = {
    user,
    async login(email, password) {
      const u = await loginUser(email, password);
      setUser(u);
      return u;
    },
    async register(data) {
      const u = await registerUser(data);
      setUser(u);
      return u;
    },
    logout() {
      logoutUser();
      setUser(null);
    },
  };

  if (!ready) return <p style={{ padding: 40 }}>Loading…</p>;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
