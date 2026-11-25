import { Link } from 'react-router-dom';
import { conditionLabel, formatINR } from '../data/mockData.js';
import './ListingCard.css';

const CONDITION_CHIP = {
  new: 'chip-green',
  'open-box': 'chip-amber',
  used: 'chip-gray',
};

export default function ListingCard({ listing }) {
  const photo = listing.photos && listing.photos[0];
  return (
    <Link to={`/listing/${listing.id}`} className="listing-card">
      {photo ? (
        <img className="listing-card-photo" src={photo} alt={listing.title} />
      ) : (
        <div className="photo-placeholder listing-card-photo">[Product photo]</div>
      )}
      <div className="listing-card-body">
        <div className="listing-card-top">
          <span className={`chip ${CONDITION_CHIP[listing.condition]}`}>
            {conditionLabel(listing.condition)}
          </span>
          <span className="listing-card-city">{listing.city}</span>
        </div>
        <h3>{listing.title}</h3>
        <p className="listing-card-meta">
          {listing.quantity} units · {listing.category}
        </p>
        <div className="listing-card-price">
          <strong>{formatINR(listing.pricePerUnit)}</strong>
          <span>per unit</span>
        </div>
      </div>
    </Link>
  );
}
