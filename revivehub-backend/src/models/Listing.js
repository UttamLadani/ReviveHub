import mongoose from 'mongoose';
import cleanJson from './plugin.js';

// Status values match the Listing state diagram:
//   draft -> pending -> live -> sold | closed
const listingSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sellerName: { type: String, required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, default: '' },
    condition: { type: String, enum: ['new', 'open-box', 'used'], default: 'new' },
    quantity: { type: Number, default: 0, min: 0 },
    originalPrice: { type: Number, default: 0, min: 0 },
    pricePerUnit: { type: Number, default: 0, min: 0 },
    aiPrice: { type: Number, default: 0, min: 0 },
    city: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    description: { type: String, default: '', maxlength: 2000 },
    photos: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['draft', 'pending', 'live', 'sold', 'closed'],
      default: 'draft',
      index: true,
    },
    rejectReason: { type: String, default: '' },
  },
  { timestamps: true }
);
listingSchema.plugin(cleanJson);

export default mongoose.model('Listing', listingSchema);
