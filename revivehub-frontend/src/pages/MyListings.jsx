import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AppHeader from '../components/AppHeader.jsx';
import StatusChip, { LISTING_STATUS_LABEL } from '../components/StatusChip.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import useApi from '../hooks/useApi.js';
import { listMyListings, withdrawListing } from '../api/listings.js';
import { listOrdersForSeller, advanceOrder } from '../api/orders.js';
import { formatINR } from '../data/mockData.js';
import './MyListings.css';

export default function MyListings() {
  const { user } = useAuth();
  const location = useLocation();
  const [notice, setNotice] = useState(location.state?.notice || '');
  const [error, setError] = useState('');

  const listings = useApi(() => listMyListings(user.id), [user.id]);
  const orders = useApi(() => listOrdersForSeller(user.id), [user.id]);

  async function run(fn, okMessage) {
    setError('');
    setNotice('');
    try {
      await fn();
      setNotice(okMessage);
      listings.reload();
      orders.reload();
    } catch (e) {
      setError(e.message);
    }
  }

  function withdraw(l) {
    if (window.confirm(`Withdraw "${l.title}" from the marketplace?`)) {
      run(() => withdrawListing(l.id, user), 'Listing withdrawn.');
    }
  }

  const rows = listings.data || [];
  const orderRows = orders.data || [];
  const actionable = orderRows.filter((o) => o.status === 'Pending' || o.status === 'Confirmed');

  return (
    <div>
      <AppHeader />
      <main className="container ml-main">
        <div className="ml-top">
          <div>
            <h1>My listings</h1>
            <p>Track each lot from draft to sold.</p>
          </div>
          <Link to="/seller/create" className="btn btn-primary">+ New listing</Link>
        </div>

        {notice && <div className="banner banner-ok ml-msg">{notice}</div>}
        {error && <div className="banner banner-error ml-msg" role="alert">{error}</div>}

        <div className="table-card">
          <div className="table-head">
            <div style={{ flex: 3 }}>Listing</div>
            <div style={{ flex: 1 }}>Qty left</div>
            <div style={{ flex: 1 }}>Price</div>
            <div style={{ flex: 1.5 }}>Status</div>
            <div style={{ flex: 2 }}>Action</div>
          </div>
          {rows.length === 0 && !listings.loading && (
            <div className="ml-empty">
              No listings yet. <Link to="/seller/create">Create your first listing</Link> or{' '}
              <Link to="/seller/create#csv">import a CSV</Link>.
            </div>
          )}
          {rows.map((l) => (
            <div className="table-row" key={l.id}>
              <div style={{ flex: 3, minWidth: 0 }}>
                <strong>{l.title || '(untitled)'}</strong>
                <div className="row-meta">{l.category || 'No category'} · {l.city || 'No city'}</div>
                {l.status === 'draft' && l.rejectReason && (
                  <div className="ml-reject">Admin feedback: {l.rejectReason}</div>
                )}
              </div>
              <div style={{ flex: 1 }}>{l.quantity}</div>
              <div style={{ flex: 1 }}>{l.pricePerUnit ? formatINR(l.pricePerUnit) : '–'}</div>
              <div style={{ flex: 1.5 }}>
                <StatusChip status={LISTING_STATUS_LABEL[l.status]} />
              </div>
              <div style={{ flex: 2 }} className="row-actions">
                {l.status === 'draft' && (
                  <Link to={`/seller/create?edit=${l.id}`} className="btn btn-primary btn-small">Edit &amp; submit</Link>
                )}
                {l.status === 'pending' && <span className="ml-wait">Awaiting admin review</span>}
                {l.status === 'live' && (
                  <button type="button" className="btn btn-reject btn-small" onClick={() => withdraw(l)}>Withdraw</button>
                )}
                {(l.status === 'sold' || l.status === 'closed') && <span className="ml-wait">–</span>}
              </div>
            </div>
          ))}
        </div>

        <h2 className="ml-sub">Incoming orders</h2>
        <div className="table-card">
          <div className="table-head">
            <div style={{ flex: 1 }}>Order</div>
            <div style={{ flex: 2.5 }}>Lot</div>
            <div style={{ flex: 1.5 }}>Buyer</div>
            <div style={{ flex: 1 }}>Sale</div>
            <div style={{ flex: 1.2 }}>Status</div>
            <div style={{ flex: 2 }}>Action</div>
          </div>
          {orderRows.length === 0 && <div className="ml-empty">No orders yet.</div>}
          {orderRows.map((o) => (
            <div className="table-row small" key={o.id}>
              <div style={{ flex: 1 }}><strong>#{o.id}</strong></div>
              <div style={{ flex: 2.5, minWidth: 0 }}>{o.listingTitle} × {o.quantity}</div>
              <div style={{ flex: 1.5, minWidth: 0 }}>{o.buyerName}</div>
              <div style={{ flex: 1 }}>{formatINR(o.salePrice)}</div>
              <div style={{ flex: 1.2 }}><StatusChip status={o.status} /></div>
              <div style={{ flex: 2 }} className="row-actions">
                {o.status === 'Pending' && (
                  <>
                    <button type="button" className="btn btn-primary btn-small" onClick={() => run(() => advanceOrder(o.id, 'accept', user), `Order #${o.id} confirmed.`)}>Accept</button>
                    <button type="button" className="btn btn-reject btn-small" onClick={() => run(() => advanceOrder(o.id, 'decline', user), `Order #${o.id} declined.`)}>Decline</button>
                  </>
                )}
                {o.status === 'Confirmed' && (
                  <>
                    <button type="button" className="btn btn-primary btn-small" onClick={() => run(() => advanceOrder(o.id, 'dispatch', user), `Order #${o.id} marked as shipped.`)}>Dispatch</button>
                    <button type="button" className="btn btn-reject btn-small" onClick={() => run(() => advanceOrder(o.id, 'cancel', user), `Order #${o.id} cancelled.`)}>Cancel</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        {actionable.length > 0 && <p className="admin-note">{actionable.length} order(s) need your action.</p>}
      </main>
    </div>
  );
}
