import { Link, useLocation, useParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import useApi from '../hooks/useApi.js';
import { getOrder } from '../api/orders.js';
import { getListing } from '../api/listings.js';
import { formatINR } from '../data/mockData.js';
import './OrderConfirmed.css';

// Steps follow the Order lifecycle state diagram in the documentation.
const STEPS = [
  { name: 'Pending', note: 'Waiting for seller' },
  { name: 'Confirmed', note: 'Seller accepts' },
  { name: 'Shipped', note: 'Seller dispatches' },
  { name: 'Delivered', note: 'You receive it' },
];

export default function OrderConfirmed() {
  const { id } = useParams();
  const { state } = useLocation();
  const { user } = useAuth();
  const { data: order, loading } = useApi(() => getOrder(id, user), [id, user.id]);
  const { data: listing } = useApi(() => (order ? getListing(order.listingId) : Promise.resolve(null)), [order?.listingId]);

  if (loading && !order) {
    return <div><AppHeader /><main className="done-main"><p>Loading…</p></main></div>;
  }
  if (!order) {
    return (
      <div>
        <AppHeader />
        <main className="done-main">
          <h1>Order not found</h1>
          <p>It does not exist, or it belongs to another account.</p>
          <div className="done-actions"><Link to="/orders" className="btn btn-primary">My orders</Link></div>
        </main>
      </div>
    );
  }

  const cancelled = order.status === 'Cancelled';
  const reached = order.status === 'Closed' ? 3 : STEPS.findIndex((s) => s.name === order.status);
  const pickup = order.deliveryMode === 'pickup';
  const photo = listing?.photos?.[0];

  return (
    <div>
      <AppHeader />
      <main className="done-main">
        <div className="done-head">
          <div className="done-tick">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#1F6F5C" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12l5 5L20 7" />
            </svg>
          </div>
          <h1>{state?.justPlaced ? 'Order placed' : `Order #${order.id}`}</h1>
          <p>
            {state?.justPlaced
              ? `Order #${order.id} is waiting for the seller to confirm it.`
              : `Placed on ${new Date(order.createdAt).toLocaleDateString()}.`}
          </p>
        </div>

        {cancelled && <div className="banner banner-error done-cancel">This order was cancelled.</div>}

        <section className="card done-card">
          <h2>Order status</h2>
          <ol className="steps">
            {STEPS.map((step, i) => (
              <li key={step.name} className={!cancelled && i === reached ? 'step current' : !cancelled && i < reached ? 'step current' : 'step'}>
                <span className="step-num">{i + 1}</span>
                <strong>{step.name}</strong>
                <small>{step.note}</small>
              </li>
            ))}
          </ol>
          {order.status === 'Closed' && <p className="done-closed">Order closed. Thank you!</p>}
        </section>

        <section className="card done-card">
          <h2>Order summary</h2>
          <div className="sum-item">
            {photo ? (
              <img className="sum-photo" src={photo} alt="" />
            ) : (
              <div className="photo-placeholder sum-photo">[Photo]</div>
            )}
            <div>
              <strong>{order.listingTitle}</strong>
              <p>{order.quantity} units · Status: {order.status}</p>
            </div>
          </div>
          <div className="sum-lines">
            <div><span>Goods</span><strong>{formatINR(order.salePrice)}</strong></div>
            <div>
              <span>{pickup ? 'Delivery (buyer pickup)' : 'Delivery (courier)'}</span>
              <strong>{pickup ? 'No charge' : formatINR(order.deliveryCost)}</strong>
            </div>
            <div>
              <span>{pickup ? 'Pickup location' : 'Estimated arrival'}</span>
              <strong>{pickup ? listing?.city || 'Seller location' : order.days || '3–7 days'}</strong>
            </div>
            <div className="grand"><span>Total</span><strong>{formatINR(order.salePrice + order.deliveryCost)}</strong></div>
          </div>
        </section>

        <div className="done-actions">
          <Link to="/search" className="btn btn-primary">Keep browsing</Link>
          <Link to="/orders" className="btn btn-outline">View my orders</Link>
        </div>
      </main>
    </div>
  );
}
