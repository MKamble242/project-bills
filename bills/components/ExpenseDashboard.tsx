"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { addPersonalExpense, expenseCategories, expenseCategoryLabel, readPersonalExpenses, type ExpenseCategory, type PersonalExpense } from "@/lib/expenses";

const money = (paise: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);
const today = () => new Date().toISOString().slice(0, 10);
const startOfWeek = (date: Date) => { const copy = new Date(date); const day = copy.getDay(); copy.setDate(copy.getDate() - (day === 0 ? 6 : day - 1)); copy.setHours(0, 0, 0, 0); return copy; };

export default function ExpenseDashboard() {
  const [expenses, setExpenses] = useState<PersonalExpense[]>(() => readPersonalExpenses());
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Chai/Nashta");
  const [customCategory, setCustomCategory] = useState("");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  const totals = useMemo(() => {
    const now = new Date();
    const todayValue = today();
    const weekStart = startOfWeek(now).toISOString().slice(0, 10);
    const month = todayValue.slice(0, 7);
    return {
      today: expenses.filter((expense) => expense.date === todayValue).reduce((sum, expense) => sum + expense.amountPaise, 0),
      week: expenses.filter((expense) => expense.date >= weekStart && expense.date <= todayValue).reduce((sum, expense) => sum + expense.amountPaise, 0),
      month: expenses.filter((expense) => expense.date.startsWith(month)).reduce((sum, expense) => sum + expense.amountPaise, 0),
    };
  }, [expenses]);

  function saveExpense(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const saved = addPersonalExpense({ amountPaise: Math.round(Number(amount) * 100), category, customCategory: category === "Other" ? customCategory : undefined, date, note });
      setExpenses((current) => [saved, ...current]);
      setAmount(""); setNote(""); setCustomCategory(""); setMessage("Expense saved");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save expense."); }
  }

  return <main className="min-h-screen bg-[#f5f7fb] px-4 py-5 text-slate-950"><div className="mx-auto max-w-5xl"><nav className="flex items-center justify-between"><Link href="/" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white">D</span><span><strong className="block tracking-[0.2em]">Diary</strong><small className="text-slate-500">Mere Kharche</small></span></Link><Link href="/settings" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">Settings</Link></nav><header className="mt-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Personal diary</p><h1 className="mt-2 text-4xl font-black tracking-tight">Mere Kharche</h1><p className="mt-2 text-slate-600">Keep everyday spending simple and visible.</p></header><section className="mt-7 grid gap-4 sm:grid-cols-3">{[["Today", totals.today], ["This week", totals.week], ["This month", totals.month]].map(([label, value]) => <div key={label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black">{money(value as number)}</p></div>)}</section><div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><form onSubmit={saveExpense} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Add expense</h2><div className="mt-5 space-y-4"><label className="block text-sm font-bold">Amount (₹)<input required min="0.01" step="0.01" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" placeholder="0" /></label><label className="block text-sm font-bold">Category<select value={category} onChange={(event) => setCategory(event.target.value as ExpenseCategory)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3">{expenseCategories.map((item) => <option key={item}>{item}</option>)}</select></label>{category === "Other" && <label className="block text-sm font-bold">Your category<input required value={customCategory} onChange={(event) => setCustomCategory(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" placeholder="For example, medicine" /></label>}<label className="block text-sm font-bold">Date<input required type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label><label className="block text-sm font-bold">Note <span className="font-normal text-slate-500">(optional)</span><input value={note} onChange={(event) => setNote(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" placeholder="What was it for?" /></label></div><button type="submit" className="mt-5 min-h-12 w-full rounded-xl bg-slate-950 px-5 py-3 font-bold text-white">Save expense</button>{message && <p className="mt-3 text-sm font-semibold text-slate-600">{message}</p>}</form><section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Category breakdown</h2><div className="mt-5 space-y-4">{expenseCategories.map((item) => { const total = expenses.filter((expense) => expense.category === item).reduce((sum, expense) => sum + expense.amountPaise, 0); return <div key={item} className="flex items-center justify-between border-b border-slate-100 pb-3"><span className="font-semibold text-slate-600">{item}</span><strong>{money(total)}</strong></div>; })}</div><h2 className="mt-8 text-xl font-black">Recent expenses</h2><div className="mt-4 space-y-3">{expenses.slice(-5).reverse().map((expense) => <div key={expense.id} className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 p-3"><div><p className="font-bold">{expenseCategoryLabel(expense)}</p><p className="text-xs text-slate-500">{expense.date}{expense.note ? ` · ${expense.note}` : ""}</p></div><strong>{money(expense.amountPaise)}</strong></div>)}{expenses.length === 0 && <p className="text-sm text-slate-500">No expenses recorded yet.</p>}</div></section></div></div></main>;
}
