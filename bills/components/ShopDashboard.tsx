"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { addShopEntry, readShopEntries, type ShopEntry, type ShopEntryType } from "@/lib/shop-entries";

const expenseReasons: NonNullable<ShopEntry["expenseReason"]>[] = ["Stock", "Dukaan ka Rent", "Light Bill", "Transport", "Helper", "Other"];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function moneyFromPaise(amountPaise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amountPaise / 100);
}

function sumEntries(entries: ShopEntry[], type: ShopEntryType, dateMatches: (date: string) => boolean) {
  return entries.filter((entry) => entry.type === type && dateMatches(entry.date)).reduce((total, entry) => total + entry.amountPaise, 0);
}

export default function ShopDashboard() {
  const [entries, setEntries] = useState<ShopEntry[]>(() => readShopEntries());
  const [entryType, setEntryType] = useState<ShopEntryType | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [expenseReason, setExpenseReason] = useState<NonNullable<ShopEntry["expenseReason"]>>("Stock");
  const [date, setDate] = useState(() => dateKey(new Date()));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const today = dateKey(new Date());
  const monthPrefix = today.slice(0, 7);
  const todaySale = sumEntries(entries, "sale", (entryDate) => entryDate === today);
  const todayExpense = sumEntries(entries, "expense", (entryDate) => entryDate === today);
  const monthSale = sumEntries(entries, "sale", (entryDate) => entryDate.startsWith(monthPrefix));
  const monthExpense = sumEntries(entries, "expense", (entryDate) => entryDate.startsWith(monthPrefix));
  const recentEntries = useMemo(() => [...entries].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 8), [entries]);

  function openEntryForm(type: ShopEntryType) {
    setEntryType(type);
    setAmount("");
    setNote("");
    setDate(dateKey(new Date()));
    setError("");
    setMessage("");
  }

  function saveEntry(event: React.FormEvent) {
    event.preventDefault();
    const rupees = Number(amount);
    if (!Number.isFinite(rupees) || rupees <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    const amountPaise = Math.round(rupees * 100);
    if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    const saved = addShopEntry({ type: entryType || "sale", amountPaise, note: note.trim(), date, ...(entryType === "expense" ? { expenseReason } : {}) });
    setEntries((current) => [...current, saved]);
    setEntryType(null);
    setMessage(entryType === "sale" ? "Sale saved." : "Dukaan ka kharcha saved.");
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto min-h-screen max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap items-center justify-between gap-3 py-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white">B</div>
            <div><p className="text-sm font-black tracking-[0.2em]">BILLS</p><p className="text-xs text-slate-500">Meri Dukaan</p></div>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/settings" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">Settings</Link>
            <Link href="/invoices/new" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">Create Bill</Link>
          </div>
        </nav>

        <header className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Shop diary</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Meri Dukaan</h1>
          <p className="mt-2 text-slate-600">Dukaan se aaya, dukaan mein gaya, dukaan se bacha.</p>
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <Summary label="Aaj ki Sale" value={todaySale} tone="blue" />
          <Summary label="Aaj ka Kharcha" value={todayExpense} tone="amber" />
          <Summary label="Aaj Dukaan se Bacha" value={todaySale - todayExpense} tone="emerald" />
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <Summary label="Supplier ko Dena Hai" value={0} tone="slate" />
          <Summary label="Is Mahine ki Sale" value={monthSale} tone="blue" />
          <Summary label="Is Mahine ka Dukaan Kharcha" value={monthExpense} tone="amber" />
          <Summary label="Is Mahine Dukaan se Bacha" value={monthSale - monthExpense} tone="emerald" />
        </section>

        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          <button type="button" onClick={() => openEntryForm("sale")} className="min-h-[56px] rounded-2xl bg-blue-600 px-5 py-4 text-base font-black text-white">+ Sale Likho</button>
          <button type="button" onClick={() => openEntryForm("expense")} className="min-h-[56px] rounded-2xl bg-amber-500 px-5 py-4 text-base font-black text-white">- Dukaan ka Kharcha</button>
          <button type="button" onClick={() => setMessage("Supplier balance tracking will be added when supplier records are introduced.")} className="min-h-[56px] rounded-2xl border border-slate-300 bg-white px-5 py-4 text-base font-black text-slate-800">Supplier ka Hisaab</button>
        </section>

        {message && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{message}</p>}

        {entryType && (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">New entry</p><h2 className="mt-1 text-2xl font-black">{entryType === "sale" ? "Sale Likho" : "Dukaan ka Kharcha"}</h2></div><button type="button" onClick={() => setEntryType(null)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600">Close</button></div>
            <form onSubmit={saveEntry} className="mt-5 space-y-4">
              <label className="block text-sm font-bold">Amount<input required inputMode="decimal" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-bold" /></label>
              {entryType === "sale" ? <label className="block text-sm font-bold">Short note <span className="font-normal text-slate-500">(optional)</span><input value={note} onChange={(event) => setNote(event.target.value)} maxLength={200} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label> : <label className="block text-sm font-bold">Expense reason<select value={expenseReason} onChange={(event) => setExpenseReason(event.target.value as NonNullable<ShopEntry["expenseReason"]>)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3">{expenseReasons.map((reason) => <option key={reason}>{reason}</option>)}</select></label>}
              {entryType === "expense" && <label className="block text-sm font-bold">Short note <span className="font-normal text-slate-500">(optional)</span><input value={note} onChange={(event) => setNote(event.target.value)} maxLength={200} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>}
              <label className="block text-sm font-bold">Date<input required type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
              {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
              <button type="submit" className="min-h-[52px] w-full rounded-xl bg-slate-950 px-4 py-3 font-black text-white">Save</button>
            </form>
          </section>
        )}

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-black">Recent dukaan entries</h2>
          {recentEntries.length === 0 ? <p className="mt-3 text-sm text-slate-500">No shop entries yet.</p> : <div className="mt-4 divide-y divide-slate-100">{recentEntries.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-4 py-3"><div><p className="font-bold">{entry.type === "sale" ? "Sale" : entry.expenseReason}</p><p className="mt-1 text-sm text-slate-500">{entry.date}{entry.note ? ` · ${entry.note}` : ""}</p></div><p className={`font-black ${entry.type === "sale" ? "text-blue-700" : "text-amber-700"}`}>{entry.type === "sale" ? "+" : "-"}{moneyFromPaise(entry.amountPaise)}</p></div>)}</div>}
        </section>
      </div>
    </main>
  );
}

function Summary({ label, value, tone }: { label: string; value: number; tone: "blue" | "amber" | "emerald" | "slate" }) {
  const styles = { blue: "bg-blue-50 text-blue-700", amber: "bg-amber-50 text-amber-700", emerald: "bg-emerald-50 text-emerald-700", slate: "bg-slate-100 text-slate-700" };
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm font-semibold text-slate-500">{label}</p><p className={`mt-2 inline-block rounded-lg px-2 py-1 text-2xl font-black ${styles[tone]}`}>{moneyFromPaise(value)}</p></div>;
}
