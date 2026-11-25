import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import useApi from '../hooks/useApi.js';
import { getListing, saveListing, importListings } from '../api/listings.js';
import { CATEGORIES, CONDITIONS, formatINR } from '../data/mockData.js';
import { resizeImage } from '../utils/image.js';
import { CSV_COLUMNS, CSV_TEMPLATE, hasRequiredColumns, parseCsv } from '../utils/csv.js';
import './CreateListing.css';

const MAX_PHOTOS = 4;

// MOCK AI price suggestion.
// The real one is the Python microservice (regression model) described in the
// documentation. This stand-in only uses the original price and condition so
// the screen can be demonstrated.
function suggestPrice(originalPrice, condition) {
  const factor = { new: 0.5, 'open-box': 0.4, used: 0.3 }[condition];
  const price = Math.round(originalPrice * factor);
  return { price, low: Math.round(price * 0.9), high: Math.round(price * 1.1) };
}

const EMPTY = {
  title: '',
  category: '',
  condition: 'new',
  quantity: '',
  originalPrice: '',
  description: '',
  city: '',
  postalCode: '',
  price: '',
};

export default function CreateListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get('edit');

  const [form, setForm] = useState(EMPTY);
  const [photos, setPhotos] = useState([]);
  const [suggestion, setSuggestion] = useState(null);
  const [message, setMessage] = useState(null); // { type: 'ok' | 'error', text }
  const [dragging, setDragging] = useState(false);
  const [csvResult, setCsvResult] = useState(null); // { type, text, skipped }
  const [busy, setBusy] = useState(false);

  const photoInput = useRef(null);
  const csvInput = useRef(null);

  // Editing a draft? Load it into the form once.
  const editing = useApi(() => (editId ? getListing(editId) : Promise.resolve(null)), [editId]);
  const draft = editing.data;
  const draftOk = draft && draft.sellerId === user.id && draft.status === 'draft';

  useEffect(() => {
    if (!draftOk) return;
    setForm({
      title: draft.title,
      category: draft.category,
      condition: draft.condition,
      quantity: String(draft.quantity || ''),
      originalPrice: String(draft.originalPrice || ''),
      description: draft.description,
      city: draft.city,
      postalCode: draft.postalCode,
      price: String(draft.pricePerUnit || ''),
    });
    setPhotos(draft.photos || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftOk, editId]);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // ---------- photos ----------
  async function addFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setMessage({ type: 'error', text: `You can add up to ${MAX_PHOTOS} photos.` });
      return;
    }
    try {
      const added = [];
      for (const file of files.slice(0, room)) {
        added.push(await resizeImage(file));
      }
      setPhotos((prev) => [...prev, ...added]);
      setMessage(
        files.length > room
          ? { type: 'error', text: `Only ${MAX_PHOTOS} photos are allowed, so ${files.length - room} were skipped.` }
          : null
      );
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  const removePhoto = (index) => setPhotos((prev) => prev.filter((_, i) => i !== index));

  // ---------- AI suggestion ----------
  function getSuggestion() {
    const original = Number(form.originalPrice);
    if (!original) {
      setMessage({ type: 'error', text: 'Enter the original price per unit first, then ask for a suggestion.' });
      return;
    }
    setMessage(null);
    setSuggestion(suggestPrice(original, form.condition));
  }

  // ---------- save / submit ----------
  async function save(submit) {
    setBusy(true);
    setMessage(null);
    try {
      const saved = await saveListing(
        user,
        {
          id: draftOk ? draft.id : undefined,
          ...form,
          pricePerUnit: form.price,
          aiPrice: suggestion ? suggestion.price : draftOk ? draft.aiPrice : 0,
          photos,
        },
        { submit }
      );
      navigate('/seller/listings', {
        state: {
          notice: submit
            ? `"${saved.title}" was submitted. Its status is now Pending approval; an admin will review it.`
            : `"${saved.title}" was saved as a Draft. You can finish and submit it later.`,
        },
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      setBusy(false);
    }
  }

  // ---------- CSV ----------
  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob([CSV_TEMPLATE], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'revivehub-listings-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  async function onCsvChosen(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // lets the same file be chosen again
    if (!file) return;
    setCsvResult(null);
    try {
      const text = await file.text();
      if (!hasRequiredColumns(text)) {
        setCsvResult({
          type: 'error',
          text: `This file is missing required columns. Use the template. Columns: ${CSV_COLUMNS.join(', ')}.`,
        });
        return;
      }
      const rows = parseCsv(text);
      if (rows.length === 0) {
        setCsvResult({ type: 'error', text: 'The file has no item rows.' });
        return;
      }
      const result = await importListings(user, rows);
      setCsvResult({
        type: result.created > 0 ? 'ok' : 'error',
        text: `${result.created} listing(s) imported as Drafts. ${
          result.skipped.length ? `${result.skipped.length} row(s) skipped.` : ''
        }`,
        skipped: result.skipped,
      });
    } catch (err) {
      setCsvResult({ type: 'error', text: err.message });
    }
  }

  if (editId && !editing.loading && !draftOk) {
    return (
      <div className="create-page">
        <AppHeader />
        <main className="container create-main">
          <h1>Listing not editable</h1>
          <p className="create-lede">
            This listing was not found, is not yours, or was already submitted. A submitted listing cannot be
            edited or moved back to Draft.
          </p>
          <Link to="/seller/listings" className="btn btn-primary">Back to my listings</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="create-page">
      <AppHeader />

      <main className="container create-main">
        <div className="create-top">
          <div>
            <h1>{draftOk ? 'Edit draft' : 'Create a listing'}</h1>
            <p>Describe your lot. An admin reviews it before it goes live.</p>
          </div>
          <a href="#csv" className="csv-link">Upload many items with a CSV</a>
        </div>

        {draftOk && draft.rejectReason && (
          <div className="banner banner-info create-reject" role="status">
            An admin sent this listing back: “{draft.rejectReason}”. Fix it and submit again.
          </div>
        )}

        <div className="create-layout">
          <form className="create-form" onSubmit={(e) => { e.preventDefault(); save(true); }}>
            <section className="card">
              <h2>1. Item details</h2>
              <div className="form-stack">
                <div className="field">
                  <label htmlFor="cl-title">Listing title</label>
                  <input id="cl-title" className="input" value={form.title} onChange={set('title')} placeholder="e.g. Wireless earbuds, bulk lot" />
                </div>
                <div className="form-row">
                  <div className="field">
                    <label htmlFor="cl-cat">Category</label>
                    <select id="cl-cat" className="input" value={form.category} onChange={set('category')}>
                      <option value="">Select a category</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <span className="field-label" id="cond-label">Condition</span>
                    <div className="pill-group" role="group" aria-labelledby="cond-label">
                      {CONDITIONS.map((c) => (
                        <button
                          type="button"
                          key={c.value}
                          className={form.condition === c.value ? 'pill active' : 'pill'}
                          onClick={() => { setForm((p) => ({ ...p, condition: c.value })); setSuggestion(null); }}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="form-row">
                  <div className="field">
                    <label htmlFor="cl-qty">Quantity (units in this lot)</label>
                    <input id="cl-qty" className="input" type="number" min="1" step="1" value={form.quantity} onChange={set('quantity')} placeholder="e.g. 400" />
                  </div>
                  <div className="field">
                    <label htmlFor="cl-orig">Original price per unit (₹)</label>
                    <input id="cl-orig" className="input" type="number" min="1" value={form.originalPrice} onChange={(e) => { set('originalPrice')(e); setSuggestion(null); }} placeholder="e.g. 1999" />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="cl-desc">Description</label>
                  <textarea id="cl-desc" className="input" rows="4" value={form.description} onChange={set('description')} placeholder="Brand, specs, packaging, any defects" />
                </div>
              </div>
            </section>

            <section className="card">
              <h2>2. Photos</h2>
              <input
                ref={photoInput}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                tabIndex={-1}
                aria-label="Choose photos"
                onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
              />
              <div
                className={dragging ? 'dropzone dragging' : 'dropzone'}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4A5568" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 16l4-4 4 4 3-3 5 5" />
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <circle cx="9" cy="9" r="1.5" />
                </svg>
                <strong>Drop photos here</strong>
                <button type="button" className="btn btn-outline btn-small" onClick={() => photoInput.current.click()}>
                  Browse photos
                </button>
                <p>Up to {MAX_PHOTOS} photos. Clear photos help lots sell faster.</p>
              </div>
              {photos.length > 0 && (
                <ul className="photo-list">
                  {photos.map((src, i) => (
                    <li key={i}>
                      <img src={src} alt={`Listing photo ${i + 1}`} />
                      <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => removePhoto(i)}>×</button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card">
              <h2>3. Where is the stock?</h2>
              <p className="card-sub">Used to estimate delivery cost and time for buyers.</p>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="cl-city">City</label>
                  <input id="cl-city" className="input" value={form.city} onChange={set('city')} placeholder="e.g. Pune" />
                </div>
                <div className="field">
                  <label htmlFor="cl-pin">Postal code</label>
                  <input id="cl-pin" className="input" value={form.postalCode} onChange={set('postalCode')} placeholder="e.g. 411001" />
                </div>
              </div>
            </section>

            <section className="card">
              <h2>4. Your selling price</h2>
              <div className="field price-field">
                <label htmlFor="cl-price">Price per unit (₹)</label>
                <input id="cl-price" className="input" type="number" min="1" value={form.price} onChange={set('price')} placeholder="e.g. 899" />
                <span className="field-hint">Enter your own price or use the AI suggestion.</span>
              </div>
            </section>

            {message && (
              <div className={message.type === 'ok' ? 'banner banner-ok' : 'banner banner-error'} role="status">
                {message.text}
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={busy}>Submit for approval</button>
              <button type="button" className="btn btn-outline" disabled={busy} onClick={() => save(false)}>Save as draft</button>
            </div>
            <p className="create-lede small-print">
              Once submitted, a listing is Pending approval and cannot be edited or moved back to Draft.
            </p>
          </form>

          <aside className="create-side">
            <div className="ai-panel">
              <div className="ai-title">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9FD8C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 17l6-6 4 4 8-8" />
                  <path d="M14 7h7v7" />
                </svg>
                <h2>AI price suggestion</h2>
              </div>
              <p>
                Uses category, quantity, condition, original price and days since listing to suggest a fair
                liquidation price.
              </p>
              {!suggestion && (
                <button type="button" className="btn btn-light btn-block" onClick={getSuggestion}>
                  Get price suggestion
                </button>
              )}
              {suggestion && (
                <>
                  <div className="ai-result">
                    <span>Suggested price per unit</span>
                    <strong>{formatINR(suggestion.price)}</strong>
                    <small>Typical range: {formatINR(suggestion.low)} to {formatINR(suggestion.high)}</small>
                  </div>
                  <button type="button" className="btn btn-primary btn-block" onClick={() => setForm((p) => ({ ...p, price: String(suggestion.price) }))}>
                    Use suggested price
                  </button>
                  <button type="button" className="btn btn-ghost btn-block" onClick={() => setSuggestion(null)}>
                    Set my own price
                  </button>
                </>
              )}
              <small className="ai-mock-note">Demo logic only. The real model runs in the Python pricing service.</small>
            </div>

            <div className="card next-card">
              <h2>What happens next</h2>
              <ol>
                <li>Your listing is saved as <strong>Pending approval</strong></li>
                <li>An admin reviews it</li>
                <li>If approved, it goes <strong>Live</strong> for buyers</li>
                <li>If rejected, it returns to Draft with a reason</li>
              </ol>
            </div>
          </aside>
        </div>

        <section id="csv" className="card csv-card">
          <h2>Bulk upload with a CSV</h2>
          <p className="card-sub">
            Many items at once. Each row becomes a Draft that you can check and submit from My listings.
          </p>
          <input ref={csvInput} type="file" accept=".csv,text/csv" className="sr-only" tabIndex={-1} aria-label="Choose CSV file" onChange={onCsvChosen} />
          <div className="csv-actions">
            <button type="button" className="btn btn-dark btn-small" onClick={() => csvInput.current.click()}>Choose CSV file</button>
            <button type="button" className="btn btn-outline btn-small" onClick={downloadTemplate}>Download template</button>
          </div>
          <p className="field-hint csv-cols">Columns: {CSV_COLUMNS.join(', ')}</p>
          {csvResult && (
            <div className={csvResult.type === 'ok' ? 'banner banner-ok' : 'banner banner-error'} role="status">
              {csvResult.text}{' '}
              {csvResult.type === 'ok' && <Link to="/seller/listings">Go to my listings</Link>}
              {csvResult.skipped && csvResult.skipped.length > 0 && (
                <ul className="csv-skipped">
                  {csvResult.skipped.slice(0, 8).map((s) => (
                    <li key={s.line}>Line {s.line}: {s.reason}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
