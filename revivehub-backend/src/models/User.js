import mongoose from 'mongoose';
import cleanJson from './plugin.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    business: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['seller', 'buyer', 'admin'], required: true },
  },
  { timestamps: true }
);
userSchema.plugin(cleanJson);

export default mongoose.model('User', userSchema);
