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

export function validateShopEntry(value: unknown): ShopEntry | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== "string" || !/^shop_[A-Za-z0-9_-]+$/.test(candidate.id) || !isEntryType(candidate.type) || typeof candidate.amountPaise !== "number" || !Number.isSafeInteger(candidate.amountPaise) || candidate.amountPaise <= 0 || typeof candidate.note !== "string" || typeof candidate.date !== "string" || !isValidShopDate(candidate.date) || typeof candidate.createdAt !== "string") return null;
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

function isValidShopDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function readShopEntries(): ShopEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(shopEntriesStorageKey);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(validateShopEntry).filter((entry): entry is ShopEntry => entry !== null) : [];
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

export function updateShopEntry(id: string, changes: Partial<Omit<ShopEntry, "id" | "createdAt">>): ShopEntry {
  const current = readShopEntries().find((entry) => entry.id === id);
  if (!current) throw new Error("This shop entry could not be found.");
  const updated = validateShopEntry({ ...current, ...changes });
  if (!updated) throw new Error("Please enter valid shop entry details.");
  window.localStorage.setItem(shopEntriesStorageKey, JSON.stringify(readShopEntries().map((entry) => entry.id === id ? updated : entry)));
  return updated;
}

export function deleteShopEntry(id: string): void {
  const entries = readShopEntries();
  if (!entries.some((entry) => entry.id === id)) throw new Error("This shop entry could not be found.");
  window.localStorage.setItem(shopEntriesStorageKey, JSON.stringify(entries.filter((entry) => entry.id !== id)));
}
