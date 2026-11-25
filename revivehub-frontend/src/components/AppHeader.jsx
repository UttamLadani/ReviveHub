import { NavLink, useNavigate } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

// Top bar for signed-in Seller and Buyer screens.
export default function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isSeller = user?.role === 'seller';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="app-header">
      <div className="container">
        <Logo />
        <nav className="app-nav" aria-label="Main">
          {isSeller ? (
            <>
              <NavLink to="/seller/listings">My listings</NavLink>
              <NavLink to="/seller/create">Create listing</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/search">Browse lots</NavLink>
              <NavLink to="/orders">My orders</NavLink>
            </>
          )}
          <button type="button" className="nav-logout" onClick={handleLogout}>
            Log out
          </button>
          <span className={isSeller ? 'chip chip-green' : 'chip chip-blue'} title={user?.email}>
            {isSeller ? 'Seller' : 'Buyer'} · {user?.business}
          </span>
        </nav>
      </div>
    </header>
  );
}
