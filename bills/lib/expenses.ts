export const expenseCategories = ["Chai/Nashta", "Travel", "Food", "Mobile", "Other"] as const;
export type ExpenseCategory = (typeof expenseCategories)[number];

export type PersonalExpense = {
  id: string;
  amountPaise: number;
  category: ExpenseCategory;
  customCategory?: string;
  date: string;
  note: string;
  createdAt: string;
};

const storageKey = "project-bills.personal-expenses.v1";

function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function validatePersonalExpense(value: unknown): PersonalExpense | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== "string" || typeof candidate.amountPaise !== "number" || !Number.isSafeInteger(candidate.amountPaise) || candidate.amountPaise <= 0 || !expenseCategories.includes(candidate.category as ExpenseCategory) || !isDate(candidate.date) || typeof candidate.note !== "string" || typeof candidate.createdAt !== "string") return null;
  const customCategory = typeof candidate.customCategory === "string" ? candidate.customCategory.trim().slice(0, 60) : "";
  if (candidate.category === "Other" && !customCategory) return null;
  return { id: candidate.id, amountPaise: candidate.amountPaise, category: candidate.category as ExpenseCategory, ...(customCategory ? { customCategory } : {}), date: candidate.date, note: candidate.note.trim().slice(0, 200), createdAt: candidate.createdAt };
}

export function readPersonalExpenses(): PersonalExpense[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
    return Array.isArray(parsed) ? parsed.map(validatePersonalExpense).filter((expense): expense is PersonalExpense => expense !== null) : [];
  } catch {
    return [];
  }
}

export function addPersonalExpense(expense: Omit<PersonalExpense, "id" | "createdAt">): PersonalExpense {
  const saved = validatePersonalExpense({ ...expense, id: `expense_${crypto.randomUUID()}`, createdAt: new Date().toISOString() });
  if (!saved) throw new Error("Please enter a valid expense.");
  window.localStorage.setItem(storageKey, JSON.stringify([...readPersonalExpenses(), saved]));
  return saved;
}

export function expenseCategoryLabel(expense: PersonalExpense) {
  return expense.category === "Other" ? expense.customCategory || "Other" : expense.category;
}
