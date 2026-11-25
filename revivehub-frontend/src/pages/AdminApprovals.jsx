import { useState } from 'react';
import AdminSidebar from '../components/AdminSidebar.jsx';
import useApi from '../hooks/useApi.js';
import { listPending, listAllListings, decideListing } from '../api/listings.js';
import { formatINR, conditionLabel } from '../data/mockData.js';
import './Admin.css';

export default function AdminApprovals() {
  const pending = useApi(listPending, []);
  const all = useApi(listAllListings, []);
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function decide(item, decision) {
    setError('');
    setNotice('');
    try {
      await decideListing(item.id, decision, reason);
      setNotice(decision === 'approve' ? `"${item.title}" is now live.` : `"${item.title}" returned to the seller as a draft.`);
      setRejectingId(null);
      setReason('');
      pending.reload();
      all.reload();
    } catch (e) {
      setError(e.message);
    }
  }

  const rows = pending.data || [];
  const everything = all.data || [];
  const live = everything.filter((l) => l.status === 'live').length;
  const returned = everything.filter((l) => l.status === 'draft' && l.rejectReason).length;

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <h1 className="admin-title">Listing approvals</h1>
        <p className="admin-sub">Review new listings before they go live.</p>

        <div className="stat-row">
          <div className="stat"><span>Pending</span><strong>{rows.length}</strong></div>
          <div className="stat"><span>Live</span><strong className="green">{live}</strong></div>
          <div className="stat"><span>Returned to draft</span><strong className="red">{returned}</strong></div>
        </div>

        {notice && <div className="banner banner-ok" style={{ marginBottom: 16 }}>{notice}</div>}
        {error && <div className="banner banner-error" style={{ marginBottom: 16 }} role="alert">{error}</div>}

        <div className="table-card" role="table" aria-label="Pending listings">
          <div className="table-head" role="row">
            <div style={{ flex: 3 }}>Listing</div>
            <div style={{ flex: 2 }}>Seller</div>
            <div style={{ flex: 1 }}>Qty</div>
            <div style={{ flex: 1 }}>Price</div>
            <div style={{ flex: 2.5 }}>Action</div>
          </div>
          {rows.length === 0 && !pending.loading && (
            <div className="table-row"><span className="row-meta">Nothing waiting for review.</span></div>
          )}
          {rows.map((item) => (
            <div className="table-row" role="row" key={item.id}>
              <div style={{ flex: 3, minWidth: 0 }}>
                <strong>{item.title}</strong>
                <div className="row-meta">
                  {item.category} · {conditionLabel(item.condition)} · {item.city}
                  {item.photos?.length ? ` · ${item.photos.length} photo(s)` : ''}
                </div>
              </div>
              <div style={{ flex: 2, minWidth: 0 }}>{item.sellerName}</div>
              <div style={{ flex: 1 }}>{item.quantity}</div>
              <div style={{ flex: 1 }}>{formatINR(item.pricePerUnit)}</div>
              <div style={{ flex: 2.5, minWidth: 0 }} className="row-actions">
                {rejectingId === item.id ? (
                  <>
                    <input
                      className="input"
                      style={{ padding: '8px 10px', fontSize: 14 }}
                      placeholder="Reason for the seller"
                      aria-label="Reason for rejection"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      autoFocus
                    />
                    <button type="button" className="btn btn-reject btn-small" onClick={() => decide(item, 'reject')}>Send back</button>
                    <button type="button" className="link-btn" onClick={() => { setRejectingId(null); setReason(''); }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button type="button" className="btn btn-primary btn-small" onClick={() => decide(item, 'approve')}>Approve</button>
                    <button type="button" className="btn btn-reject btn-small" onClick={() => { setRejectingId(item.id); setReason(''); setError(''); }}>Reject</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="admin-note">
          Rejecting a listing returns it to Draft with your reason so the seller can fix and resubmit it.
        </p>
      </main>
    </div>
  );
}
