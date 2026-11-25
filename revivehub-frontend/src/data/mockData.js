// SAMPLE DATA ONLY.
// Every name, price and quantity below is made up so the screens look complete
// without a backend. When the Express + MongoDB API is ready, replace the
// imports of this file with API calls (fetch / axios).

export const COMMISSION_RATE = 8; // percent of the sale price (platform commission)

export const CATEGORIES = [
  'Electronics',
  'Apparel',
  'Packaged goods',
  'Furniture and equipment',
  'Raw material',
  'Other',
];

export const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'open-box', label: 'Open-box' },
  { value: 'used', label: 'Used' },
];

// Live (approved) listings shown to buyers.
export const listings = [
  {
    id: 'l1',
    title: 'Wireless earbuds, bulk lot',
    category: 'Electronics',
    condition: 'new',
    quantity: 400,
    pricePerUnit: 899,
    originalPrice: 1999,
    aiPrice: 920,
    city: 'Pune',
    seller: 'Sample Startup A',
    description:
      'Sealed retail boxes from a cancelled product line. Bluetooth 5, charging case included. Original packaging, no defects.',
    createdAt: '2026-10-09',
  },
  {
    id: 'l2',
    title: 'Cotton t-shirts, assorted sizes',
    category: 'Apparel',
    condition: 'new',
    quantity: 1200,
    pricePerUnit: 120,
    originalPrice: 399,
    aiPrice: 135,
    city: 'Surat',
    seller: 'Sample Startup B',
    description:
      'Unbranded round-neck cotton t-shirts in S, M, L and XL. Packed in sealed bundles of 10.',
    createdAt: '2026-10-08',
  },
  {
    id: 'l3',
    title: 'Ergonomic office chairs',
    category: 'Furniture and equipment',
    condition: 'open-box',
    quantity: 60,
    pricePerUnit: 2800,
    originalPrice: 7499,
    aiPrice: 3000,
    city: 'Bengaluru',
    seller: 'Sample Startup C',
    description:
      'Mesh-back chairs with adjustable armrests, used for a few weeks in a co-working space. Assembly required.',
    createdAt: '2026-10-07',
  },
  {
    id: 'l4',
    title: 'Protein snack bars, 24-pack cartons',
    category: 'Packaged goods',
    condition: 'new',
    quantity: 300,
    pricePerUnit: 450,
    originalPrice: 720,
    aiPrice: 470,
    city: 'Hyderabad',
    seller: 'Sample Startup D',
    description:
      'Sealed cartons of 24 bars. Best-before dates are printed on each carton; buyers should check them before ordering.',
    createdAt: '2026-10-06',
  },
  {
    id: 'l5',
    title: 'Refurbished laptops, 8 GB RAM',
    category: 'Electronics',
    condition: 'used',
    quantity: 35,
    pricePerUnit: 18500,
    originalPrice: 45000,
    aiPrice: 19200,
    city: 'Delhi',
    seller: 'Sample Startup E',
    description:
      'Office laptops from a shut-down team, factory reset with a fresh OS. Minor cosmetic wear. Chargers included.',
    createdAt: '2026-10-05',
  },
  {
    id: 'l6',
    title: 'Stainless steel sheets, 2 mm',
    category: 'Raw material',
    condition: 'new',
    quantity: 90,
    pricePerUnit: 2200,
    originalPrice: 3100,
    aiPrice: 2300,
    city: 'Ahmedabad',
    seller: 'Sample Startup F',
    description:
      'Leftover raw material from a cancelled manufacturing order. Sheets are 4 ft x 8 ft, stored indoors.',
    createdAt: '2026-10-03',
  },
];

// Listings waiting in the admin approval queue.
export const pendingListings = [
  { id: 'p1', title: 'LED desk lamps, bulk lot', meta: 'Electronics · New', seller: 'Sample Startup G', quantity: 250, pricePerUnit: 340 },
  { id: 'p2', title: 'Canvas tote bags', meta: 'Apparel · New', seller: 'Sample Startup H', quantity: 800, pricePerUnit: 60 },
  { id: 'p3', title: 'Standing desks, motorised', meta: 'Furniture and equipment · Open-box', seller: 'Sample Startup I', quantity: 24, pricePerUnit: 9800 },
  { id: 'p4', title: 'Cold-pressed juice bottles', meta: 'Packaged goods · New', seller: 'Sample Startup J', quantity: 500, pricePerUnit: 55 },
];

// Orders for the admin "Orders & commission" report.
// status values match the Order lifecycle state diagram in the documentation.
export const orders = [
  { id: 'RH-1006', listing: 'Protein snack bars, 24-pack cartons', buyer: 'Sample Reseller 1', salePrice: 112500, status: 'Closed' },
  { id: 'RH-1005', listing: 'Cotton t-shirts, assorted sizes', buyer: 'Sample Reseller 2', salePrice: 36000, status: 'Delivered' },
  { id: 'RH-1004', listing: 'Ergonomic office chairs', buyer: 'Sample Cafe Chain', salePrice: 84000, status: 'Shipped' },
  { id: 'RH-1003', listing: 'Refurbished laptops, 8 GB RAM', buyer: 'Sample School Trust', salePrice: 185000, status: 'Confirmed' },
  { id: 'RH-1002', listing: 'Wireless earbuds, bulk lot', buyer: 'Sample Reseller 3', salePrice: 44950, status: 'Pending' },
  { id: 'RH-1001', listing: 'Stainless steel sheets, 2 mm', buyer: 'Sample Workshop', salePrice: 66000, status: 'Cancelled' },
];

export function findListing(id) {
  return listings.find((l) => l.id === id);
}

export function formatINR(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function conditionLabel(value) {
  const found = CONDITIONS.find((c) => c.value === value);
  return found ? found.label : value;
}
