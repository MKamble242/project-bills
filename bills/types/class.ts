export type Student = {
  id: string;
  name: string;
  guardianName: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
};

export type ClassFeeEntry = {
  id: string;
  studentId: string;
  expectedAmountPaise: number;
  paidAmountPaise: number;
  date: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type StudentFeeSummary = Student & {
  entries: ClassFeeEntry[];
  totalExpectedPaise: number;
  totalPaidPaise: number;
  totalPendingPaise: number;
};
