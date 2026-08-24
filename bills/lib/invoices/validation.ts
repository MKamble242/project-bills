import type { InvoiceDraft } from "@/types/invoice";

const allowedGstRates = new Set([0, 5, 12, 18, 28]);

export function parseInvoiceDraft(value: unknown): InvoiceDraft {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Invoice data is invalid.");
  }

  const draft = value as Record<string, unknown>;
  const quantity = draft.quantity;
  const price = draft.price;
  const gstRate = draft.gstRate;
  const dueDays = draft.dueDays;
  const items = draft.items;

  if (
    typeof draft.customerName !== "string" || !draft.customerName.trim() ||
    typeof draft.description !== "string" || !draft.description.trim() ||
    typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0 ||
    typeof price !== "number" || !Number.isFinite(price) || price <= 0 ||
    typeof gstRate !== "number" || !allowedGstRates.has(gstRate) ||
    typeof dueDays !== "number" || !Number.isInteger(dueDays) || dueDays < 0 ||
    (items !== undefined && (!Array.isArray(items) || items.length === 0 || items.some((item) => {
      if (typeof item !== "object" || item === null) return true;
      const entry = item as Record<string, unknown>;
      return typeof entry.description !== "string" || !entry.description.trim() || typeof entry.quantity !== "number" || entry.quantity <= 0 || typeof entry.unitPrice !== "number" || entry.unitPrice < 0 || typeof entry.gstRate !== "number" || !allowedGstRates.has(entry.gstRate);
    })))
  ) {
    throw new Error("Please provide a valid customer, description, quantity, price, GST rate, and payment term.");
  }

  return {
    documentType: draft.documentType === "tax_invoice" ? "tax_invoice" : "simple_bill",
    customerName: draft.customerName.trim(),
    customerPhone: typeof draft.customerPhone === "string" ? draft.customerPhone.trim() : "",
    description: draft.description.trim(),
    quantity,
    price,
    gstRate,
    dueDays,
    confidenceNotes: Array.isArray(draft.confidenceNotes)
      ? draft.confidenceNotes.filter((note): note is string => typeof note === "string")
      : [],
    items: Array.isArray(items) ? items as InvoiceDraft["items"] : undefined,
  };
}
