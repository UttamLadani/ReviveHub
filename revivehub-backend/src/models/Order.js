import mongoose from 'mongoose';
import cleanJson from './plugin.js';

// Status values match the Order state diagram:
//   Pending -> Confirmed -> Shipped -> Delivered -> Closed      (Cancelled before dispatch)
const orderSchema = new mongoose.Schema(
  {
    _id: { type: String }, // "RH-1007"
    listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    listingTitle: { type: String, required: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    buyerName: { type: String, required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    salePrice: { type: Number, required: true, min: 0 },
    deliveryMode: { type: String, enum: ['courier', 'pickup'], required: true },
    deliveryCost: { type: Number, default: 0, min: 0 },
    days: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Closed', 'Cancelled'],
      default: 'Pending',
    },
    commission: {
      type: { rate: Number, amount: Number, payout: Number, _id: false },
      default: null,
    },
  },
  { timestamps: true }
);
orderSchema.plugin(cleanJson);

export default mongoose.model('Order', orderSchema);
