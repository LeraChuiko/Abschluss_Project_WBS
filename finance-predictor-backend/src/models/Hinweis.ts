import mongoose from 'mongoose';

const hinweisSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    note: { type: String, trim: true, default: '' },
    month: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
    endMonth: { type: String, default: '', match: /^$|^\d{4}-\d{2}$/ },
    everyMonths: { type: Number, min: 0, max: 12, default: 0 },
    customMonths: { type: [Number], default: [] },
    doneMonths: { type: [String], default: [] },
    done: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Hinweis = mongoose.model('Hinweis', hinweisSchema);
