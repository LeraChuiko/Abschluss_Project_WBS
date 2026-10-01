import mongoose from 'mongoose';

const debtSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    totalAmount: { type: Number, required: true, min: 0 },
    monthlyPayment: { type: Number, required: true, min: 0 },
    startMonth: { type: String, required: true },
    months: { type: Number, required: true, min: 1 },
  },
  { timestamps: true },
);

export const Debt = mongoose.model('Debt', debtSchema);
