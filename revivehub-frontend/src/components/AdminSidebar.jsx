import { NavLink, useNavigate } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="admin-sidebar">
      <Logo light />
      <nav aria-label="Admin">
        <NavLink to="/admin/approvals">Listing approvals</NavLink>
        <NavLink to="/admin/reports">Orders &amp; commission</NavLink>
        <button type="button" className="side-logout" onClick={handleLogout}>
          Log out
        </button>
      </nav>
      <div className="signed-in">Signed in as {user?.name}</div>
    </aside>
  );
}
