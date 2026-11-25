import { useState } from 'react';
import AppHeader from '../components/AppHeader.jsx';
import ListingCard from '../components/ListingCard.jsx';
import { CATEGORIES, CONDITIONS } from '../data/mockData.js';
import { searchListings } from '../api/listings.js';
import useApi from '../hooks/useApi.js';
import './Search.css';

// Toggle a value in/out of an array held in state.
const toggle = (list, value) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

export default function Search() {
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [city, setCity] = useState('');
  const [sort, setSort] = useState('newest');

  // Later: GET /api/listings?q=...&category=...&condition=...&min=...&max=...&sort=...
  const { data, loading } = useApi(
    () => searchListings({ query, categories, conditions, minPrice, maxPrice, city, sort }),
    [query, categories.join(), conditions.join(), minPrice, maxPrice, city, sort]
  );
  const results = data || [];

  function clearFilters() {
    setQuery('');
    setCategories([]);
    setConditions([]);
    setMinPrice('');
    setMaxPrice('');
    setCity('');
  }

  return (
    <div>
      <AppHeader />

      <main className="container search-main">
        <h1>Browse lots</h1>

        <div className="field search-bar">
          <label htmlFor="s-q">Search</label>
          <input
            id="s-q"
            type="search"
            className="input search-input"
            placeholder="Search by item, category or keyword"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="search-layout">
          <aside className="filters card">
            <h2>Filters</h2>

            <fieldset>
              <legend>Category</legend>
              {CATEGORIES.filter((c) => c !== 'Other').map((c) => (
                <label key={c} className="check">
                  <input type="checkbox" checked={categories.includes(c)} onChange={() => setCategories(toggle(categories, c))} />
                  {c}
                </label>
              ))}
            </fieldset>

            <fieldset>
              <legend>Condition</legend>
              {CONDITIONS.map((c) => (
                <label key={c.value} className="check">
                  <input type="checkbox" checked={conditions.includes(c.value)} onChange={() => setConditions(toggle(conditions, c.value))} />
                  {c.label}
                </label>
              ))}
            </fieldset>

            <div>
              <div className="field-label price-label">Price per unit (₹)</div>
              <div className="price-range">
                <label className="sr-only" htmlFor="s-min">Minimum price</label>
                <input id="s-min" className="input small" type="number" min="0" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                <span aria-hidden="true">–</span>
                <label className="sr-only" htmlFor="s-max">Maximum price</label>
                <input id="s-max" className="input small" type="number" min="0" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label htmlFor="s-loc">Seller city</label>
              <input id="s-loc" className="input small" placeholder="e.g. Pune" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>

            <button type="button" className="btn btn-dark btn-block" onClick={clearFilters}>Clear filters</button>
          </aside>

          <section className="results">
            <div className="results-top">
              <p>
                <strong>{results.length} {results.length === 1 ? 'lot' : 'lots'}</strong> match your search
              </p>
              <div className="sort">
                <label htmlFor="s-sort">Sort by</label>
                <select id="s-sort" className="input small" value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                </select>
              </div>
            </div>

            {!loading && results.length === 0 ? (
              <div className="empty card">
                <h2>No lots match these filters</h2>
                <p>Try removing a filter or searching for something broader.</p>
                <button type="button" className="btn btn-primary" onClick={clearFilters}>Clear filters</button>
              </div>
            ) : (
              <div className="results-grid">
                {results.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
