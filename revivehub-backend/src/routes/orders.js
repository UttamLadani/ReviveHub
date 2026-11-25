import { Router } from 'express';
import Listing from '../models/Listing.js';
import Order from '../models/Order.js';
import Counter from '../models/Counter.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { config } from '../config.js';
import { HttpError, wrap, assertObjectId } from '../utils.js';

const router = Router();
router.use(requireAuth);

// who may do what, and from which status
const RULES = {
  accept: { from: ['Pending'], to: 'Confirmed', by: ['seller'] },
  decline: { from: ['Pending'], to: 'Cancelled', by: ['seller'] },
  dispatch: { from: ['Confirmed'], to: 'Shipped', by: ['seller'] },
  cancel: { from: ['Pending', 'Confirmed'], to: 'Cancelled', by: ['buyer', 'seller'] },
  receive: { from: ['Shipped'], to: 'Delivered', by: ['buyer'] },
  close: { from: ['Delivered'], to: 'Closed', by: ['admin'] },
};

const round2 = (n) => Math.round(n * 100) / 100;

router.post(
  '/',
  requireRole('buyer'),
  wrap(async (req, res) => {
    const { listingId, mode } = req.body;
    const qty = Number(req.body.quantity);
    if (!Number.isInteger(qty) || qty < 1) throw new HttpError(400, 'Choose a quantity of at least 1.');
    if (mode !== 'courier' && mode !== 'pickup') throw new HttpError(400, 'Choose courier delivery or pickup.');
    assertObjectId(listingId, 'This lot is no longer available.');

    // take the stock in ONE step so two buyers cannot both get the last units
    const listing = await Listing.findOneAndUpdate(
      { _id: listingId, status: 'live', quantity: { $gte: qty } },
      { $inc: { quantity: -qty } },
      { new: true }
    );
    if (!listing) {
      const current = await Listing.findById(listingId);
      if (!current || current.status !== 'live') throw new HttpError(409, 'This lot is no longer available.');
      throw new HttpError(409, `Only ${current.quantity} units are available.`);
    }
    if (listing.quantity === 0) await Listing.updateOne({ _id: listing._id, status: 'live' }, { status: 'sold' });

    try {
      const counter = await Counter.findOneAndUpdate({ _id: 'order' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
      const cost = Number(req.body.deliveryCost);
      const order = await Order.create({
        _id: 'RH-' + (config.orderNumberBase + counter.seq),
        listingId: listing._id,
        listingTitle: listing.title,
        buyerId: req.user._id,
        buyerName: req.user.business || req.user.name,
        sellerId: listing.sellerId,
        quantity: qty,
        salePrice: round2(qty * listing.pricePerUnit),
        deliveryMode: mode,
        deliveryCost: mode === 'pickup' || !Number.isFinite(cost) || cost < 0 ? 0 : Math.min(cost, 10_000_000),
        days: typeof req.body.days === 'string' ? req.body.days.slice(0, 40) : '',
      });
      res.status(201).json(order);
    } catch (e) {
      // order could not be saved: give the stock back
      await Listing.updateOne({ _id: listing._id }, { $inc: { quantity: qty } });
      await Listing.updateOne({ _id: listing._id, status: 'sold' }, { status: 'live' });
      throw e;
    }
  })
);

router.get(
  '/mine',
  requireRole('buyer'),
  wrap(async (req, res) => res.json(await Order.find({ buyerId: req.user._id }).sort({ createdAt: -1 })))
);

router.get(
  '/seller',
  requireRole('seller'),
  wrap(async (req, res) => res.json(await Order.find({ sellerId: req.user._id }).sort({ createdAt: -1 })))
);

// only the buyer, the seller of that order, or an admin may open it
router.get(
  '/:id',
  wrap(async (req, res) => {
    const order = await Order.findById(req.params.id);
    const me = String(req.user._id);
    const allowed =
      order && (req.user.role === 'admin' || String(order.buyerId) === me || String(order.sellerId) === me);
    if (!allowed) throw new HttpError(404, 'Order not found.');
    res.json(order);
  })
);

router.patch(
  '/:id/status',
  wrap(async (req, res) => {
    const rule = RULES[req.body.action];
    if (!rule) throw new HttpError(400, 'Unknown action.');

    const order = await Order.findById(req.params.id);
    if (!order) throw new HttpError(404, 'Order not found.');

    // right role AND owns the order (an admin may act on any order)
    const me = String(req.user._id);
    const actingAs =
      req.user.role === 'admin'
        ? 'admin'
        : req.user.role === 'buyer' && String(order.buyerId) === me
          ? 'buyer'
          : req.user.role === 'seller' && String(order.sellerId) === me
            ? 'seller'
            : null;
    if (!actingAs || !rule.by.includes(actingAs)) throw new HttpError(403, 'You cannot do that on this order.');

    const set = { status: rule.to };
    if (rule.to === 'Closed') {
      const amount = round2((order.salePrice * config.commissionRate) / 100);
      set.commission = { rate: config.commissionRate, amount, payout: round2(order.salePrice - amount) };
    }
    // the status check inside the update stops the same step being applied twice
    const updated = await Order.findOneAndUpdate({ _id: order._id, status: { $in: rule.from } }, set, { new: true });
    if (!updated) throw new HttpError(409, `This order is ${order.status}, so it cannot be changed that way.`);

    if (rule.to === 'Cancelled') {
      // give the stock back to the listing
      await Listing.updateOne({ _id: order.listingId }, { $inc: { quantity: order.quantity } });
      await Listing.updateOne({ _id: order.listingId, status: 'sold' }, { status: 'live' });
    }
    res.json(updated);
  })
);

export default router;
