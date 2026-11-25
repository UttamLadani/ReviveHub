import mongoose from 'mongoose';

// Hands out order numbers: RH-1001, RH-1002, ...
const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 },
});

export default mongoose.model('Counter', counterSchema);
