export type IncomeGroup = 'salary' | 'business' | 'freelance' | 'gift' | 'investment';
export type ExpenseBlock = 'fixed' | 'periodic' | 'variable';

export type Transaction = {
  _id: string;
  type: 'income' | 'expense';
  title: string;
  amount: number;
  date: string;
  incomeGroup?: IncomeGroup;
  expenseBlock?: ExpenseBlock;
  importantDate?: boolean;
  debtId?: string;
  savingsGoalId?: string;
};

export type Dashboard = {
  month: string;
  incomeTotal: number;
  expenseTotal: number;
  balance: number;
  expenseByBlock: Record<ExpenseBlock, number>;
  incomeByGroup: Record<IncomeGroup, number>;
};

export type Debt = {
  _id: string;
  title: string;
  totalAmount: number;
  monthlyPayment: number;
  startMonth: string;
  months: number;
};

export type SavingsGoal = {
  _id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  imageUrl?: string;
};
