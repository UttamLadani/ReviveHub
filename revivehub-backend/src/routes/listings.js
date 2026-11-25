import { Router } from 'express';
import Listing from '../models/Listing.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { HttpError, wrap, assertObjectId, escapeRegex } from '../utils.js';

const router = Router();
router.use(requireAuth);

const CATEGORIES = ['Electronics', 'Apparel', 'Packaged goods', 'Furniture and equipment', 'Raw material', 'Other'];
const CONDITIONS = ['new', 'open-box', 'used'];
const MAX_PHOTOS = 4;
const MAX_PHOTO_CHARS = 1_500_000; // a resized photo is about 100 KB; this is a safety limit

const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

// Turns whatever the browser sent into clean listing fields.
function cleanFields(data = {}) {
  const photos = Array.isArray(data.photos)
    ? data.photos
        .filter((p) => typeof p === 'string' && p.startsWith('data:image/') && p.length <= MAX_PHOTO_CHARS)
        .slice(0, MAX_PHOTOS)
    : [];
  return {
    title: text(data.title, 120),
    category: CATEGORIES.includes(data.category) ? data.category : '',
    condition: CONDITIONS.includes(data.condition) ? data.condition : 'new',
    quantity: Math.floor(num(data.quantity)),
    originalPrice: num(data.originalPrice),
    pricePerUnit: num(data.pricePerUnit),
    aiPrice: num(data.aiPrice),
    city: text(data.city, 80),
    postalCode: text(data.postalCode, 12),
    description: text(data.description, 2000),
    photos,
  };
}

function missingFields(f) {
  const missing = [];
  if (!f.title) missing.push('title');
  if (!f.category) missing.push('category');
  if (!(Number.isInteger(f.quantity) && f.quantity > 0)) missing.push('quantity (whole number above 0)');
  if (!(f.originalPrice > 0)) missing.push('original price');
  if (!f.city) missing.push('city');
  if (!(f.pricePerUnit > 0)) missing.push('your selling price');
  return missing;
}

// ---------- buyers ----------

router.get(
  '/',
  requireRole('buyer', 'admin'),
  wrap(async (req, res) => {
    const q = req.query;
    const filter = { status: 'live', quantity: { $gt: 0 } };

    if (q.query && String(q.query).trim()) {
      const rx = new RegExp(escapeRegex(String(q.query).trim()), 'i');
      filter.$or = [{ title: rx }, { category: rx }, { description: rx }];
    }
    const list = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean);
    const categories = list(q.categories);
    const conditions = list(q.conditions);
    if (categories.length) filter.category = { $in: categories };
    if (conditions.length) filter.condition = { $in: conditions };

    const price = {};
    if (q.minPrice !== undefined && q.minPrice !== '' && Number.isFinite(Number(q.minPrice))) price.$gte = Number(q.minPrice);
    if (q.maxPrice !== undefined && q.maxPrice !== '' && Number.isFinite(Number(q.maxPrice))) price.$lte = Number(q.maxPrice);
    if (Object.keys(price).length) filter.pricePerUnit = price;

    if (q.city && String(q.city).trim()) filter.city = new RegExp(escapeRegex(String(q.city).trim()), 'i');

    const sort =
      q.sort === 'price-asc' ? { pricePerUnit: 1 } : q.sort === 'price-desc' ? { pricePerUnit: -1 } : { createdAt: -1 };
    res.json(await Listing.find(filter).sort(sort).limit(200));
  })
);

// ---------- sellers ----------
// (declared before "/:id" so "mine" is not read as an id)

router.get(
  '/mine',
  requireRole('seller'),
  wrap(async (req, res) => {
    res.json(await Listing.find({ sellerId: req.user._id }).sort({ createdAt: -1 }));
  })
);

// submit = false -> save as draft; submit = true -> send for approval (status pending)
async function save(req, res, existingId) {
  const submit = req.body.submit === true;
  const fields = cleanFields(req.body);
  if (submit) {
    const missing = missingFields(fields);
    if (missing.length) throw new HttpError(400, 'Please fill in: ' + missing.join(', ') + '.');
  } else if (!fields.title) {
    throw new HttpError(400, 'Give the draft a title first.');
  }

  let listing;
  if (existingId) {
    assertObjectId(existingId, 'Listing not found.');
    listing = await Listing.findOne({ _id: existingId, sellerId: req.user._id });
    if (!listing) throw new HttpError(404, 'Listing not found.');
    if (listing.status !== 'draft') {
      throw new HttpError(409, 'This listing was already submitted. A submitted listing cannot be edited or moved back to Draft.');
    }
    listing.set(fields);
  } else {
    listing = new Listing({
      ...fields,
      sellerId: req.user._id,
      sellerName: req.user.business || req.user.name,
    });
  }
  listing.status = submit ? 'pending' : 'draft';
  if (submit) listing.rejectReason = '';
  await listing.save();
  res.status(existingId ? 200 : 201).json(listing);
}

router.post('/', requireRole('seller'), wrap((req, res) => save(req, res, null)));
router.put('/:id', requireRole('seller'), wrap((req, res) => save(req, res, req.params.id)));

// rows come from the CSV the seller chose (parsed in the browser). They are saved as
// drafts so the seller can check them before submitting.
router.post(
  '/import',
  requireRole('seller'),
  wrap(async (req, res) => {
    const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
    if (rows.length > 500) throw new HttpError(400, 'Please import at most 500 rows at a time.');

    const docs = [];
    const skipped = [];
    rows.forEach((row, i) => {
      const line = i + 2; // line 1 is the header
      const wanted = text(row?.category, 60).toLowerCase();
      const category = CATEGORIES.find((c) => c.toLowerCase() === wanted) || 'Other';
      const condition = text(row?.condition, 20).toLowerCase();
      const fields = cleanFields({
        title: row?.title,
        category,
        condition: CONDITIONS.includes(condition) ? condition : 'new',
        quantity: row?.quantity,
        originalPrice: row?.original_price,
        pricePerUnit: row?.price,
        city: row?.city,
        postalCode: row?.postal_code,
        description: row?.description,
      });
      const missing = missingFields(fields);
      if (missing.length) {
        skipped.push({ line, reason: 'missing ' + missing.join(', ') });
        return;
      }
      docs.push({
        ...fields,
        sellerId: req.user._id,
        sellerName: req.user.business || req.user.name,
        status: 'draft',
      });
    });
    if (docs.length) await Listing.insertMany(docs);
    res.status(201).json({ created: docs.length, skipped });
  })
);

router.patch(
  '/:id/withdraw',
  requireRole('seller'),
  wrap(async (req, res) => {
    assertObjectId(req.params.id, 'Listing not found.');
    const listing = await Listing.findOne({ _id: req.params.id, sellerId: req.user._id });
    if (!listing) throw new HttpError(404, 'Listing not found.');
    if (listing.status !== 'live') throw new HttpError(409, 'Only live listings can be withdrawn.');
    listing.status = 'closed';
    await listing.save();
    res.json(listing);
  })
);

// ---------- one listing (any logged-in user, but drafts and pending ones stay private) ----------

router.get(
  '/:id',
  wrap(async (req, res) => {
    assertObjectId(req.params.id, 'Listing not found.');
    const listing = await Listing.findById(req.params.id);
    if (!listing) throw new HttpError(404, 'Listing not found.');
    const isOwner = String(listing.sellerId) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    const publicStatus = ['live', 'sold', 'closed'].includes(listing.status);
    if (!publicStatus && !isOwner && !isAdmin) throw new HttpError(404, 'Listing not found.');
    res.json(listing);
  })
);

export default router;
