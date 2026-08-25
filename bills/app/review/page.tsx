"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  clearInvoiceDraft,
  readInvoiceDraft,
  type InvoiceDraft,
} from "@/lib/invoices/draft-storage";
import { createLocalInvoice } from "@/lib/invoices/local-repository";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { calculateItemTotals } from "@/lib/invoices/calculations";
import { readBusinessSettings } from "@/lib/business-settings";
import type { DocumentType } from "@/types/invoice";
import { useAppLanguage } from "@/components/AppLanguageProvider";

function ReviewInvoiceContent() {
  const { dictionary } = useAppLanguage();
  const searchParams = useSearchParams();

  const [approved, setApproved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedInvoiceNumber, setSavedInvoiceNumber] = useState("");
  const [savedInvoiceId, setSavedInvoiceId] = useState("");
  const [businessGstin] = useState(() => readBusinessSettings().gstin);

  const [draft] = useState<InvoiceDraft>(() =>
    readInvoiceDraft() || {
      documentType: "simple_bill",
      customerName: searchParams.get("customerName") || "",
      customerPhone: searchParams.get("customerPhone") || "",
      description: searchParams.get("description") || "",
      quantity: Number(searchParams.get("quantity")) || 1,
      price: Number(searchParams.get("price")) || 0,
      gstRate: Number(searchParams.get("gstRate")) || 0,
      dueDays: Number(searchParams.get("dueDays")) || 0,
      confidenceNotes: [],
    }
  );

  const {
    customerName,
    customerPhone,
    description,
    quantity,
    price,
    gstRate,
    dueDays,
    confidenceNotes,
    documentType,
    advanceReceived = 0,
  } = draft;

  const items = draft.items || [{ id: "legacy", description, quantity, unitPrice: price, gstRate }];
  const { subtotal, gstAmount, total } = calculateItemTotals(items);
  const activeDocumentType: DocumentType = documentType || "simple_bill";
  const balanceDue = Math.max(0, total - advanceReceived);

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function getDueText() {
    if (dueDays === 0) {
      return "Payment due immediately";
    }

    return `Payment due within ${dueDays} days`;
  }

  async function approveInvoice() {
    setSaving(true);
    setErrorMessage("");

    if (!customerName || !description || price <= 0) {
      setErrorMessage(
        "Please check the customer name, work description, and amount."
      );
      setSaving(false);
      return;
    }

    if (activeDocumentType === "tax_invoice" && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(businessGstin.trim().toUpperCase())) {
      setErrorMessage("Add a valid GSTIN in Settings to create a Tax Invoice.");
      setSaving(false);
      return;
    }

    try {
      if (!isSupabaseConfigured()) {
        const localInvoice = await createLocalInvoice(draft);
        setSavedInvoiceId(localInvoice.id);
        setSavedInvoiceNumber(localInvoice.invoiceNumber);
        setSaving(false);
        setApproved(true);
        clearInvoiceDraft();
        return;
      }

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result: unknown = await response.json();
      const record =
        typeof result === "object" && result !== null && "data" in result
          ? result.data
          : null;

      if (!response.ok || typeof record !== "object" || record === null) {
        const message =
          typeof result === "object" && result !== null && "error" in result &&
          typeof result.error === "object" && result.error !== null &&
          "message" in result.error && typeof result.error.message === "string"
            ? result.error.message
            : "We could not save this invoice. Please try again.";
        setErrorMessage(message);
        setSaving(false);
        return;
      }

      const saved = record as { id?: unknown; invoice_number?: unknown };
      if (typeof saved.id !== "string" || typeof saved.invoice_number !== "string") {
        setErrorMessage("The saved invoice response was incomplete.");
        setSaving(false);
        return;
      }

      setSavedInvoiceId(saved.id);
      setSavedInvoiceNumber(saved.invoice_number);
    } catch {
      setErrorMessage("We could not save this invoice. Please check your connection and try again.");
      setSaving(false);
      return;
    }

    setSaving(false);
    setApproved(true);
    clearInvoiceDraft();
  }

  if (approved) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 text-slate-950">
        <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
          <section className="w-full rounded-[2rem] border border-slate-200 bg-white p-7 text-center shadow-xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl text-emerald-600">
              ✓
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
              Invoice created
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight">
              You are ready to get paid.
            </h1>

            <p className="mt-4 text-slate-600">
              Invoice <strong>{savedInvoiceNumber}</strong> has been approved for{" "}
              <strong>{customerName || "your customer"}</strong>.
            </p>

            <div className="mt-6 rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Invoice total</p>

              <p className="mt-1 text-3xl font-black">
                {formatCurrency(total)}
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <Link
                href={`/invoices/${savedInvoiceId}`}
                className="block min-h-14 w-full rounded-2xl bg-blue-600 px-5 py-4 font-black text-white transition hover:bg-blue-500"
              >
                Open invoice actions
              </Link>

              <Link
                href="/"
                className="block py-3 text-sm font-bold text-slate-500 transition hover:text-slate-950"
              >
                Return to dashboard
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 text-slate-950">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/invoices/new"
          className="text-sm font-bold text-slate-500 transition hover:text-slate-950"
        >
          ← {dictionary.continueEditing}
        </Link>

        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            Step 2 of 2
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight">
            {dictionary.reviewBill}
          </h1>

          <p className="mt-3 text-slate-600">
            Confirm the important details. Nothing will be sent until you
            approve it.
          </p>
        </div>

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-slate-950 p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold tracking-[0.18em] text-blue-400">
                  PROJECT BILLS
                </p>

                <p className="mt-2 text-sm text-slate-400">{activeDocumentType === "tax_invoice" ? "TAX INVOICE" : "BILL"}</p>
              </div>

              <div className="text-right">
                <p className="text-sm text-slate-400">Invoice number</p>

                <p className="mt-1 font-bold">Generated on approval</p>
              </div>
            </div>
          </div>

          <div className="space-y-7 p-6 sm:p-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  From
                </p>

                <p className="mt-2 font-black">Your Business Name</p>

                <p className="mt-1 text-sm text-slate-500">
                  Solapur, Maharashtra
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Bill to
                </p>

                <p className="mt-2 font-black">
                  {customerName || "Customer name missing"}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {customerPhone || "Phone number missing"}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-[1fr_auto] gap-4 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                <span>Description</span>
                <span>Amount</span>
              </div>
              {items.map((item) => {
                const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
                return (
                  <div key={item.id} className="grid grid-cols-[1fr_auto] gap-4 border-t border-slate-100 px-4 py-4">
                    <div>
                      <p className="font-bold">{item.description || "Item"}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.quantity || 0} × {formatCurrency(item.unitPrice || 0)}</p>
                    </div>
                    <p className="font-black">{formatCurrency(lineTotal)}</p>
                  </div>
                );
              })}
            </div>

            <div className="ml-auto max-w-xs space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>

                <span className="font-semibold">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              {activeDocumentType === "tax_invoice" && <div className="flex justify-between text-sm">
                <span className="text-slate-500">GST ({gstRate}%)</span>
                <span className="font-semibold">{formatCurrency(gstAmount)}</span>
              </div>}

              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-end justify-between">
                  <span className="font-bold">{activeDocumentType === "tax_invoice" ? "Total" : "Total Amount"}</span>

                  <span className="text-2xl font-black">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>

            {advanceReceived > 0 && (
              <div className="ml-auto max-w-xs space-y-2 rounded-2xl bg-emerald-50 p-4 text-sm">
                <div className="flex justify-between"><span>Advance Received</span><span className="font-bold">{formatCurrency(advanceReceived)}</span></div>
                <div className="flex justify-between font-black text-emerald-800"><span>Balance Due</span><span>{formatCurrency(balanceDue)}</span></div>
              </div>
            )}

            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-sm font-bold text-blue-950">
                {getDueText()}
              </p>

              <p className="mt-1 text-sm text-blue-800">
                A payment reminder can be scheduled after sending.
              </p>
            </div>

            {confidenceNotes.length > 0 && (
              <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-bold">Please verify these fields</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {confidenceNotes.map((note) => <li key={note}>{note}</li>)}
                </ul>
              </div>
            )}
          </div>
        </section>

        <button
          type="button"
          onClick={approveInvoice}
          disabled={saving}
          className="mt-6 min-h-14 w-full rounded-2xl bg-blue-600 px-5 py-4 text-lg font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-200"
        >
                {saving ? dictionary.saveBill : dictionary.reviewFinalize}
        </button>

        {errorMessage && (
          <div className="mt-4 rounded-2xl bg-red-50 p-4 text-center text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        )}

        <p className="mt-4 pb-8 text-center text-xs text-slate-500">
          The invoice will be saved after you approve it.
        </p>
      </div>
    </main>
  );
}

export default function ReviewInvoicePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold">Loading...</div>}>
      <ReviewInvoiceContent />
    </Suspense>
  );
}