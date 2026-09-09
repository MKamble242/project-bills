"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const workTypes = ["Meri Dukaan", "Mera Kaam", "Meri Class", "Mere Kharche"];

export default function FeedbackPage() {
  const [workType, setWorkType] = useState(workTypes[0]);
  const [usefulness, setUsefulness] = useState("");
  const [confusion, setConfusion] = useState("");
  const [contact, setContact] = useState("");
  const [sent, setSent] = useState(false);
  const message = useMemo(() => ["Diary feedback", `Diary: ${workType}`, `Most useful: ${usefulness || "Not answered"}`, `Most confusing: ${confusion || "Not answered"}`, contact ? `Contact: ${contact}` : ""].filter(Boolean).join("\n"), [workType, usefulness, confusion, contact]);

  function sendFeedback() {
    setSent(true);
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 text-slate-950"><div className="mx-auto max-w-xl"><Link href="/settings" className="text-sm font-bold text-slate-500">← Back to Diary settings</Link><section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Diary feedback</p><h1 className="mt-2 text-4xl font-black">Send feedback</h1><p className="mt-3 text-slate-600">A few honest answers help us make Diary clearer for daily work.</p><div className="mt-6 space-y-4"><label className="block text-sm font-bold">Your diary<select value={workType} onChange={(event) => setWorkType(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3">{workTypes.map((type) => <option key={type}>{type}</option>)}</select></label><label className="block text-sm font-bold">What was most useful?<textarea value={usefulness} onChange={(event) => setUsefulness(event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3" /></label><label className="block text-sm font-bold">What was most confusing?<textarea value={confusion} onChange={(event) => setConfusion(event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3" /></label><label className="block text-sm font-bold">Contact details <span className="font-normal text-slate-500">(optional)</span><input value={contact} onChange={(event) => setContact(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label><button type="button" onClick={sendFeedback} className="min-h-12 w-full rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white">Send feedback via WhatsApp</button>{sent && <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Your feedback message is ready in WhatsApp.</p>}</div></section></div></main>;
}
