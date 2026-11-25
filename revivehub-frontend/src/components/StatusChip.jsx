// One place that decides which colour each order / listing status gets.
const CHIP_CLASS = {
  // order statuses
  Pending: 'chip-amber',
  Confirmed: 'chip-amber',
  Shipped: 'chip-blue',
  Delivered: 'chip-blue',
  Closed: 'chip-green',
  Cancelled: 'chip-red',
  // listing statuses
  Draft: 'chip-gray',
  'Pending approval': 'chip-amber',
  Live: 'chip-green',
  Sold: 'chip-blue',
};

export const LISTING_STATUS_LABEL = {
  draft: 'Draft',
  pending: 'Pending approval',
  live: 'Live',
  sold: 'Sold',
  closed: 'Closed',
};

export default function StatusChip({ status }) {
  return <span className={`chip ${CHIP_CLASS[status] || 'chip-gray'}`}>{status}</span>;
}
