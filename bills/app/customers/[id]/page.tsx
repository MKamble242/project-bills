"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { findCustomer, type CustomerAggregate } from "@/lib/invoices/customer-repository";
import { listLocalInvoices } from "@/lib/invoices/local-repository";
import { readBusinessSettings } from "@/lib/business-settings";
import { formatCurrency } from "@/lib/formatters";

const money = (value: number) => formatCurrency(value);

function openWhatsApp(customer: CustomerAggregate, reminder: boolean) {
  let phone = customer.phone.replace(/\D/g, "");
  if (phone.length === 10) phone = `91${phone}`;
  if (!/^91[6-9]\d{9}$/.test(phone)) { alert("Please add a valid Indian mobile number before using WhatsApp."); return; }
  const invoice = customer.invoices[0];
  const settings = readBusinessSettings();
  const upiText = settings.upiId ? `You can pay using any UPI app.\nUPI ID: \`${settings.upiId}\`\n\n` : "";
  const businessName = settings.businessName === "Your Business Name" ? "" : `${settings.businessName}\n`;
  const message = reminder ? `Hello ${customer.name},\n\nA reminder for invoice ${invoice.invoiceNumber}.\n\nOutstanding amount: ${money(customer.outstanding)}\n\n${upiText}${businessName}Thank you.` : `Hello ${customer.name},\n\nYour invoice ${invoice.invoiceNumber} is ready.\n\nAmount: ${money(invoice.total)}\n\n${upiText}${businessName}Thank you.`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [customer, setCustomer] = useState<CustomerAggregate | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { void params.then(({ id }) => listLocalInvoices().then((invoices) => setCustomer(findCustomer(invoices, decodeURIComponent(id))))).finally(() => setLoading(false)); }, [params]);
  if (loading) return <main className="p-8 text-center font-bold">Loading customer...</main>;
  if (!customer) return <main className="p-8 text-center"><p className="font-bold">Customer not found.</p><Link href="/customers" className="mt-4 inline-block text-blue-700">Back to customers</Link></main>;
  return <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 text-slate-950"><div className="mx-auto max-w-3xl"><Link href="/customers" className="text-sm font-bold text-slate-500">← Back to customers</Link><div className="mt-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Customer ledger</p><h1 className="mt-2 text-4xl font-black">{customer.name}</h1><p className="mt-2 text-slate-500">{customer.phone || "No phone number"}</p></div><div className="flex flex-wrap gap-2"><Link href={`/invoices/new?customer=${encodeURIComponent(customer.name)}`} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">Create invoice</Link>{customer.phone && <button type="button" onClick={() => openWhatsApp(customer, false)} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">Open WhatsApp</button>}{customer.outstanding > 0 && customer.phone && <button type="button" onClick={() => openWhatsApp(customer, true)} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">Send payment reminder</button>}</div></div><section className="mt-8 grid grid-cols-3 gap-3"><div className="rounded-2xl bg-white p-4"><p className="text-sm text-slate-500">Invoiced</p><p className="mt-1 font-black">{money(customer.totalInvoiced)}</p></div><div className="rounded-2xl bg-white p-4"><p className="text-sm text-slate-500">Paid</p><p className="mt-1 font-black text-emerald-700">{money(customer.totalPaid)}</p></div><div className="rounded-2xl bg-white p-4"><p className="text-sm text-slate-500">Outstanding</p><p className="mt-1 font-black text-amber-700">{money(customer.outstanding)}</p></div></section><section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5"><h2 className="text-xl font-black">Invoice history</h2><div className="mt-4 divide-y divide-slate-100">{customer.invoices.map((invoice) => <Link key={invoice.id} href={`/invoices/${invoice.id}`} className="flex items-center justify-between gap-4 py-4"><div><p className="font-bold">{invoice.invoiceNumber}</p><p className="text-sm text-slate-500">{new Date(invoice.createdAt).toLocaleDateString("en-IN")} · {invoice.status}</p></div><div className="text-right"><p className="font-black">{money(invoice.total)}</p><p className="text-sm text-slate-500">Due {money(invoice.outstandingAmount)}</p></div></Link>)}</div></section><section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5"><h2 className="text-xl font-black">Payment history</h2>{customer.payments.length === 0 ? <p className="mt-3 text-sm text-slate-500">No payments recorded.</p> : <div className="mt-4 divide-y divide-slate-100">{customer.payments.map((payment) => <div key={payment.id} className="flex justify-between gap-4 py-3 text-sm"><span>{new Date(payment.paymentDate).toLocaleDateString("en-IN")} · {payment.paymentMethod}{payment.paymentReference ? ` · ${payment.paymentReference}` : ""}</span><strong>{money(payment.amount)}</strong></div>)}</div>}</section></div></main>;
}
