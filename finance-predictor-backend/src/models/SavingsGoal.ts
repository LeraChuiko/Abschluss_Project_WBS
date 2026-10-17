import mongoose from 'mongoose';

const savingsGoalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    title: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true, min: 0 },
    currentAmount: { type: Number, required: true, min: 0, default: 0 },
    creditedAmount: { type: Number, min: 0, default: 0 },
    noBudget: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    completedAt: { type: Date },
    imageUrl: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
);

export const SavingsGoal = mongoose.model('SavingsGoal', savingsGoalSchema);