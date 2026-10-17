import mongoose from 'mongoose';
import { Debt } from '../models/Debt.ts';
import { Hinweis } from '../models/Hinweis.ts';
import { SavingsGoal } from '../models/SavingsGoal.ts';
import { Transaction } from '../models/Transaction.ts';
import { User } from '../models/User.ts';

const missing = { $or: [{ userId: { $exists: false } }, { userId: null }] };

const main = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is missing');
  }

  const apply = process.argv.includes('--apply');
  const emailArg = process.argv.find((arg) => arg.startsWith('--email='))?.slice('--email='.length);

  await mongoose.connect(uri);

  const users = await User.find().sort({ createdAt: 1 }).select('email createdAt').lean();
  const owner =
    (emailArg ? users.find((user) => user.email === emailArg.toLowerCase().trim()) : undefined) ??
    users[0];

  if (!owner) {
    throw new Error('No users in the database');
  }

  const counts = {
    transactions: await Transaction.countDocuments(missing),
    debts: await Debt.countDocuments(missing),
    savingsGoals: await SavingsGoal.countDocuments(missing),
    hinweise: await Hinweis.countDocuments(missing),
  };

  console.log('Users (oldest first):', users.map((user) => user.email).join(', '));
  console.log('Would attach orphan documents to:', owner.email, String(owner._id));
  console.log('Orphan counts:', counts);

  if (!apply) {
    console.log('Dry run only. Pass --apply --email=family@example.com to write.');
    await mongoose.disconnect();
    return;
  }

  if (!emailArg) {
    throw new Error('Refusing to apply without --email=...');
  }

  const set = { $set: { userId: owner._id } };
  const result = {
    transactions: await Transaction.updateMany(missing, set),
    debts: await Debt.updateMany(missing, set),
    savingsGoals: await SavingsGoal.updateMany(missing, set),
    hinweise: await Hinweis.updateMany(missing, set),
  };
  console.log('Updated:', {
    transactions: result.transactions.modifiedCount,
    debts: result.debts.modifiedCount,
    savingsGoals: result.savingsGoals.modifiedCount,
    hinweise: result.hinweise.modifiedCount,
  });
  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
