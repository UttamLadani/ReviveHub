import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../components/AppHeader.jsx';
import StatusChip from '../components/StatusChip.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import useApi from '../hooks/useApi.js';
import { listOrdersForBuyer, advanceOrder } from '../api/orders.js';
import { formatINR } from '../data/mockData.js';
import './MyListings.css';

export default function Orders() {
  const { user } = useAuth();
  const { data, loading, reload } = useApi(() => listOrdersForBuyer(user.id), [user.id]);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function act(order, action, msg) {
    if (action === 'cancel' && !window.confirm(`Cancel order #${order.id}?`)) return;
    setNotice('');
    setError('');
    try {
      await advanceOrder(order.id, action, user);
      setNotice(msg);
      reload();
    } catch (e) {
      setError(e.message);
    }
  }

  const rows = data || [];
  return (
    <div>
      <AppHeader />
      <main className="container ml-main">
        <div className="ml-top">
          <div>
            <h1>My orders</h1>
            <p>Orders you have placed with sellers.</p>
          </div>
          <Link to="/search" className="btn btn-primary">Browse lots</Link>
        </div>
        {notice && <div className="banner banner-ok ml-msg">{notice}</div>}
        {error && <div className="banner banner-error ml-msg" role="alert">{error}</div>}

        <div className="table-card">
          <div className="table-head">
            <div style={{ flex: 1 }}>Order</div>
            <div style={{ flex: 2.5 }}>Lot</div>
            <div style={{ flex: 1 }}>Total</div>
            <div style={{ flex: 1.2 }}>Status</div>
            <div style={{ flex: 2.2 }}>Action</div>
          </div>
          {rows.length === 0 && !loading && (
            <div className="ml-empty">You have not placed any orders yet.</div>
          )}
          {rows.map((o) => (
            <div className="table-row small" key={o.id}>
              <div style={{ flex: 1 }}><Link to={`/order/${o.id}`}><strong>#{o.id}</strong></Link></div>
              <div style={{ flex: 2.5, minWidth: 0 }}>{o.listingTitle} × {o.quantity}</div>
              <div style={{ flex: 1 }}>{formatINR(o.salePrice + o.deliveryCost)}</div>
              <div style={{ flex: 1.2 }}><StatusChip status={o.status} /></div>
              <div style={{ flex: 2.2 }} className="row-actions">
                <Link to={`/order/${o.id}`} className="btn btn-outline btn-small">View</Link>
                {o.status === 'Shipped' && (
                  <button type="button" className="btn btn-primary btn-small" onClick={() => act(o, 'receive', `Order #${o.id} marked as received.`)}>Mark as received</button>
                )}
                {(o.status === 'Pending' || o.status === 'Confirmed') && (
                  <button type="button" className="btn btn-reject btn-small" onClick={() => act(o, 'cancel', `Order #${o.id} cancelled.`)}>Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
