export const invoiceStatuses = [
  "draft",
  "approved",
  "partially_paid",
  "sent",
  "viewed",
  "overdue",
  "paid",
  "cancelled",
] as const;

export type InvoiceStatus = (typeof invoiceStatuses)[number];

export type SyncStatus = "local_only" | "pending" | "syncing" | "synced" | "conflict" | "failed";

export type DocumentType = "simple_bill" | "tax_invoice";
export type WhatsAppMessageLanguage = "simple_english" | "hinglish";

export type InvoiceDraft = {
  documentType: DocumentType;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  invoiceDate?: string;
  dueDate?: string;
  description: string;
  quantity: number;
  price: number;
  gstRate: number;
  dueDays: number;
  advanceReceived?: number;
  advancePaymentMethod?: PaymentEvent["paymentMethod"];
  notes?: string;
  savedAt?: string;
  confidenceNotes: string[];
  items?: InvoiceItemDraft[];
};

export type InvoiceItemDraft = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
};

export type InvoiceItem = InvoiceItemDraft & { lineTotal: number };

export type PaymentEvent = {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: "upi" | "cash" | "bank_transfer" | "card" | "other";
  paymentReference: string | null;
  notes: string | null;
  createdAt: string;
};

export type Invoice = InvoiceDraft & {
  id: string;
  invoiceNumber: string;
  subtotal: number;
  gstAmount: number;
  total: number;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
  storageMode: "supabase" | "local";
  clientId: string;
  syncStatus: SyncStatus;
  paymentEvents: PaymentEvent[];
  version: number;
  paidAmount: number;
  outstandingAmount: number;
};

export type BusinessProfile = {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  address: string;
  gstin: string;
  upiId: string;
  paymentNotes: string;
  invoicePrefix: string;
  createdAt: string;
  updatedAt: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  address: string;
  gstin: string;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceTotals = {
  subtotal: number;
  gstAmount: number;
  total: number;
};
