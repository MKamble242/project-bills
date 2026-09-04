"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listStudentsWithFees } from "@/lib/classes/repository";
import type { StudentFeeSummary } from "@/types/class";

const money = (paise: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentFeeSummary[]>([]);
  const [query, setQuery] = useState("");
  const [pendingOnly, setPendingOnly] = useState(false);
  const [sort, setSort] = useState("name");
  const [error, setError] = useState("");
  useEffect(() => { void listStudentsWithFees().then(setStudents).catch(() => setError("We could not load students on this device. Please try again.")); }, []);
  const visible = useMemo(() => students.filter((student) => student.name.toLowerCase().includes(query.trim().toLowerCase()) && (!pendingOnly || student.totalPendingPaise > 0)).sort((left, right) => sort === "pending" ? right.totalPendingPaise - left.totalPendingPaise : left.name.localeCompare(right.name)), [students, query, pendingOnly, sort]);
  return <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 text-slate-950"><div className="mx-auto max-w-4xl"><Link href="/" className="text-sm font-bold text-slate-500">← Back to dashboard</Link><div className="mt-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Class history</p><h1 className="mt-2 text-4xl font-black">All students</h1><p className="mt-2 text-slate-600">{students.length} total students</p></div><div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search student name" className="rounded-2xl border border-slate-200 bg-white px-4 py-4 font-semibold" /><button type="button" onClick={() => setPendingOnly((value) => !value)} className={`rounded-2xl border px-4 py-4 text-sm font-bold ${pendingOnly ? "border-amber-500 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-700"}`}>{pendingOnly ? "Pending only" : "All students"}</button><select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 font-bold"><option value="name">Name</option><option value="pending">Highest pending</option></select></div>{error && <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}<section className="mt-8 grid gap-3 sm:grid-cols-2">{visible.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center sm:col-span-2"><h2 className="text-lg font-black">No matching students</h2><p className="mt-2 text-sm text-slate-500">Try another search or add a student from Meri Class.</p></div> : visible.map((student) => <article key={student.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><p className="font-black">{student.name}</p><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">Pending {money(student.totalPendingPaise)}</span></div><p className="mt-2 text-sm text-slate-600">Collected {money(student.totalPaidPaise)} of {money(student.totalExpectedPaise)}</p></article>)}</section></div></main>;
}
