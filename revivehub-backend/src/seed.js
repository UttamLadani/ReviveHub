// Fills the database with SAMPLE data for the demo (all made up).
//
//   npm run seed                 first-time fill (stops if users already exist)
//   npm run seed -- --reset      wipe users, listings and orders, then fill again
//   npm run seed:admin           only create the admin account (from ADMIN_EMAIL / ADMIN_PASSWORD)

import fs from 'fs';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { config, assertConfig } from './config.js';
import User from './models/User.js';
import Listing from './models/Listing.js';
import Order from './models/Order.js';
import Counter from './models/Counter.js';

assertConfig();
const sample = JSON.parse(fs.readFileSync(new URL('./data/sampleData.json', import.meta.url), 'utf8'));
const args = process.argv.slice(2);
const adminOnly = args.includes('--admin-only');
const reset = args.includes('--reset');

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 });

async function ensureAdmin() {
  const email = config.adminEmail.toLowerCase();
  if (await User.exists({ email })) {
    console.log(`Admin ${email} already exists.`);
    return;
  }
  await User.create({
    name: 'Admin',
    business: 'ReviveHub',
    email,
    passwordHash: await bcrypt.hash(config.adminPassword, 10),
    role: 'admin',
  });
  console.log(`Created admin account: ${email}`);
}

if (adminOnly) {
  await ensureAdmin();
  await mongoose.disconnect();
  process.exit(0);
}

if (reset) {
  await Promise.all([User.deleteMany({}), Listing.deleteMany({}), Order.deleteMany({}), Counter.deleteMany({})]);
  console.log('Old data removed.');
} else if (await User.exists({})) {
  console.error('The database already has data. Run "npm run seed -- --reset" to wipe it and fill again.');
  await mongoose.disconnect();
  process.exit(1);
}

await ensureAdmin();

const hash = (p) => bcrypt.hash(p, 10);
const unusable = async () => hash(crypto.randomBytes(24).toString('hex')); // sample accounts nobody can log in to

const [demoSeller, demoBuyer, sampleSeller, sampleBuyer] = await User.create([
  { name: 'Demo Seller', business: 'Demo Startup', email: 'seller@revivehub.demo', passwordHash: await hash('Seller@123'), role: 'seller' },
  { name: 'Demo Buyer', business: 'Demo Traders', email: 'buyer@revivehub.demo', passwordHash: await hash('Buyer@123'), role: 'buyer' },
  { name: 'Sample Seller', business: 'Sample Startups', email: 'sample-seller@revivehub.invalid', passwordHash: await unusable(), role: 'seller' },
  { name: 'Sample Buyer', business: 'Sample Resellers', email: 'sample-buyer@revivehub.invalid', passwordHash: await unusable(), role: 'buyer' },
]);

// live listings: the first two belong to the demo seller so "My listings" is not empty
const live = await Listing.create(
  sample.listings.map((l, i) => ({
    sellerId: i < 2 ? demoSeller._id : sampleSeller._id,
    sellerName: i < 2 ? demoSeller.business : l.seller,
    title: l.title,
    category: l.category,
    condition: l.condition,
    quantity: l.quantity,
    originalPrice: l.originalPrice,
    pricePerUnit: l.pricePerUnit,
    aiPrice: l.aiPrice,
    city: l.city,
    description: l.description,
    status: 'live',
  }))
);

const conditionFrom = (label = '') => ({ new: 'new', 'open-box': 'open-box', used: 'used' })[label.toLowerCase()] || 'new';
await Listing.create(
  sample.pendingListings.map((p) => {
    const [category, cond] = p.meta.split(' · ');
    return {
      sellerId: sampleSeller._id,
      sellerName: p.seller,
      title: p.title,
      category,
      condition: conditionFrom(cond),
      quantity: p.quantity,
      originalPrice: p.pricePerUnit * 2,
      pricePerUnit: p.pricePerUnit,
      aiPrice: p.pricePerUnit,
      city: 'Mumbai',
      description: 'Sample listing waiting for admin review.',
      status: 'pending',
    };
  })
);

let highest = 0;
for (const [i, o] of sample.orders.entries()) {
  const listing = live.find((l) => l.title === o.listing);
  const quantity = listing ? Math.max(1, Math.round(o.salePrice / listing.pricePerUnit)) : 1;
  const closed = o.status === 'Closed';
  const amount = (o.salePrice * config.commissionRate) / 100;
  await Order.create({
    _id: o.id,
    listingId: listing ? listing._id : live[0]._id,
    listingTitle: o.listing,
    buyerId: sampleBuyer._id,
    buyerName: o.buyer,
    sellerId: listing ? listing.sellerId : sampleSeller._id,
    quantity,
    salePrice: o.salePrice,
    deliveryMode: 'courier',
    days: '3–7 days',
    status: o.status,
    commission: closed ? { rate: config.commissionRate, amount, payout: o.salePrice - amount } : null,
    createdAt: new Date(Date.UTC(2026, 9, 12 - i, 10)),
  });
  highest = Math.max(highest, Number(o.id.replace('RH-', '')) - config.orderNumberBase);
}
await Counter.updateOne({ _id: 'order' }, { $set: { seq: highest } }, { upsert: true });

console.log('\nSample data created:');
console.log(`  users:    admin, ${demoSeller.email}, ${demoBuyer.email} (+2 sample accounts nobody can log in to)`);
console.log(`  listings: ${live.length} live, ${sample.pendingListings.length} pending`);
console.log(`  orders:   ${sample.orders.length}`);
console.log('\nDemo logins are in the README.\n');
await mongoose.disconnect();
