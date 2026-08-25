"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getLocalInvoice } from "@/lib/invoices/local-repository";
import type { Invoice } from "@/types/invoice";
import DownloadInvoiceButton from "@/components/DownloadInvoiceButton";
import PrintInvoiceButton from "@/components/PrintInvoiceButton";
import WhatsAppShareButton, { normalizeIndianPhone } from "@/components/WhatsAppShareButton";
import InvoicePaymentPanel from "@/components/InvoicePaymentPanel";
import PaymentForm from "@/components/PaymentForm";

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getStatusBadge(status: string) {
  const normalizedStatus = status.toLowerCase();
  const badges: Record<string, { label: string; className: string }> = {
    paid: {
      label: "PAID",
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    },
    partially_paid: {
      label: "PARTIALLY PAID",
      className: "border-amber-200 bg-amber-50 text-amber-900",
    },
    unpaid: {
      label: "UNPAID",
      className: "border-rose-200 bg-rose-50 text-rose-800",
    },
    draft: {
      label: "DRAFT",
      className: "border-slate-200 bg-slate-100 text-slate-700",
    },
  };
  const badge = badges[normalizedStatus] ?? {
    label: "INVOICE STATUS",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  };

  return {
    ...badge,
    ariaLabel: `Invoice status: ${badge.label.toLowerCase()}`,
  };
}

export default function LocalInvoiceDetails({ id }: { id: string }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void getLocalInvoice(id)
      .then(setInvoice)
      .catch(() => setError("We could not load this local invoice."))
      .finally(() => setLoading(false));
  }, [id]);

  const callHref = useMemo(() => {
    const normalized = normalizeIndianPhone(invoice?.customerPhone ?? null);
    return normalized ? `tel:${normalized}` : "";
  }, [invoice]);

  if (loading) return <main className="p-8 text-center font-bold">Loading local invoice...</main>;
  if (error || !invoice) return <main className="p-8 text-center text-red-700">{error || "Invoice not found."}</main>;

  const pdfInvoice = {
    invoice_number: invoice.invoiceNumber,
    customer_name: invoice.customerName,
    customer_phone: invoice.customerPhone || null,
    description: invoice.description,
    quantity: invoice.quantity,
    price: invoice.price,
    gst_rate: invoice.gstRate,
    subtotal: invoice.subtotal,
    gst_amount: invoice.gstAmount,
    total: invoice.total,
    due_days: invoice.dueDays,
    created_at: invoice.createdAt,
    items: invoice.items?.map((item) => ({ description: item.description, quantity: item.quantity, unitPrice: item.unitPrice })),
    document_type: invoice.documentType ?? "simple_bill",
    advance_received: invoice.paidAmount,
    outstanding_amount: invoice.outstandingAmount,
  };

  const items: Array<{ id: string; description: string; quantity: number; unitPrice: number; gstRate: number; lineTotal: number }> = invoice.items 
    ? invoice.items.map((item) => ({
        ...item,
        lineTotal: (item.quantity || 0) * (item.unitPrice || 0),
      }))
    : [{
        id: "legacy",
        description: invoice.description,
        quantity: invoice.quantity,
        unitPrice: invoice.price,
        gstRate: invoice.gstRate,
        lineTotal: invoice.subtotal,
      }];

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 text-slate-950"><div className="mx-auto max-w-2xl">
      <Link href="/" className="text-sm font-bold text-slate-500">← Back to dashboard</Link>
      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Local-only invoice</p>
            <h1 className="mt-2 max-w-full break-words text-base font-bold leading-tight tracking-tight sm:text-lg">{invoice.invoiceNumber}</h1>
          </div>
          <span
            aria-label={getStatusBadge(invoice.status).ariaLabel}
            className={`inline-flex min-h-7 shrink-0 items-center rounded-full border px-3 py-1 text-xs font-bold ${getStatusBadge(invoice.status).className}`}
          >
            {getStatusBadge(invoice.status).label}
          </span>
        </div>
        <p className="mt-6 text-lg font-black">{invoice.customerName}</p>
        <p className="mt-1 text-slate-500">{invoice.customerPhone || "No phone number"}</p>
        <div className="my-6 border-t border-slate-200" />
        <div className="space-y-3">
          {items.map((item) => {
            const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
            return (
              <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="font-bold">{item.description || "Item"}</p>
                <p className="mt-1 text-sm text-slate-500">{item.quantity || 0} × {currency(item.unitPrice || 0)}</p>
                <p className="mt-2 font-semibold text-right">{currency(lineTotal)}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex justify-between border-t border-slate-200 pt-4"><span className="font-bold">Total</span><span className="text-2xl font-black">{currency(invoice.total)}</span></div>
      </section>
      <InvoicePaymentPanel invoiceNumber={invoice.invoiceNumber} total={invoice.total} outstandingAmount={invoice.outstandingAmount} dueDays={invoice.dueDays} />
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4"><h2 className="font-black">Payment history</h2>{invoice.paymentEvents.length === 0 ? <p className="mt-2 text-sm text-slate-500">No payments recorded.</p> : <div className="mt-3 space-y-3">{invoice.paymentEvents.map((payment) => <div key={payment.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><div className="flex items-center justify-between gap-3"><span className="font-bold">Paid manually</span><span className="font-black">{currency(payment.amount)}</span></div><div className="mt-2 text-sm text-slate-600"><p>{payment.paymentMethod.toUpperCase()}</p><p className="mt-1">{payment.paymentReference || "No payment reference recorded"}</p><p className="mt-1">{payment.paymentDate}</p></div></div>)}</div>}<div className="mt-3 border-t border-slate-100 pt-3 text-sm"><p>Total paid: <strong>{currency(invoice.paidAmount)}</strong></p><p>Outstanding: <strong>{currency(invoice.outstandingAmount)}</strong></p></div></section>
      <div className="mt-6 space-y-3">
        <WhatsAppShareButton
          phone={invoice.customerPhone || null}
          customerName={invoice.customerName}
          invoiceNumber={invoice.invoiceNumber}
          items={items}
          total={invoice.total}
          dueDays={invoice.dueDays}
          businessName="Your Business Name"
          outstandingAmount={invoice.outstandingAmount}
          documentType={invoice.documentType ?? "simple_bill"}
          advanceReceived={invoice.paidAmount}
        />
        <div className="grid gap-3 grid-cols-2">
          <DownloadInvoiceButton invoice={pdfInvoice} />
          {callHref && (
            <a href={callHref} className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 font-black text-sky-700 transition hover:bg-sky-100">
              📞
            </a>
          )}
        </div>
        <div className="grid gap-3 grid-cols-2">
          <PaymentForm invoice={invoice} onSaved={setInvoice} />
          <PrintInvoiceButton />
        </div>
      </div>
    </div></main>
  );
}
