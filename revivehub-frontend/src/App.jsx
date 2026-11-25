import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import ProtectedRoute from './auth/ProtectedRoute.jsx';

import Landing from './pages/Landing.jsx';
import Auth from './pages/Auth.jsx';
import CreateListing from './pages/CreateListing.jsx';
import MyListings from './pages/MyListings.jsx';
import Search from './pages/Search.jsx';
import ListingDetail from './pages/ListingDetail.jsx';
import Orders from './pages/Orders.jsx';
import OrderConfirmed from './pages/OrderConfirmed.jsx';
import AdminApprovals from './pages/AdminApprovals.jsx';
import AdminReports from './pages/AdminReports.jsx';

// Scroll to top on every page change (but let #anchors work normally).
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth />} />

        {/* seller only */}
        <Route path="/seller/create" element={<ProtectedRoute role="seller"><CreateListing /></ProtectedRoute>} />
        <Route path="/seller/listings" element={<ProtectedRoute role="seller"><MyListings /></ProtectedRoute>} />

        {/* buyer only */}
        <Route path="/search" element={<ProtectedRoute role="buyer"><Search /></ProtectedRoute>} />
        <Route path="/listing/:id" element={<ProtectedRoute role="buyer"><ListingDetail /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute role="buyer"><Orders /></ProtectedRoute>} />
        <Route path="/order/:id" element={<ProtectedRoute role="buyer"><OrderConfirmed /></ProtectedRoute>} />

        {/* admin only */}
        <Route path="/admin/approvals" element={<ProtectedRoute role="admin"><AdminApprovals /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute role="admin"><AdminReports /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
