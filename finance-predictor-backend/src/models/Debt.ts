import mongoose from 'mongoose';

const debtSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    title: { type: String, required: true, trim: true },
    totalAmount: { type: Number, required: true, min: 0 },
    monthlyPayment: { type: Number, required: true, min: 0 },
    startMonth: { type: String, required: true },
    months: { type: Number, required: true, min: 1 },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Debt = mongoose.model('Debt', debtSchema);
