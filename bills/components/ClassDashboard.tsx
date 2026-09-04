"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { addClassFeePayment, createClassFeeEntry, createStudent, deleteClassFeeEntry, deleteStudent, listStudentsWithFees, updateClassFeeEntry, updateStudent } from "@/lib/classes/repository";
import type { ClassFeeEntry, StudentFeeSummary } from "@/types/class";

function money(amountPaise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amountPaise / 100);
}

function toPaise(value: string) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric * 100) : 0;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function ClassDashboard() {
  const [students, setStudents] = useState<StudentFeeSummary[]>([]);
  const [studentName, setStudentName] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const [feePaidAmount, setFeePaidAmount] = useState("");
  const [feeDate, setFeeDate] = useState(dateKey(new Date()));
  const [feeNote, setFeeNote] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    try {
      const next = await listStudentsWithFees();
      setStudents(next);
      if (next.length > 0 && !selectedStudentId) {
        setSelectedStudentId(next[0].id);
      }
    } catch {
      setError("We could not load class records on this device.");
    }
  }, [selectedStudentId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadStudents(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadStudents]);

  const totals = useMemo(() => {
    const totalCollected = students.reduce((sum, student) => sum + student.totalPaidPaise, 0);
    const totalPending = students.reduce((sum, student) => sum + student.totalPendingPaise, 0);
    return { totalCollected, totalPending };
  }, [students]);

  async function saveStudent(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const saved = editingStudentId ? await updateStudent(editingStudentId, { name: studentName, guardianName, phone }) : await createStudent({ name: studentName, guardianName, phone });
      setStudentName("");
      setGuardianName("");
      setPhone("");
      setSelectedStudentId(saved.id);
      setEditingStudentId(null);
      setMessage(editingStudentId ? "Student updated." : "Student added.");
      await loadStudents();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Could not save student.");
    }
  }

  async function saveFeeEntry(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!selectedStudentId) {
      setError("Choose a student first.");
      return;
    }
    try {
      const details = {
        studentId: selectedStudentId,
        expectedAmountPaise: toPaise(feeAmount),
        paidAmountPaise: toPaise(feePaidAmount),
        date: feeDate,
        note: feeNote,
      };
      if (editingFeeId) await updateClassFeeEntry(editingFeeId, details);
      else await createClassFeeEntry(details);
      setFeeAmount("");
      setFeePaidAmount("");
      setFeeDate(dateKey(new Date()));
      setFeeNote("");
      setEditingFeeId(null);
      setMessage(editingFeeId ? "Fee record updated." : "Fee record saved.");
      await loadStudents();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Could not save fee record.");
    }
  }

  async function savePayment(entry: ClassFeeEntry) {
    setError("");
    setMessage("");
    try {
      await addClassFeePayment(entry.id, toPaise(paymentAmount));
      setPaymentAmount("");
      setActiveEntryId(null);
      setMessage("Additional payment saved.");
      await loadStudents();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Could not record payment.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto min-h-screen max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap items-center justify-between gap-3 py-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white">B</div>
            <div><p className="text-sm font-black tracking-[0.2em]">BILLS</p><p className="text-xs text-slate-500">Meri Class</p></div>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/settings" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">Settings</Link>
            <Link href="/students" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">View all</Link>
          </div>
        </nav>

        <header className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Class tracker</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Meri Class</h1>
          <p className="mt-2 text-slate-600">Track student fees, pending balances, and class collections.</p>
        </header>

        {message && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{message}</p>}
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

        <section className="mt-6 grid gap-3 sm:grid-cols-2">
          <Metric label="Total fees collected" value={money(totals.totalCollected)} tone="emerald" />
          <Metric label="Total fees pending" value={money(totals.totalPending)} tone="amber" />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <form onSubmit={saveStudent} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">{editingStudentId ? "Edit student" : "Add student"}</p>
            <h2 className="mt-2 text-2xl font-black">{editingStudentId ? "Update student" : "Create a student"}</h2>
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-bold">Student name<input required value={studentName} onChange={(event) => setStudentName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
              <label className="block text-sm font-bold">Parent/guardian name<input value={guardianName} onChange={(event) => setGuardianName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
              <label className="block text-sm font-bold">Phone number<input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
              <button type="submit" className="min-h-[52px] w-full rounded-xl bg-slate-950 px-4 py-3 font-black text-white">{editingStudentId ? "Save changes" : "Save student"}</button>
            </div>
          </form>

          <form onSubmit={saveFeeEntry} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">{editingFeeId ? "Edit fee record" : "Fee entry"}</p>
            <h2 className="mt-2 text-2xl font-black">{editingFeeId ? "Update class fee" : "Record class fee"}</h2>
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-bold">Student<select required value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3">
                <option value="">Select a student</option>
                {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
              </select></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-bold">Expected amount<input required inputMode="decimal" type="number" min="0" step="0.01" value={feeAmount} onChange={(event) => setFeeAmount(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
                <label className="block text-sm font-bold">Paid amount<input inputMode="decimal" type="number" min="0" step="0.01" value={feePaidAmount} onChange={(event) => setFeePaidAmount(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
              </div>
              <label className="block text-sm font-bold">Date<input required type="date" value={feeDate} onChange={(event) => setFeeDate(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
              <label className="block text-sm font-bold">Note<input value={feeNote} onChange={(event) => setFeeNote(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
              <button type="submit" className="min-h-[52px] w-full rounded-xl bg-blue-600 px-4 py-3 font-black text-white">{editingFeeId ? "Save changes" : "Save fee entry"}</button>
            </div>
          </form>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-black">Students</h2>
          {students.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No students yet.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {students.map((student) => (
                <div key={student.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-lg font-black">{student.name}</p>
                      {student.guardianName && <p className="text-sm text-slate-600">Guardian: {student.guardianName}</p>}
                      {student.phone && <p className="text-sm text-slate-600">Phone: {student.phone}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Paid</p>
                      <p className="font-black text-emerald-700">{money(student.totalPaidPaise)}</p>
                      <p className="mt-1 text-sm text-slate-500">Pending</p>
                      <p className="font-black text-amber-700">{money(student.totalPendingPaise)}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-3">
                    <button type="button" onClick={() => { setEditingStudentId(student.id); setStudentName(student.name); setGuardianName(student.guardianName); setPhone(student.phone); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="text-sm font-bold text-blue-700">Edit student</button>
                    <button type="button" onClick={() => { if (window.confirm("Delete this student and all their fee records? This cannot be undone.")) { void deleteStudent(student.id).then(() => { setStudents((current) => current.filter((item) => item.id !== student.id)); setMessage("Student deleted."); }).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Could not delete student.")); } }} className="text-sm font-bold text-red-700">Delete student</button>
                  </div>

                  {student.entries.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {student.entries.map((entry) => (
                        <div key={entry.id} className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-bold">{entry.date}</p>
                              <p className="text-sm text-slate-600">{entry.note || "No note"}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-500">Expected {money(entry.expectedAmountPaise)}</p>
                              <p className="text-sm text-slate-500">Paid {money(entry.paidAmountPaise)}</p>
                              <p className="text-sm font-bold text-slate-800">
                                Pending {money(Math.max(0, entry.expectedAmountPaise - entry.paidAmountPaise))}
                              </p>
                            </div>
                          </div>

                          {activeEntryId !== entry.id ? (
                            <div className="mt-2 flex gap-3">
                            <button
                              type="button"
                              onClick={() => setActiveEntryId(entry.id)}
                              className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700"
                            >
                              Add payment
                            </button>
                            <button type="button" onClick={() => { setEditingFeeId(entry.id); setSelectedStudentId(student.id); setFeeAmount(String(entry.expectedAmountPaise / 100)); setFeePaidAmount(String(entry.paidAmountPaise / 100)); setFeeDate(entry.date); setFeeNote(entry.note); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-blue-700">Edit</button>
                            <button type="button" onClick={() => { if (window.confirm("Delete this fee record? This cannot be undone.")) { void deleteClassFeeEntry(entry.id).then(() => { void loadStudents(); setMessage("Fee record deleted."); }).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Could not delete fee record.")); } }} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-red-700">Delete</button>
                            </div>
                          ) : (
                            <form
                              onSubmit={(event) => {
                                event.preventDefault();
                                void savePayment(entry);
                              }}
                              className="mt-3 flex flex-col gap-2 sm:flex-row"
                            >
                              <input
                                required
                                inputMode="decimal"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={paymentAmount}
                                onChange={(event) => setPaymentAmount(event.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 sm:max-w-[160px]"
                              />
                              <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Save payment</button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveEntryId(null);
                                  setPaymentAmount("");
                                }}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700"
                              >
                                Cancel
                              </button>
                            </form>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "emerald" | "amber" }) {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm font-semibold text-slate-500">{label}</p><p className={`mt-2 inline-block rounded-lg px-2 py-1 text-2xl font-black ${styles[tone]}`}>{value}</p></div>;
}
