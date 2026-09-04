export const jobStatuses = ["active", "completed"] as const;
export type JobStatus = (typeof jobStatuses)[number];

export const jobExpenseTypes = ["material", "travel", "labour", "other"] as const;
export type JobExpenseType = (typeof jobExpenseTypes)[number];

export type JobEntry = {
  id: string;
  customerName: string;
  title: string;
  totalAmountPaise: number;
  receivedAmountPaise: number;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
};

export type JobExpense = {
  id: string;
  jobId: string;
  type: JobExpenseType;
  amountPaise: number;
  note: string;
  date: string;
  createdAt: string;
};

export type JobPayment = {
  id: string;
  jobId: string;
  amountPaise: number;
  date: string;
  createdAt: string;
};

export type JobWithExpenses = JobEntry & {
  expenses: JobExpense[];
  payments: JobPayment[];
  customerBalancePaise: number;
  totalJobExpensesPaise: number;
  netAmountPaise: number;
};
