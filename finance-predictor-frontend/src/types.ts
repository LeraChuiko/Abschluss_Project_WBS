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
  seriesId?: string;
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
  archived?: boolean;
};

export type SavingsGoal = {
  _id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  creditedAmount?: number;
  noBudget?: boolean;
  archived?: boolean;
  imageUrl?: string;
  createdAt?: string;
  completedAt?: string;
};

export type Hinweis = {
  _id: string;
  title: string;
  note?: string;
  month: string;
  endMonth?: string;
  everyMonths?: number;
  customMonths?: number[];
  doneMonths?: string[];
  done?: boolean;
};
