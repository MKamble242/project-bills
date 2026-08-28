export type ShopEntryType = "sale" | "expense";

export type ShopEntry = {
  id: string;
  type: ShopEntryType;
  amountPaise: number;
  note: string;
  date: string;
  expenseReason?: "Stock" | "Dukaan ka Rent" | "Light Bill" | "Transport" | "Helper" | "Other";
  createdAt: string;
};

export const shopEntriesStorageKey = "project-bills.shop-entries.v1";

function isEntryType(value: unknown): value is ShopEntryType {
  return value === "sale" || value === "expense";
}

function isExpenseReason(value: unknown): value is NonNullable<ShopEntry["expenseReason"]> {
  return value === "Stock" || value === "Dukaan ka Rent" || value === "Light Bill" || value === "Transport" || value === "Helper" || value === "Other";
}

function validateEntry(value: unknown): ShopEntry | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== "string" || !isEntryType(candidate.type) || typeof candidate.amountPaise !== "number" || !Number.isInteger(candidate.amountPaise) || candidate.amountPaise <= 0 || typeof candidate.note !== "string" || typeof candidate.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(candidate.date) || typeof candidate.createdAt !== "string") return null;
  const validatedReason = candidate.type === "expense" && isExpenseReason(candidate.expenseReason) ? candidate.expenseReason : undefined;
  if (candidate.type === "expense" && !validatedReason) return null;
  return {
    id: candidate.id,
    type: candidate.type,
    amountPaise: candidate.amountPaise,
    note: candidate.note.slice(0, 200),
    date: candidate.date,
    ...(candidate.type === "expense" ? { expenseReason: validatedReason } : {}),
    createdAt: candidate.createdAt,
  };
}

export function readShopEntries(): ShopEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(shopEntriesStorageKey);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(validateEntry).filter((entry): entry is ShopEntry => entry !== null) : [];
  } catch {
    return [];
  }
}

export function addShopEntry(entry: Omit<ShopEntry, "id" | "createdAt">): ShopEntry {
  const saved: ShopEntry = { ...entry, id: `shop_${crypto.randomUUID()}`, createdAt: new Date().toISOString() };
  const entries = [...readShopEntries(), saved];
  window.localStorage.setItem(shopEntriesStorageKey, JSON.stringify(entries));
  return saved;
}
