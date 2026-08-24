"use client";

export default function PrintInvoiceButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 font-black text-slate-950 transition hover:bg-slate-50 print:hidden"
    >
      Print invoice
    </button>
  );
}
