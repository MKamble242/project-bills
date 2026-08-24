export const invoiceDraftStorageKey = "project-bills:invoice-draft:v1";

import type { InvoiceDraft } from "@/types/invoice";

export type { InvoiceDraft } from "@/types/invoice";

const legacyInvoiceDraftStorageKey = "bills.invoice-draft.v1";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isInvoiceDraft(value: unknown): value is InvoiceDraft {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const draft = value as Record<string, unknown>;
  return (
    (draft.documentType === "simple_bill" || draft.documentType === "tax_invoice") &&
    typeof draft.customerName === "string" &&
    typeof draft.customerPhone === "string" &&
    typeof draft.description === "string" &&
    isFiniteNumber(draft.quantity) &&
    isFiniteNumber(draft.price) &&
    isFiniteNumber(draft.gstRate) &&
    isFiniteNumber(draft.dueDays) &&
    Array.isArray(draft.confidenceNotes) &&
    draft.confidenceNotes.every((note) => typeof note === "string")
  );
}

export function readInvoiceDraft(): InvoiceDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(invoiceDraftStorageKey);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isInvoiceDraft(parsed)) {
      localStorage.removeItem(invoiceDraftStorageKey);
      return null;
    }
    if (typeof parsed.savedAt === "string" && Date.now() - new Date(parsed.savedAt).getTime() > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(invoiceDraftStorageKey);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(invoiceDraftStorageKey);
    return null;
  }
}

export function writeInvoiceDraft(draft: InvoiceDraft): void {
  localStorage.setItem(invoiceDraftStorageKey, JSON.stringify({ ...draft, savedAt: new Date().toISOString() }));
}

export function clearInvoiceDraft(): void {
  localStorage.removeItem(invoiceDraftStorageKey);
  sessionStorage.removeItem(legacyInvoiceDraftStorageKey);
}
