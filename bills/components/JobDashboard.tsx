"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { addJobExpense, completeLocalJob, createLocalJob, listLocalJobs, recordJobPayment } from "@/lib/jobs/repository";
import type { JobExpenseType, JobWithExpenses } from "@/types/job";

const expenseTypes: JobExpenseType[] = ["material", "travel", "labour", "other"];

function money(amountPaise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amountPaise / 100);
}

function paiseFromRupees(value: string) {
  const rupees = Number(value);
  return Number.isFinite(rupees) ? Math.round(rupees * 100) : 0;
}

export default function JobDashboard() {
  const [jobs, setJobs] = useState<JobWithExpenses[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [title, setTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [expenseType, setExpenseType] = useState<JobExpenseType>("material");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseNote, setExpenseNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadJobs() {
    try {
      setJobs(await listLocalJobs());
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[JobDashboard] job load failed", {
          errorName: error instanceof Error ? error.name : "UnknownError",
          errorMessage: error instanceof Error ? error.message : String(error),
          databaseName: "project-bills",
          expectedVersion: 4,
        });
      }
      setError("We could not load jobs stored on this device.");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadJobs(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function resetMessage() {
    setMessage("");
    setError("");
  }

  async function saveJob(event: React.FormEvent) {
    event.preventDefault();
    resetMessage();
    try {
      await createLocalJob({ customerName, title, totalAmountPaise: paiseFromRupees(totalAmount), receivedAmountPaise: paiseFromRupees(receivedAmount) });
      setCustomerName("");
      setTitle("");
      setTotalAmount("");
      setReceivedAmount("");
      setShowCreate(false);
      setMessage("Job saved.");
      await loadJobs();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Could not save job.");
    }
  }

  async function savePayment(job: JobWithExpenses) {
    resetMessage();
    try {
      await recordJobPayment(job.id, paiseFromRupees(paymentAmount));
      setPaymentAmount("");
      setActiveJobId(null);
      setMessage("Payment recorded.");
      await loadJobs();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Could not record payment.");
    }
  }

  async function saveExpense(job: JobWithExpenses) {
    resetMessage();
    try {
      await addJobExpense(job.id, {
        type: expenseType,
        amountPaise: paiseFromRupees(expenseAmount),
        note: expenseNote,
        date: new Date().toISOString().slice(0, 10),
      });
      setExpenseAmount("");
      setExpenseNote("");
      setActiveJobId(null);
      setMessage("Job expense added.");
      await loadJobs();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Could not add job expense.");
    }
  }

  async function completeJob(job: JobWithExpenses) {
    resetMessage();
    try {
      await completeLocalJob(job.id);
      setMessage("Job marked completed.");
      await loadJobs();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Could not complete job.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto min-h-screen max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap items-center justify-between gap-3 py-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white">B</div>
            <div><p className="text-sm font-black tracking-[0.2em]">BILLS</p><p className="text-xs text-slate-500">Mera Kaam</p></div>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/settings" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">Settings</Link>
            <button type="button" onClick={() => { resetMessage(); setShowCreate(true); }} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">+ New job</button>
          </div>
        </nav>

        <header className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Work diary</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Mera Kaam</h1>
          <p className="mt-2 text-slate-600">Track the work, money received, and costs behind every job.</p>
        </header>

        {message && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{message}</p>}
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

        {showCreate && <CreateJobForm customerName={customerName} setCustomerName={setCustomerName} title={title} setTitle={setTitle} totalAmount={totalAmount} setTotalAmount={setTotalAmount} receivedAmount={receivedAmount} setReceivedAmount={setReceivedAmount} onClose={() => setShowCreate(false)} onSubmit={saveJob} />}

        <section className="mt-6 space-y-4">
          {jobs.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><h2 className="text-lg font-black">No jobs yet</h2><p className="mt-2 text-sm text-slate-500">Create your first work entry to start tracking it.</p><button type="button" onClick={() => setShowCreate(true)} className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">Create first job</button></div> : jobs.map((job) => <JobCard key={job.id} job={job} activeJobId={activeJobId} setActiveJobId={setActiveJobId} paymentAmount={paymentAmount} setPaymentAmount={setPaymentAmount} expenseType={expenseType} setExpenseType={setExpenseType} expenseAmount={expenseAmount} setExpenseAmount={setExpenseAmount} expenseNote={expenseNote} setExpenseNote={setExpenseNote} onPayment={savePayment} onExpense={saveExpense} onComplete={completeJob} />)}
        </section>
      </div>
    </main>
  );
}

type CreateJobFormProps = {
  customerName: string;
  setCustomerName: (value: string) => void;
  title: string;
  setTitle: (value: string) => void;
  totalAmount: string;
  setTotalAmount: (value: string) => void;
  receivedAmount: string;
  setReceivedAmount: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
};

function CreateJobForm(props: CreateJobFormProps) {
  return <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">New work entry</p><h2 className="mt-1 text-2xl font-black">Create a job</h2></div><button type="button" onClick={props.onClose} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600">Close</button></div><form onSubmit={props.onSubmit} className="mt-5 space-y-4"><label className="block text-sm font-bold">Customer name<input required value={props.customerName} onChange={(event) => props.setCustomerName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label><label className="block text-sm font-bold">Work title or description<input required value={props.title} onChange={(event) => props.setTitle(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-bold">Total job amount<input required inputMode="decimal" type="number" min="0.01" step="0.01" value={props.totalAmount} onChange={(event) => props.setTotalAmount(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label><label className="block text-sm font-bold">Advance/payment received<input inputMode="decimal" type="number" min="0" step="0.01" value={props.receivedAmount} onChange={(event) => props.setReceivedAmount(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label></div><button type="submit" className="min-h-[52px] w-full rounded-xl bg-slate-950 px-4 py-3 font-black text-white">Save job</button></form></section>;
}

type JobCardProps = {
  job: JobWithExpenses;
  activeJobId: string | null;
  setActiveJobId: (value: string | null) => void;
  paymentAmount: string;
  setPaymentAmount: (value: string) => void;
  expenseType: JobExpenseType;
  setExpenseType: (value: JobExpenseType) => void;
  expenseAmount: string;
  setExpenseAmount: (value: string) => void;
  expenseNote: string;
  setExpenseNote: (value: string) => void;
  onPayment: (job: JobWithExpenses) => Promise<void>;
  onExpense: (job: JobWithExpenses) => Promise<void>;
  onComplete: (job: JobWithExpenses) => Promise<void>;
};

function JobCard(props: JobCardProps) {
  const { job } = props;
  return <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-lg font-black">{job.customerName}</p><p className="mt-1 text-slate-600">{job.title}</p></div><span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${job.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{job.status}</span></div><div className="mt-5 grid gap-3 sm:grid-cols-4"><Metric label="Total" value={money(job.totalAmountPaise)} /><Metric label="Customer balance" value={money(job.customerBalancePaise)} /><Metric label="Job expenses" value={money(job.totalJobExpensesPaise)} /><Metric label="Net remaining" value={money(job.netAmountPaise)} /></div>{job.expenses.length > 0 && <div className="mt-5 border-t border-slate-100 pt-4"><p className="text-sm font-black">Expenses</p>{job.expenses.map((expense) => <div key={expense.id} className="mt-2 flex justify-between gap-3 text-sm"><span className="text-slate-600">{expense.type}{expense.note ? ` · ${expense.note}` : ""}</span><span className="font-bold">{money(expense.amountPaise)}</span></div>)}</div>}<p className="mt-4 text-sm text-slate-500">Received: <strong className="text-slate-900">{money(job.receivedAmountPaise)}</strong></p>{props.activeJobId === job.id && <div className="mt-5 grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2"><form onSubmit={(event) => { event.preventDefault(); void props.onPayment(job); }} className="space-y-2"><p className="text-sm font-black">Record payment</p><input required inputMode="decimal" type="number" min="0.01" step="0.01" placeholder="Amount" value={props.paymentAmount} onChange={(event) => props.setPaymentAmount(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2" /><button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Save payment</button></form><form onSubmit={(event) => { event.preventDefault(); void props.onExpense(job); }} className="space-y-2"><p className="text-sm font-black">Add expense</p><select value={props.expenseType} onChange={(event) => props.setExpenseType(event.target.value as JobExpenseType)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2">{expenseTypes.map((type) => <option key={type}>{type}</option>)}</select><input required inputMode="decimal" type="number" min="0.01" step="0.01" placeholder="Amount" value={props.expenseAmount} onChange={(event) => props.setExpenseAmount(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2" /><input value={props.expenseNote} onChange={(event) => props.setExpenseNote(event.target.value)} maxLength={200} placeholder="Note (optional)" className="w-full rounded-xl border border-slate-200 px-3 py-2" /><button type="submit" className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white">Save expense</button></form></div>}<div className="mt-5 flex flex-wrap gap-3">{job.status === "active" && <button type="button" onClick={() => { props.setActiveJobId(props.activeJobId === job.id ? null : job.id); }} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">Payment / expense</button>}{job.status === "active" && <button type="button" onClick={() => void props.onComplete(job)} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">Mark completed</button>}</div></article>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 font-black">{value}</p></div>;
}
