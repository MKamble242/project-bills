"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { invoiceId: string; status: string; amount: number };

export default function InvoiceStatusButton({ invoiceId, status, amount }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function markPaid() {
    if (!window.confirm("Mark this invoice as paid?")) return;
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof result === "object" && result !== null && "error" in result && typeof result.error === "string"
            ? result.error
            : "We could not update this invoice.";
        setError(message);
        return;
      }
      router.refresh();
    } catch {
      setError("We could not update this invoice. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (status === "paid") return null;

  return (
    <div>
      <button
        type="button"
        onClick={markPaid}
        disabled={saving}
        className="min-h-14 w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-black text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Updating..." : "Mark as paid"}
      </button>
      {error && <p className="mt-2 text-center text-sm font-semibold text-red-700">{error}</p>}
    </div>
  );
}
