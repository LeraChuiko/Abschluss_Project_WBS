import mongoose from 'mongoose';

export type TransactionDoc = {
  type: 'income' | 'expense';
  title: string;
  amount: number;
  date: Date;
  incomeGroup?: 'salary' | 'business' | 'freelance' | 'gift' | 'investment' | null;
  expenseBlock?: 'fixed' | 'periodic' | 'variable' | null;
  importantDate?: boolean;
  seriesId?: string;
  debtId?: mongoose.Types.ObjectId;
  savingsGoalId?: mongoose.Types.ObjectId;
};

const transactionSchema = new mongoose.Schema<TransactionDoc>(
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
    seriesId: { type: String, index: true },
    debtId: { type: mongoose.Schema.Types.ObjectId, ref: 'Debt' },
    savingsGoalId: { type: mongoose.Schema.Types.ObjectId, ref: 'SavingsGoal', index: true },
  },
  { timestamps: true },
);

export const Transaction = mongoose.model<TransactionDoc>('Transaction', transactionSchema);