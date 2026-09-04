"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { readShopEntries } from "@/lib/shop-entries";
import type { ShopEntry } from "@/lib/shop-entries";

const money = (paise: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);

export default function ShopEntriesPage() {
  const [entries] = useState<ShopEntry[]>(() => readShopEntries());
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("all");
  const visible = useMemo(() => { const today = new Date(); const todayKey = today.toISOString().slice(0, 10); const weekStart = new Date(today); weekStart.setDate(today.getDate() - 6); const month = todayKey.slice(0, 7); return entries.filter((entry) => entry.note.toLowerCase().includes(query.trim().toLowerCase())).filter((entry) => period === "all" || period === "today" ? (period === "all" || entry.date === todayKey) : period === "month" ? entry.date.startsWith(month) : new Date(`${entry.date}T00:00:00`) >= weekStart).sort((left, right) => right.date.localeCompare(left.date) || right.createdAt.localeCompare(left.createdAt)); }, [entries, query, period]);
  return <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 text-slate-950"><div className="mx-auto max-w-4xl"><Link href="/" className="text-sm font-bold text-slate-500">← Back to dashboard</Link><div className="mt-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Shop history</p><h1 className="mt-2 text-4xl font-black">All shop entries</h1><p className="mt-2 text-slate-600">{entries.length} saved entries</p></div><div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes" className="rounded-2xl border border-slate-200 bg-white px-4 py-4 font-semibold" /><select value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 font-bold"><option value="all">All dates</option><option value="today">Today</option><option value="week">Last 7 days</option><option value="month">This month</option></select></div><section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{visible.length === 0 ? <div className="p-10 text-center"><h2 className="font-black">No matching entries</h2><p className="mt-2 text-sm text-slate-500">Add a sale or expense from Meri Dukaan.</p></div> : visible.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-4 border-b border-slate-100 p-4 last:border-0"><div><p className="font-bold">{entry.type === "sale" ? "Sale" : entry.expenseReason}</p><p className="mt-1 text-sm text-slate-500">{entry.date}{entry.note ? ` · ${entry.note}` : ""}</p></div><p className={`font-black ${entry.type === "sale" ? "text-blue-700" : "text-amber-700"}`}>{entry.type === "sale" ? "+" : "-"}{money(entry.amountPaise)}</p></div>)}</section></div></main>;
}
