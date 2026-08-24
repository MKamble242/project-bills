import type { InvoiceItemDraft, InvoiceTotals } from "@/types/invoice";

export function calculateInvoiceTotals(
  quantity: number,
  price: number,
  gstRate: number
): InvoiceTotals {
  const subtotal = Math.round(quantity * price * 100) / 100;
  const gstAmount = Math.round((subtotal * gstRate) * 100) / 10000;
  return {
    subtotal,
    gstAmount,
    total: Math.round((subtotal + gstAmount) * 100) / 100,
  };
}

export function calculateItemTotals(items: InvoiceItemDraft[]): InvoiceTotals {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const gstAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.gstRate) / 100, 0);
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    gstAmount: Math.round(gstAmount * 100) / 100,
    total: Math.round((subtotal + gstAmount) * 100) / 100,
  };
}
