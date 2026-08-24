import type { Invoice, PaymentEvent } from "@/types/invoice";

export type CustomerAggregate = {
  key: string;
  name: string;
  phone: string;
  invoices: Invoice[];
  payments: PaymentEvent[];
  totalInvoiced: number;
  totalPaid: number;
  outstanding: number;
  lastInvoiceDate: string;
};

export function customerKey(name: string, phone: string) {
  return `${name.trim().toLowerCase()}|${phone.replace(/\D/g, "")}`;
}

export function aggregateCustomers(invoices: Invoice[]): CustomerAggregate[] {
  const groups = new Map<string, CustomerAggregate>();
  for (const invoice of invoices) {
    const key = customerKey(invoice.customerName, invoice.customerPhone);
    const current = groups.get(key) || { key, name: invoice.customerName, phone: invoice.customerPhone, invoices: [], payments: [], totalInvoiced: 0, totalPaid: 0, outstanding: 0, lastInvoiceDate: invoice.createdAt };
    const paid = invoice.paymentEvents.reduce((sum, payment) => sum + payment.amount, 0);
    current.invoices.push(invoice);
    current.payments.push(...invoice.paymentEvents);
    current.totalInvoiced += invoice.total;
    current.totalPaid += paid;
    current.outstanding += Math.max(0, invoice.total - paid);
    if (invoice.createdAt > current.lastInvoiceDate) current.lastInvoiceDate = invoice.createdAt;
    groups.set(key, current);
  }
  return Array.from(groups.values()).sort((left, right) => right.lastInvoiceDate.localeCompare(left.lastInvoiceDate));
}

export function findCustomer(invoices: Invoice[], key: string) {
  return aggregateCustomers(invoices).find((customer) => customer.key === key) || null;
}