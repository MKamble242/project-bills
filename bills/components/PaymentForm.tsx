"use client";

import { useState } from "react";
import { recordLocalPayment } from "@/lib/invoices/local-repository";
import type { Invoice, PaymentEvent } from "@/types/invoice";
import { useAppLanguage } from "@/components/AppLanguageProvider";

type Props = { invoice: Invoice; onSaved: (invoice: Invoice) => void };

export default function PaymentForm({ invoice, onSaved }: Props) {
  const { dictionary } = useAppLanguage();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(invoice.outstandingAmount.toFixed(2));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<PaymentEvent["paymentMethod"]>("upi");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const saved = await recordLocalPayment(invoice.id, {
        amount: Number(amount), paymentDate: date, paymentMethod: method,
        paymentReference: reference.trim() || null, notes: notes.trim() || null,
      });
      onSaved(saved);
      setOpen(false);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Could not record payment.");
    } finally { setSaving(false); }
  }

  if (invoice.status === "paid") return <p className="rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800">{dictionary.paidInFull}</p>;

  return <>
    <button type="button" onClick={() => setOpen(true)} className="min-h-14 w-full rounded-2xl bg-emerald-50 px-5 py-4 font-black text-emerald-700 print:hidden">{dictionary.recordPayment}</button>
    {open && <div className="fixed inset-0 z-20 flex items-end justify-center bg-slate-950/40 p-4 sm:items-center"><form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-2xl"><div><h2 className="text-2xl font-black">Record payment</h2><p className="mt-1 text-sm text-slate-500">Outstanding: ₹{invoice.outstandingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p></div><input aria-label="Payment amount" type="number" min="0.01" max={invoice.outstandingAmount} step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3" /><input aria-label="Payment date" type="date" required value={date} onChange={(event) => setDate(event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3" /><select aria-label="Payment method" value={method} onChange={(event) => setMethod(event.target.value as PaymentEvent["paymentMethod"])} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"><option value="upi">UPI</option><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="card">Card</option><option value="other">Other</option></select><input aria-label="Payment reference" placeholder="UTR / payment reference (optional)" value={reference} onChange={(event) => setReference(event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3" /><textarea aria-label="Payment notes" placeholder="Notes (optional)" value={notes} onChange={(event) => setNotes(event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3" />{error && <p className="text-sm font-semibold text-red-700">{error}</p>}<div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 px-4 py-3 font-bold">Cancel</button><button disabled={saving} className="rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white">{saving ? "Saving..." : "Save payment"}</button></div></form></div>}
  </>;
}
