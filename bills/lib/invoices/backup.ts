import type { Invoice } from "@/types/invoice";

export function downloadText(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function invoiceCsv(invoices: Invoice[]) {
  const header = ["invoice_number", "customer_name", "total", "status", "created_at"];
  const rows = invoices.map((invoice) => [invoice.invoiceNumber, invoice.customerName, invoice.total.toFixed(2), invoice.status, invoice.createdAt]);
  return [header, ...rows].map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(",")).join("\n");
}
