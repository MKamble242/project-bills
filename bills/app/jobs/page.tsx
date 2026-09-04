"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listLocalJobs } from "@/lib/jobs/repository";
import type { JobWithExpenses } from "@/types/job";

const money = (paise: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobWithExpenses[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("date");
  const [error, setError] = useState("");
  useEffect(() => { void listLocalJobs().then(setJobs).catch(() => setError("We could not load jobs on this device. Please try again.")); }, []);
  const visible = useMemo(() => jobs.filter((job) => `${job.customerName} ${job.title}`.toLowerCase().includes(query.trim().toLowerCase())).sort((left, right) => sort === "customer" ? left.customerName.localeCompare(right.customerName) : sort === "status" ? left.status.localeCompare(right.status) : right.createdAt.localeCompare(left.createdAt)), [jobs, query, sort]);
  return <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 text-slate-950"><div className="mx-auto max-w-4xl"><Link href="/" className="text-sm font-bold text-slate-500">← Back to dashboard</Link><div className="mt-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Work history</p><h1 className="mt-2 text-4xl font-black">All jobs</h1><p className="mt-2 text-slate-600">{jobs.length} total jobs</p></div><Link href="/?new-job=1" className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">New job</Link></div><div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer or work" className="rounded-2xl border border-slate-200 bg-white px-4 py-4 font-semibold" /><select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 font-bold"><option value="date">Newest first</option><option value="customer">Customer name</option><option value="status">Status</option></select></div>{error && <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}<section className="mt-8 space-y-3">{visible.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><h2 className="text-lg font-black">No matching jobs</h2><p className="mt-2 text-sm text-slate-500">Try another search or create a new job.</p></div> : visible.map((job) => <article key={job.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-black">{job.customerName}</p><p className="mt-1 text-sm text-slate-600">{job.title}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{job.status}</span></div><div className="mt-3 grid grid-cols-3 gap-2 text-sm"><span>Total {money(job.totalAmountPaise)}</span><span>Due {money(job.customerBalancePaise)}</span><span>Net {money(job.netAmountPaise)}</span></div></article>)}</section></div></main>;
}
