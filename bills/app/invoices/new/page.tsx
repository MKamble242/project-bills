"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { readBusinessSettings } from "@/lib/business-settings";
import {
  clearInvoiceDraft,
  readInvoiceDraft,
  writeInvoiceDraft,
  type InvoiceDraft,
} from "@/lib/invoices/draft-storage";
import type { DocumentType, InvoiceItemDraft, PaymentEvent } from "@/types/invoice";
import { useAppLanguage } from "@/components/AppLanguageProvider";

const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

function isValidGstin(gstin: string) {
  return gstinPattern.test(gstin.trim().toUpperCase());
}

function newItem(gstRate: number): InvoiceItemDraft {
  return { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, gstRate };
}

function InvoiceForm() {
  const { dictionary } = useAppLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hydrated, setHydrated] = useState(false);
  const [resumeDraft, setResumeDraft] = useState<InvoiceDraft | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>("simple_bill");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [gstRate, setGstRate] = useState(0);
  const [dueDays, setDueDays] = useState(0);
  const [items, setItems] = useState<InvoiceItemDraft[]>([]);
  const [advanceReceived, setAdvanceReceived] = useState(0);
  const [advancePaymentMethod, setAdvancePaymentMethod] = useState<PaymentEvent["paymentMethod"]>("upi");
  const [notes, setNotes] = useState("");
  const [advanceError, setAdvanceError] = useState("");
  const [hasGstin, setHasGstin] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const settings = readBusinessSettings();
      setHasGstin(isValidGstin(settings.gstin));
      const saved = readInvoiceDraft();
      if (saved && (saved.customerName.trim() || saved.items?.some((item) => item.description.trim() || item.unitPrice > 0))) {
        setResumeDraft(saved);
      } else {
        const initialDescription = searchParams.get("description") || "";
        const initialQuantity = Number(searchParams.get("quantity")) || 1;
        const initialPrice = Number(searchParams.get("price")) || 0;
        setItems([{ id: crypto.randomUUID(), description: initialDescription, quantity: initialQuantity, unitPrice: initialPrice, gstRate: 0 }]);
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  useEffect(() => {
    if (!hydrated || resumeDraft) return;
    const draft: InvoiceDraft = {
      documentType,
      customerName,
      customerPhone,
      customerAddress,
      invoiceDate,
      dueDate,
      description: items[0]?.description || "",
      quantity: items[0]?.quantity || 1,
      price: items[0]?.unitPrice || 0,
      gstRate: documentType === "tax_invoice" ? gstRate : 0,
      dueDays,
      advanceReceived,
      advancePaymentMethod,
      notes,
      confidenceNotes: [],
      items,
    };
    const timer = window.setTimeout(() => writeInvoiceDraft(draft), 500);
    return () => window.clearTimeout(timer);
  }, [hydrated, resumeDraft, documentType, customerName, customerPhone, customerAddress, invoiceDate, dueDate, items, gstRate, dueDays, advanceReceived, advancePaymentMethod, notes]);

  function continueDraft() {
    if (!resumeDraft) return;
    const draft = resumeDraft;
    setDocumentType(draft.documentType || "simple_bill");
    setCustomerName(draft.customerName);
    setCustomerPhone(draft.customerPhone);
    setCustomerAddress(draft.customerAddress || "");
    setInvoiceDate(draft.invoiceDate || new Date().toISOString().slice(0, 10));
    setDueDate(draft.dueDate || "");
    setGstRate(draft.gstRate || 0);
    setDueDays(draft.dueDays);
    setItems(draft.items || [{ id: crypto.randomUUID(), description: draft.description, quantity: draft.quantity, unitPrice: draft.price, gstRate: draft.gstRate }]);
    setAdvanceReceived(draft.advanceReceived || 0);
    setAdvancePaymentMethod(draft.advancePaymentMethod || "upi");
    setNotes(draft.notes || "");
    setResumeDraft(null);
  }

  function startNew() {
    clearInvoiceDraft();
    setResumeDraft(null);
    setItems([newItem(0)]);
  }

  function updateItem(id: string, changes: Partial<InvoiceItemDraft>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item));
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const gstAmount = documentType === "tax_invoice"
    ? items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.gstRate) / 100, 0)
    : 0;
  const total = Math.round((subtotal + gstAmount) * 100) / 100;
  const balanceDue = Math.max(0, total - advanceReceived);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!customerName.trim() || items.length === 0 || items.some((item) => !item.description.trim() || item.quantity <= 0 || item.unitPrice < 0)) {
      alert("Please complete the customer and invoice item details.");
      return;
    }
    if (documentType === "tax_invoice" && !hasGstin) {
      setAdvanceError("Add a valid GSTIN in Settings to create a Tax Invoice.");
      return;
    }
    if (!Number.isFinite(advanceReceived) || advanceReceived < 0 || advanceReceived > total) {
      setAdvanceError("Advance received cannot be more than total amount.");
      return;
    }

    const firstItem = items[0];
    const invoiceData: InvoiceDraft = {
      documentType,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      invoiceDate,
      dueDate,
      description: firstItem.description,
      quantity: firstItem.quantity,
      price: firstItem.unitPrice,
      gstRate: documentType === "tax_invoice" ? gstRate : 0,
      dueDays,
      advanceReceived,
      advancePaymentMethod,
      notes: notes.trim(),
      confidenceNotes: [],
      items: items.map((item) => ({ ...item, gstRate: documentType === "tax_invoice" ? item.gstRate : 0 })),
    };
    writeInvoiceDraft(invoiceData);
    router.push("/review");
  }

  if (!hydrated) return <div className="text-center font-bold">Loading...</div>;

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/" className="text-sm font-bold text-slate-500 hover:text-slate-950">← {dictionary.backDashboard}</Link>
      <div className="mt-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">{dictionary.createBill}</p><h1 className="mt-2 text-4xl font-black tracking-tight">{dictionary.newBill.replace("+ ", "")}</h1></div>
      <form onSubmit={handleSubmit} className="mt-6 space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{dictionary.simpleBill}</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {(["simple_bill", "tax_invoice"] as const).map((type) => (
              <button key={type} type="button" disabled={type === "tax_invoice" && !hasGstin} onClick={() => { setDocumentType(type); if (type === "simple_bill") { setGstRate(0); setItems((current) => current.map((item) => ({ ...item, gstRate: 0 }))); } }} className={`rounded-xl border px-4 py-3 text-sm font-bold ${documentType === type ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-700"} disabled:cursor-not-allowed disabled:opacity-50`}>{type === "simple_bill" ? dictionary.simpleBill : dictionary.taxInvoice}</button>
            ))}
          </div>
          {!hasGstin && <p className="mt-2 text-xs text-slate-500">Add a valid GSTIN in Settings to enable Tax Invoice.</p>}
        </div>

        <label className="block text-sm font-bold">Customer Name *<input required value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold" /></label>
        <label className="block text-sm font-bold">Customer WhatsApp Number<input type="tel" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold" /></label>
        <label className="block text-sm font-bold">Customer Address<input value={customerAddress} onChange={(event) => setCustomerAddress(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold" /></label>

        <div>
          <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Invoice items *</p><button type="button" onClick={() => setItems((current) => [...current, newItem(documentType === "tax_invoice" ? gstRate : 0)])} className="text-sm font-bold text-blue-700">+ Add item</button></div>
          <div className="mt-3 space-y-4">{items.map((item, index) => <div key={item.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase text-slate-400">Item {index + 1}</p>{items.length > 1 && <button type="button" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} className="text-xs font-bold text-red-600">Remove</button>}</div><input required value={item.description} placeholder="Work / Item" onChange={(event) => updateItem(item.id, { description: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold" /><div className="mt-3 grid grid-cols-2 gap-3"><input required type="number" min="1" value={item.quantity} aria-label="Quantity" onChange={(event) => updateItem(item.id, { quantity: Number(event.target.value) })} className="w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold" /><input required type="number" min="0" value={item.unitPrice || ""} aria-label="Rate" placeholder="Rate" onChange={(event) => updateItem(item.id, { unitPrice: Number(event.target.value) })} className="w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold" /></div>{documentType === "tax_invoice" && <select value={item.gstRate} aria-label="Tax percentage" onChange={(event) => updateItem(item.id, { gstRate: Number(event.target.value) })} className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold"><option value={0}>0% Tax</option><option value={5}>5% Tax</option><option value={12}>12% Tax</option><option value={18}>18% Tax</option><option value={28}>28% Tax</option></select>}</div>)}</div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-bold">Invoice date<input type="date" value={invoiceDate} onChange={(event) => setInvoiceDate(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label><label className="block text-sm font-bold">Payment Terms<select value={dueDays} onChange={(event) => setDueDays(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3"><option value={0}>Due Immediately</option><option value={7}>Within 7 Days</option><option value={15}>Within 15 Days</option><option value={30}>Within 30 Days</option></select></label></div>
        {documentType === "tax_invoice" && <label className="block text-sm font-bold">Tax rate default<select value={gstRate} onChange={(event) => { const next = Number(event.target.value); setGstRate(next); setItems((current) => current.map((item) => ({ ...item, gstRate: next }))); }} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3"><option value={0}>0%</option><option value={5}>5%</option><option value={12}>12%</option><option value={18}>18%</option><option value={28}>28%</option></select></label>}

        <div className="space-y-2 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600"><div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>{documentType === "tax_invoice" && <div className="flex justify-between"><span>GST</span><span>₹{gstAmount.toLocaleString("en-IN")}</span></div>}<div className="flex justify-between border-t border-slate-200 pt-2 text-base font-black text-slate-900"><span>Total Amount</span><span>₹{total.toLocaleString("en-IN")}</span></div></div>
        <div><label className="block text-sm font-bold">{dictionary.advanceReceived}<input type="number" min="0" step="0.01" value={advanceReceived || ""} onChange={(event) => { setAdvanceReceived(event.target.value === "" ? 0 : Number(event.target.value)); setAdvanceError(""); }} placeholder="0" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label><p className="mt-1 text-xs text-slate-500">Money already received before this bill.</p>{advanceReceived > 0 && <div className="mt-3 space-y-1 text-sm"><div className="flex justify-between"><span>{dictionary.advanceReceived}</span><span>₹{advanceReceived.toLocaleString("en-IN")}</span></div><div className="flex justify-between font-black text-slate-900"><span>{dictionary.balanceDue}</span><span>₹{balanceDue.toLocaleString("en-IN")}</span></div></div>}</div>
        {advanceReceived > 0 && <div><p className="text-sm font-bold">Advance payment method</p><div className="mt-2 grid grid-cols-2 gap-3">{(["upi", "cash"] as const).map((method) => <button key={method} type="button" onClick={() => setAdvancePaymentMethod(method)} className={`rounded-xl border px-3 py-3 text-sm font-bold ${advancePaymentMethod === method ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-slate-200"}`}>{method === "upi" ? "UPI" : "Cash"}</button>)}</div></div>}
        <label className="block text-sm font-bold">Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
        {advanceError && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{advanceError}</p>}
        <button type="submit" className="min-h-14 w-full rounded-2xl bg-blue-600 px-5 py-4 text-lg font-black text-white">Review invoice →</button>
        <button type="button" onClick={startNew} className="w-full text-sm font-bold text-slate-500 underline">Discard draft</button>
      </form>
      {resumeDraft && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><section role="dialog" aria-modal="true" aria-labelledby="resume-title" className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"><h2 id="resume-title" className="text-xl font-black">Continue unfinished bill?</h2><p className="mt-2 text-sm text-slate-600">Last saved: {resumeDraft.savedAt ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(resumeDraft.savedAt)) : "Recently"}</p><div className="mt-5 grid grid-cols-2 gap-3"><button type="button" onClick={continueDraft} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">Continue</button><button type="button" onClick={startNew} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">Start new</button></div></section></div>}
    </div>
  );
}

export default function NewInvoicePage() { return <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 text-slate-950"><Suspense fallback={<div className="text-center font-bold">Loading...</div>}><InvoiceForm /></Suspense></main>; }
