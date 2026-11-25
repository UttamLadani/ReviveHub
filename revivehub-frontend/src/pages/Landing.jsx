import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import { formatINR } from '../data/mockData.js';
import { useAuth, homePathFor } from '../auth/AuthContext.jsx';
import './Landing.css';

const STEPS = [
  { title: 'List your lot', text: 'Add category, quantity, condition, original price and photos. Upload many items at once with a CSV.' },
  { title: 'Get an AI price', text: 'Our pricing engine suggests a fair liquidation price. Accept it or set your own.' },
  { title: 'Admin approval', text: 'Every listing is reviewed before it goes live, so buyers can trust what they see.' },
  { title: 'Sell and ship', text: 'Buyers see delivery cost and time up front, order in bulk, and you ship.' },
];

export default function Landing() {
  const { user } = useAuth();
  const home = user ? homePathFor(user.role) : '/login';
  const sellerCta = !user ? '/login?mode=register&role=seller' : user.role === 'seller' ? '/seller/create' : home;
  const buyerCta = !user ? '/login?mode=register&role=buyer' : user.role === 'buyer' ? '/search' : home;
  return (
    <div className="landing">
      <header className="landing-header">
        <div className="container landing-header-inner">
          <Logo size={30} />
          <nav className="landing-nav" aria-label="Main">
            <a href="#how">How it works</a>
            <a href="#sellers">For sellers</a>
            <a href="#buyers">For buyers</a>
            {user ? (
              <Link to={home} className="btn btn-primary btn-small">Go to my dashboard</Link>
            ) : (
              <>
                <Link to="/login">Log in</Link>
                <Link to="/login?mode=register" className="btn btn-primary btn-small">Get started</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="container hero">
        <div className="hero-text">
          <span className="hero-badge">FOR STARTUPS THAT ARE CLOSING DOWN</span>
          <h1>Don't write off your stock. Revive it.</h1>
          <p>
            ReviveHub connects shutting-down startups with businesses that can still use their
            unsold inventory, with an AI-suggested price and a delivery estimate before anyone
            commits.
          </p>
          <div className="hero-actions">
            <Link to={sellerCta} className="btn btn-primary">List your stock</Link>
            <Link to={buyerCta} className="btn btn-outline">Browse lots</Link>
          </div>
        </div>

        <div className="hero-card-wrap">
          <div className="hero-card">
            <div className="hero-card-top">
              <span className="hero-card-label">SAMPLE LISTING</span>
              <span className="chip chip-green">Live</span>
            </div>
            <div className="photo-placeholder hero-card-photo">[Product photo]</div>
            <h3>Wireless earbuds, bulk lot</h3>
            <p className="hero-card-meta">Quantity: 400 · Condition: New · Ships from Pune</p>
            <div className="hero-card-stats">
              <div>
                <span>AI suggested price</span>
                <strong className="green">{formatINR(920)}</strong>
              </div>
              <div>
                <span>Delivery estimate</span>
                <strong>3–7 days</strong>
              </div>
            </div>
            <div className="hero-card-cta">Place order</div>
          </div>
        </div>
      </section>

      <section id="how" className="how">
        <div className="container">
          <h2>How ReviveHub works</h2>
          <p className="how-sub">Four steps from leftover stock to recovered capital.</p>
          <div className="how-grid">
            {STEPS.map((step, i) => (
              <div className="how-step" key={step.title}>
                <div className="how-num">{i + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container audience">
        <div id="sellers" className="audience-card seller">
          <span className="audience-label">FOR SELLERS</span>
          <h2>Recover capital from stock you can't sell.</h2>
          <ul>
            <li>Price guidance instead of guesswork</li>
            <li>Reach businesses and resellers who buy in bulk</li>
            <li>We earn a commission only when your lot sells</li>
          </ul>
          <Link to={sellerCta} className="btn btn-light">Start listing</Link>
        </div>
        <div id="buyers" className="audience-card buyer">
          <span className="audience-label">FOR BUYERS</span>
          <h2>Quality stock at liquidation prices.</h2>
          <ul>
            <li>Search by category, condition, price and location</li>
            <li>See the delivery estimate before you order</li>
            <li>Admin-approved listings only</li>
          </ul>
          <Link to={buyerCta} className="btn btn-primary">Browse lots</Link>
        </div>
      </section>

      <section className="container bulk-wrap">
        <div className="bulk-band">
          <div>
            <h2>Built for bulk, not 10-minute delivery</h2>
            <p>
              Quick-commerce apps serve everyday shoppers in minutes. ReviveHub serves one-time
              liquidations between businesses, with logistics-based delivery in 3–7 days.
            </p>
          </div>
          <Link to={user ? home : '/login?mode=register'} className="btn btn-primary">{user ? 'Go to my dashboard' : 'Create a free account'}</Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container landing-footer-inner">
          <strong>ReviveHub</strong>
          <span>AI-powered marketplace for unsold startup inventory</span>
          <span>Mini project · MERN stack</span>
        </div>
      </footer>
    </div>
  );
}
