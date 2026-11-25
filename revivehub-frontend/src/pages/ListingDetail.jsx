import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader.jsx';
import { conditionLabel, formatINR } from '../data/mockData.js';
import { getListing } from '../api/listings.js';
import { placeOrder as placeOrderApi } from '../api/orders.js';
import { useAuth } from '../auth/AuthContext.jsx';
import useApi from '../hooks/useApi.js';
import { estimateDelivery } from '../data/delivery.js';
import './ListingDetail.css';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: listing, loading } = useApi(() => getListing(id), [id]); // later: GET /api/listings/:id
  const [busy, setBusy] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);

  const [qty, setQty] = useState(10);
  const [mode, setMode] = useState('courier'); // 'courier' | 'pickup'
  const [postalCode, setPostalCode] = useState('');
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState('');

  if (loading && !listing) {
    return (
      <div>
        <AppHeader />
        <main className="container detail-missing"><p>Loading…</p></main>
      </div>
    );
  }

  if (!listing || listing.status !== 'live') {
    return (
      <div>
        <AppHeader />
        <main className="container detail-missing">
          <h1>This lot is no longer available</h1>
          <p>It may have been sold, withdrawn or is not approved yet.</p>
          <Link to="/search" className="btn btn-primary">Back to results</Link>
        </main>
      </div>
    );
  }

  const quantity = Math.min(Math.max(qty, 1), listing.quantity);
  const goods = quantity * listing.pricePerUnit;
  const digits = postalCode.replace(/\D/g, '');

  // Recomputed on every render so it always matches the current quantity and postal code.
  const estimate = checked ? estimateDelivery(postalCode, quantity, goods) : null;

  const courierBlocked = mode === 'courier' && (!estimate || !estimate.feasible);
  const deliveryCost = mode === 'pickup' ? 0 : estimate ? estimate.cost : 0;
  const total = goods + deliveryCost;

  function checkDelivery() {
    if (digits.length < 4) {
      setError('Enter a valid postal code (at least 4 digits).');
      setChecked(false);
      return;
    }
    setError('');
    setChecked(true);
  }

  // Later: POST /api/orders  { listingId, quantity, deliveryMode, postalCode }
  async function placeOrder() {
    if (busy) return;
    if (courierBlocked) {
      setError(
        estimate
          ? 'Courier delivery is not economical for this order. Choose buyer pickup instead.'
          : 'Check the delivery estimate first, or choose buyer pickup.'
      );
      return;
    }
    setBusy(true);
    try {
      const order = await placeOrderApi(user, {
        listingId: listing.id,
        quantity,
        mode,
        deliveryCost,
        days: estimate?.days,
      });
      navigate(`/order/${order.id}`, { state: { justPlaced: true } });
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <div>
      <AppHeader />

      <main className="container detail-main">
        <Link to="/search" className="back-link">← Back to results</Link>

        <div className="detail-layout">
          <section className="detail-left">
            {listing.photos && listing.photos.length > 0 ? (
              <>
                <img className="detail-photo detail-photo-img" src={listing.photos[photoIdx] || listing.photos[0]} alt={listing.title} />
                {listing.photos.length > 1 && (
                  <div className="thumbs">
                    {listing.photos.map((p, i) => (
                      <button type="button" key={i} className={i === photoIdx ? 'thumb on' : 'thumb'} onClick={() => setPhotoIdx(i)} aria-label={`Photo ${i + 1}`}>
                        <img src={p} alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="photo-placeholder detail-photo">[No photo uploaded]</div>
            )}

            <div className="card">
              <h2>Lot details</h2>
              <dl className="spec-grid">
                <div><dt>Category</dt><dd>{listing.category}</dd></div>
                <div><dt>Condition</dt><dd>{conditionLabel(listing.condition)}</dd></div>
                <div><dt>Units available</dt><dd>{listing.quantity}</dd></div>
                <div><dt>Original price per unit</dt><dd>{formatINR(listing.originalPrice)}</dd></div>
                <div><dt>Ships from</dt><dd>{listing.city}</dd></div>
                <div><dt>Seller</dt><dd>{listing.sellerName}</dd></div>
              </dl>
              <p className="spec-desc">{listing.description}</p>
            </div>
          </section>

          <aside className="detail-right">
            <div className="card buy-card">
              <span className="chip chip-green">Live · admin approved</span>
              <h1>{listing.title}</h1>
              <div className="buy-price">
                <strong>{formatINR(listing.pricePerUnit)}</strong>
                <span>per unit</span>
              </div>
              <p className="ai-line">AI-suggested fair price: {formatINR(listing.aiPrice)}</p>

              <div className="field-label" id="qty-label">Quantity</div>
              <div className="qty" role="group" aria-labelledby="qty-label">
                <button type="button" aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, quantity - 1))}>−</button>
                <output aria-live="polite">{quantity}</output>
                <button type="button" aria-label="Increase quantity" onClick={() => setQty(Math.min(listing.quantity, quantity + 1))}>+</button>
                <span>units (max {listing.quantity})</span>
              </div>

              <div className="field-label" id="mode-label">How do you want to receive it?</div>
              <div className="pill-group mode-pills" role="group" aria-labelledby="mode-label">
                <button type="button" className={mode === 'courier' ? 'pill active' : 'pill'} onClick={() => { setMode('courier'); setError(''); }}>
                  Courier delivery
                </button>
                <button type="button" className={mode === 'pickup' ? 'pill active' : 'pill'} onClick={() => { setMode('pickup'); setError(''); }}>
                  I'll pick it up
                </button>
              </div>

              {mode === 'courier' ? (
                <div className="delivery-box">
                  <div className="field-label">Delivery estimate</div>
                  <div className="pin-row">
                    <label className="sr-only" htmlFor="ld-pin">Deliver to postal code</label>
                    <input id="ld-pin" className="input" placeholder="Your postal code" value={postalCode} onChange={(e) => { setPostalCode(e.target.value); setChecked(false); }} />
                    <button type="button" className="btn btn-dark btn-small" onClick={checkDelivery}>Check</button>
                  </div>
                  {estimate && (
                    <div className="estimate">
                      <div><span>Distance</span><strong>{estimate.distanceKm} km</strong></div>
                      <div><span>Estimated delivery cost</span><strong>{formatINR(estimate.cost)}</strong></div>
                      <div><span>Estimated time</span><strong>{estimate.days}</strong></div>
                      {estimate.feasible ? (
                        <p className="est-ok">Delivery is feasible for this lot</p>
                      ) : (
                        <p className="est-warn">
                          Delivery costs too much compared with the goods. Buyer pickup is recommended.
                        </p>
                      )}
                    </div>
                  )}
                  <p className="est-note">
                    If courier delivery costs too much compared to the goods, we will suggest buyer pickup instead.
                  </p>
                </div>
              ) : (
                <div className="delivery-box pickup">
                  <strong>Buyer pickup</strong>
                  <p>
                    You collect the lot from the seller in {listing.city}. No delivery charge. The seller shares
                    pickup details after confirming your order.
                  </p>
                </div>
              )}

              <div className="totals">
                <div><span>Goods ({quantity} units)</span><strong>{formatINR(goods)}</strong></div>
                <div>
                  <span>Delivery</span>
                  <strong>
                    {mode === 'pickup' ? 'No charge' : estimate ? formatINR(estimate.cost) : 'Check estimate above'}
                  </strong>
                </div>
                <div className="grand"><span>Total</span><strong>{formatINR(total)}</strong></div>
              </div>

              {error && <p className="buy-error" role="alert">{error}</p>}

              <button type="button" className="btn btn-primary btn-block" onClick={placeOrder} disabled={busy}>
                {busy ? 'Placing…' : 'Place order'}
              </button>
              <p className="buy-foot">The seller confirms your order after you place it.</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
