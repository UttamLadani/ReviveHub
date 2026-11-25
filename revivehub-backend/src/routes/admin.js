import { Router } from 'express';
import Listing from '../models/Listing.js';
import Order from '../models/Order.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { HttpError, wrap, assertObjectId } from '../utils.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

// all listings, or only one status: GET /api/admin/listings?status=pending
router.get(
  '/listings',
  wrap(async (req, res) => {
    const filter = req.query.status ? { status: String(req.query.status) } : {};
    // oldest first for the approval queue
    const sort = req.query.status === 'pending' ? { createdAt: 1 } : { createdAt: -1 };
    res.json(await Listing.find(filter).sort(sort));
  })
);

// approve -> live;  reject -> back to draft with a reason the seller can read
router.patch(
  '/listings/:id',
  wrap(async (req, res) => {
    assertObjectId(req.params.id, 'Listing not found.');
    const { decision } = req.body;
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim().slice(0, 500) : '';

    if (decision !== 'approve' && decision !== 'reject') throw new HttpError(400, 'Unknown decision.');
    if (decision === 'reject' && !reason) throw new HttpError(400, 'Please give the seller a reason for rejecting.');

    // only a listing that is still pending can be decided (also blocks double clicks)
    const update =
      decision === 'approve'
        ? { status: 'live', rejectReason: '' }
        : { status: 'draft', rejectReason: reason };
    const listing = await Listing.findOneAndUpdate({ _id: req.params.id, status: 'pending' }, update, { new: true });
    if (!listing) throw new HttpError(409, 'This listing is no longer pending.');
    res.json(listing);
  })
);

router.get(
  '/orders',
  wrap(async (_req, res) => {
    res.json(await Order.find().sort({ createdAt: -1 }));
  })
);

export default router;
