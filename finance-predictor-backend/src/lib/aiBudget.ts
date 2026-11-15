export type BudgetSnapshot = {
  today: string;
  year: string;
  currentMonth: string;
  remainingMonthsIncludingCurrent: number;
  remainingFullMonthsAfterCurrent: number;
  yearToDate: {
    incomeTotal: number;
    expenseTotal: number;
    rest: number;
    incomeByGroup: Record<string, number>;
    expenseByBlock: Record<string, number>;
  };
  typicalMonth: {
    stableIncome: number;
    Pflicht: number;
    raten: number;
    variable: number;
  };
  debts: Array<{
    title: string;
    monthlyPayment: number;
    remainingMonthsInYear: number;
    remainingTotal: number;
    archived: boolean;
  }>;
  savingsGoals: Array<{
    title: string;
    targetAmount: number;
    currentAmount: number;
    remaining: number;
    noBudget: boolean;
    archived: boolean;
  }>;
  hints: Array<{
    title: string;
    month: string;
    remainingThisYear: boolean;
  }>;
  source: 'user' | 'demo';
};

export const berlinCalendar = (): {
  today: string;
  year: string;
  month: string;
  monthNum: number;
} => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value ?? '2026';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';
  return {
    today: `${year}-${month}-${day}`,
    year,
    month: `${year}-${month}`,
    monthNum: Number(month),
  };
};

export const demoSnapshot = (): BudgetSnapshot => {
  const cal = berlinCalendar();
  const remainingMonthsIncludingCurrent = 13 - cal.monthNum;
  const remainingFullMonthsAfterCurrent = Math.max(0, 12 - cal.monthNum);
  return {
    today: cal.today,
    year: cal.year,
    currentMonth: cal.month,
    remainingMonthsIncludingCurrent,
    remainingFullMonthsAfterCurrent,
    yearToDate: {
      incomeTotal: 31200,
      expenseTotal: 24840,
      rest: 6360,
      incomeByGroup: { salary: 28800, business: 0, freelance: 900, gift: 0, investment: 1500 },
      expenseByBlock: { fixed: 16800, periodic: 3600, variable: 4440 },
    },
    typicalMonth: {
      stableIncome: 3350,
      Pflicht: 1680,
      raten: 400,
      variable: 480,
    },
    debts: [
      {
        title: 'Laptop-Rate',
        monthlyPayment: 180,
        remainingMonthsInYear: Math.min(remainingMonthsIncludingCurrent, 8),
        remainingTotal: 1440,
        archived: false,
      },
      {
        title: 'Waschmaschine',
        monthlyPayment: 65,
        remainingMonthsInYear: Math.min(remainingMonthsIncludingCurrent, 5),
        remainingTotal: 325,
        archived: false,
      },
    ],
    savingsGoals: [
      {
        title: 'Notgroschen',
        targetAmount: 4000,
        currentAmount: 1650,
        remaining: 2350,
        noBudget: false,
        archived: false,
      },
      {
        title: 'Familienurlaub',
        targetAmount: 2500,
        currentAmount: 800,
        remaining: 1700,
        noBudget: false,
        archived: false,
      },
    ],
    hints: [
      { title: 'Kfz-Versicherung jährlich', month: `${cal.year}-11`, remainingThisYear: cal.monthNum <= 11 },
      { title: 'GEZ / Rundfunkbeitrag prüfen', month: cal.month, remainingThisYear: true },
    ],
    source: 'demo',
  };
};
