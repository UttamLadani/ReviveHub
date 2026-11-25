import { useState } from 'react';
import AdminSidebar from '../components/AdminSidebar.jsx';
import StatusChip from '../components/StatusChip.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import useApi from '../hooks/useApi.js';
import { listAllOrders, advanceOrder } from '../api/orders.js';
import { formatINR, COMMISSION_RATE } from '../data/mockData.js';
import './Admin.css';

export default function AdminReports() {
  const { user } = useAuth();
  const { data, reload } = useApi(listAllOrders, []);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const orders = data || [];

  async function closeOrder(o) {
    setError('');
    setNotice('');
    try {
      await advanceOrder(o.id, 'close', user);
      setNotice(`Order #${o.id} closed and commission recorded.`);
      reload();
    } catch (e) {
      setError(e.message);
    }
  }

  const activeOrders = orders.filter((o) => o.status !== 'Cancelled');
  const totalSales = activeOrders.reduce((sum, o) => sum + o.salePrice, 0);
  const totalCommission = orders.reduce((sum, o) => sum + (o.commission ? o.commission.amount : 0), 0);
  const awaitingDispatch = orders.filter((o) => o.status === 'Confirmed').length;

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <h1 className="admin-title">Orders &amp; commission</h1>
        <p className="admin-sub">Platform-wide view of orders and the commission earned.</p>

        <div className="stat-grid">
          <div className="stat"><span>Total orders</span><strong>{orders.length}</strong></div>
          <div className="stat"><span>Total sales value</span><strong>{formatINR(totalSales)}</strong></div>
          <div className="stat stat-green"><span>Commission earned</span><strong>{formatINR(totalCommission)}</strong></div>
          <div className="stat"><span>Awaiting dispatch</span><strong>{awaitingDispatch}</strong></div>
        </div>

        {notice && <div className="banner banner-ok" style={{ marginBottom: 16 }}>{notice}</div>}
        {error && <div className="banner banner-error" style={{ marginBottom: 16 }} role="alert">{error}</div>}

        <div className="table-card">
          <div className="table-title">
            <h2>Recent orders</h2>
            <span>Commission rate: {COMMISSION_RATE}% of sale price</span>
          </div>
          <div className="table-head">
            <div style={{ flex: 1.2 }}>Order</div>
            <div style={{ flex: 2 }}>Listing</div>
            <div style={{ flex: 1.3 }}>Buyer</div>
            <div style={{ flex: 1 }}>Sale price</div>
            <div style={{ flex: 1 }}>Commission</div>
            <div style={{ flex: 1.2 }}>Status</div>
            <div style={{ flex: 1.6 }}>Action</div>
          </div>
          {orders.map((o) => (
            <div className="table-row small" key={o.id}>
              <div style={{ flex: 1.2 }}><strong>#{o.id}</strong></div>
              <div style={{ flex: 2, minWidth: 0 }}>{o.listingTitle}</div>
              <div style={{ flex: 1.3, minWidth: 0 }}>{o.buyerName}</div>
              <div style={{ flex: 1 }}>{formatINR(o.salePrice)}</div>
              <div style={{ flex: 1 }}>{o.commission ? formatINR(o.commission.amount) : '–'}</div>
              <div style={{ flex: 1.2 }}><StatusChip status={o.status} /></div>
              <div style={{ flex: 1.6 }}>
                {o.status === 'Delivered' && (
                  <button type="button" className="btn btn-primary btn-small" onClick={() => closeOrder(o)}>Close &amp; record</button>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="admin-note">
          Commission is recorded when an order is Closed (after the buyer confirms delivery); cancelled orders earn none.
        </p>
      </main>
    </div>
  );
}
