import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, homePathFor } from './AuthContext.jsx';

// Only lets the right role into a page.
//  - not logged in      -> sent to /login
//  - wrong role         -> sent to that role's own home page
// NOTE: this only hides the pages. Real protection also needs the server to
// check the login token and role on every API request (backend step).
export default function ProtectedRoute({ role, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role !== role) return <Navigate to={homePathFor(user.role)} replace />;
  return children;
}
