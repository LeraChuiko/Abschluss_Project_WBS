import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['income', 'expense'], required: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    incomeGroup: {
      type: String,
      enum: ['salary', 'business', 'freelance', 'gift', 'investment'],
    },
    expenseBlock: {
      type: String,
      enum: ['fixed', 'periodic', 'variable'],
    },
    importantDate: { type: Boolean, default: false },
    debtId: { type: mongoose.Schema.Types.ObjectId, ref: 'Debt' },
  },
  { timestamps: true },
);

export const Transaction = mongoose.model('Transaction', transactionSchema);