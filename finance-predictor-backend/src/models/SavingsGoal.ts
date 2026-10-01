// Savings goal = piggy bank (apartment, car, travel).
// Planned fields: name, targetAmount, currentAmount.
import mongoose from 'mongoose';

const savingsGoalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true, min: 0 },
    currentAmount: { type: Number, required: true, min: 0, default: 0 },
    payments: {
      type: [
        {
          month: { type: String, required: true },
          amount: { type: Number, required: true, min: 0 },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

export const SavingsGoal = mongoose.model('SavingsGoal', savingsGoalSchema);