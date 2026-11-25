import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import { useAuth, homePathFor } from '../auth/AuthContext.jsx';
import './Auth.css';

const CHECK = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9FD8C6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12l5 5L20 7" />
  </svg>
);

const EMPTY_LOGIN = { email: '', password: '' };
const EMPTY_REGISTER = { name: '', business: '', email: '', password: '' };

export default function Auth() {
  const { user, login, register, logout } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [mode, setMode] = useState(params.get('mode') === 'register' ? 'register' : 'login');
  const [role, setRole] = useState(params.get('role') === 'buyer' ? 'buyer' : 'seller');
  const [loginForm, setLoginForm] = useState(EMPTY_LOGIN);
  const [regForm, setRegForm] = useState(EMPTY_REGISTER);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const setLogin = (field) => (e) => setLoginForm((p) => ({ ...p, [field]: e.target.value }));
  const setReg = (field) => (e) => setRegForm((p) => ({ ...p, [field]: e.target.value }));

  function switchMode(next) {
    setMode(next);
    setError('');
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await login(loginForm.email, loginForm.password);
      navigate(homePathFor(u.role));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await register({ ...regForm, role });
      navigate(homePathFor(u.role));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <aside className="auth-aside">
        <Logo light size={30} />
        <div>
          <h1>Give unsold stock a second life.</h1>
          <p>
            Sellers list leftover inventory. Buyers find bulk lots at liquidation prices. Every
            listing is reviewed by an admin first.
          </p>
          <ul>
            <li>{CHECK}AI-suggested liquidation price</li>
            <li>{CHECK}Delivery cost and time shown before you order</li>
            <li>{CHECK}Commission only on successful sales</li>
          </ul>
        </div>
        <span className="auth-aside-foot">Mini project · MERN stack</span>
      </aside>

      <main className="auth-main">
        <div className="auth-box">
          {user ? (
            <div className="auth-form">
              <h2>You're logged in</h2>
              <p className="auth-sub">
                {user.name} ({user.business}) · {user.role}
              </p>
              <Link to={homePathFor(user.role)} className="btn btn-primary btn-block">
                Go to my dashboard
              </Link>
              <button type="button" className="btn btn-outline btn-block" onClick={logout}>
                Log out
              </button>
            </div>
          ) : (
            <>
              <div className="auth-tabs" role="tablist">
                <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>
                  Log in
                </button>
                <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')}>
                  Create account
                </button>
              </div>

              {error && <div className="banner banner-error auth-msg" role="alert">{error}</div>}

              {mode === 'login' ? (
                <form key="login-form" onSubmit={handleLogin} className="auth-form" autoComplete="on">
                  <h2>Welcome back</h2>
                  <p className="auth-sub">Log in to manage your listings or orders.</p>
                  <div className="field">
                    <label htmlFor="login-email">Email</label>
                    <input id="login-email" name="email" className="input" type="email" autoComplete="username" placeholder="you@company.com" value={loginForm.email} onChange={setLogin('email')} required />
                  </div>
                  <div className="field">
                    <label htmlFor="login-pass">Password</label>
                    <input id="login-pass" name="password" className="input" type="password" autoComplete="current-password" placeholder="Your password" value={loginForm.password} onChange={setLogin('password')} required />
                  </div>
                  <button type="submit" className="btn btn-primary btn-block" disabled={busy}>Log in</button>
                </form>
              ) : (
                <form key="register-form" onSubmit={handleRegister} className="auth-form" autoComplete="on">
                  <h2>Create your account</h2>
                  <p className="auth-sub">Choose how you will use ReviveHub.</p>
                  <div className="role-choice">
                    <button type="button" className={role === 'seller' ? 'active' : ''} onClick={() => setRole('seller')}>
                      <strong>I'm a seller</strong>
                      <span>Closing down, have stock</span>
                    </button>
                    <button type="button" className={role === 'buyer' ? 'active' : ''} onClick={() => setRole('buyer')}>
                      <strong>I'm a buyer</strong>
                      <span>Business or reseller</span>
                    </button>
                  </div>
                  <div className="field">
                    <label htmlFor="reg-name">Full name</label>
                    <input id="reg-name" name="name" className="input" type="text" autoComplete="name" placeholder="Your name" value={regForm.name} onChange={setReg('name')} required />
                  </div>
                  <div className="field">
                    <label htmlFor="reg-biz">Business name</label>
                    <input id="reg-biz" name="organization" className="input" type="text" autoComplete="organization" placeholder="Company or startup name" value={regForm.business} onChange={setReg('business')} required />
                  </div>
                  <div className="field">
                    <label htmlFor="reg-email">Email</label>
                    <input id="reg-email" name="email" className="input" type="email" autoComplete="email" placeholder="you@company.com" value={regForm.email} onChange={setReg('email')} required />
                  </div>
                  <div className="field">
                    <label htmlFor="reg-pass">Password</label>
                    <input id="reg-pass" name="new-password" className="input" type="password" autoComplete="new-password" placeholder="At least 8 characters" value={regForm.password} onChange={setReg('password')} required minLength={8} />
                  </div>
                  {role === 'seller' && (
                    <div className="seller-note">
                      Sellers upload business registration proof from their profile after sign-up so
                      admins can verify them.
                    </div>
                  )}
                  <button type="submit" className="btn btn-primary btn-block" disabled={busy}>Create account</button>
                </form>
              )}
            </>
          )}

          <div className="auth-foot">
            <Link to="/" className="back-home">← Back to home</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
