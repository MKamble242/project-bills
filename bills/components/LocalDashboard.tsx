"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { readBusinessSettings } from "@/lib/business-settings";
import {
  getLocalInvoice,
  listLocalInvoices,
  readAppMetadata,
  recordLocalPayment,
  writeAppMetadata,
} from "@/lib/invoices/local-repository";
import { createLocalBackup } from "@/lib/invoices/local-repository";
import { downloadText } from "@/lib/invoices/backup";
import type { Invoice, PaymentEvent } from "@/types/invoice";
import OnlineStatus from "@/components/OnlineStatus";
import { useAppLanguage } from "@/components/AppLanguageProvider";
import { useProfession } from "@/components/ProfessionGate";
import ShopDashboard from "@/components/ShopDashboard";

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function initials(name: string) {
  return name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();
}

function isQuickMarkPaidEligible(invoice: Invoice) {
  return (
    invoice.status !== "paid" &&
    invoice.status !== "cancelled" &&
    invoice.status !== "draft" &&
    invoice.outstandingAmount > 0
  );
}

function getCustomerLabel(invoice: Invoice) {
  return invoice.customerName?.trim() ? invoice.customerName : "Unknown customer";
}

function getWorkSummary(invoice: Invoice) {
  const items = (invoice.items ?? []).filter(
    (item) => item?.description && item.description.trim().length > 0
  );

  if (items.length > 0) {
    const [firstItem, ...rest] = items;
    return rest.length > 0
      ? `${firstItem.description.trim()} + ${rest.length} more items`
      : firstItem.description.trim();
  }

  if (invoice.description?.trim()) {
    return invoice.description.trim();
  }

  return "Invoice items";
}

function formatBackupDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function LocalDashboard() {
  const { profile } = useProfession();
  return profile?.professionGroup === "shop" ? <ShopDashboard /> : <GeneralLocalDashboard />;
}

function GeneralLocalDashboard() {
  const { dictionary } = useAppLanguage();
  const { profile } = useProfession();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [amountsHidden, setAmountsHidden] = useState(false);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [backupState, setBackupState] = useState<"idle" | "preparing" | "success" | "error">("idle");
  const [backupMessage, setBackupMessage] = useState("");
  const [setupChecklistDismissed, setSetupChecklistDismissed] = useState(false);
  const [quickPayInvoiceId, setQuickPayInvoiceId] = useState<string | null>(null);
  const [quickPayMethod, setQuickPayMethod] = useState<PaymentEvent["paymentMethod"]>("upi");
  const [savingInvoiceId, setSavingInvoiceId] = useState<string | null>(null);
  const [quickPayError, setQuickPayError] = useState("");
  const [toast, setToast] = useState<{ title: string; detail?: string } | null>(null);

  async function loadInvoices() {
    setLoading(true);
    setError("");
    try {
      setInvoices(await listLocalInvoices());
    } catch {
      setError("We could not load invoices stored on this device.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const load = window.setTimeout(() => { void loadInvoices(); }, 0);
    return () => window.clearTimeout(load);
  }, []);

  useEffect(() => {
    void Promise.all([
      readAppMetadata("dashboard_amounts_hidden").then((value) => {
        if (typeof value === "boolean") setAmountsHidden(value);
      }),
      readAppMetadata("last_backup_at").then((value) => {
        if (typeof value === "string" && value) setLastBackupAt(value);
      }),
      readAppMetadata("dashboard_setup_checklist_dismissed").then((value) => {
        if (typeof value === "boolean") setSetupChecklistDismissed(value);
      }),
    ]);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const quickPayInvoice = useMemo(
    () => (quickPayInvoiceId ? invoices.find((invoice) => invoice.id === quickPayInvoiceId) ?? null : null),
    [invoices, quickPayInvoiceId]
  );

  const paid = invoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.total, 0);
  const unpaid = invoices
    .filter((invoice) => invoice.status !== "paid")
    .reduce((sum, invoice) => sum + invoice.total, 0);

  const businessSettings = readBusinessSettings();
  const businessProfileComplete = Boolean(businessSettings.businessName.trim());
  const upiConfigured = Boolean(businessSettings.upiId.trim());
  const backupConfigured = Boolean(lastBackupAt);
  const showSetupChecklist = !setupChecklistDismissed && !(businessProfileComplete && upiConfigured && backupConfigured);

  async function handleBackupNow() {
    setBackupState("preparing");
    setBackupMessage("");

    try {
      const backup = await createLocalBackup();
      const stamp = new Date().toISOString().slice(0, 10);
      downloadText(
        `project-bills-backup-${stamp}.json`,
        JSON.stringify(backup, null, 2),
        "application/json"
      );
      const timestamp = new Date().toISOString();
      await writeAppMetadata("last_backup_at", timestamp);
      setLastBackupAt(timestamp);
      setBackupState("success");
      setBackupMessage("Backup file created");
    } catch {
      setBackupState("error");
      setBackupMessage("Could not create backup file");
    }
  }

  async function handleQuickPay() {
    if (!quickPayInvoice) return;

    const currentInvoice = await getLocalInvoice(quickPayInvoice.id);
    if (!currentInvoice) {
      setQuickPayError("This invoice could not be found.");
      return;
    }

    if (
      currentInvoice.status === "paid" ||
      currentInvoice.status === "cancelled" ||
      currentInvoice.status === "draft" ||
      currentInvoice.outstandingAmount <= 0
    ) {
      setQuickPayInvoiceId(null);
      return;
    }

    setSavingInvoiceId(currentInvoice.id);
    setQuickPayError("");

    try {
      const recordedAmount = currentInvoice.outstandingAmount;
      const saved = await recordLocalPayment(currentInvoice.id, {
        amount: recordedAmount,
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMethod: quickPayMethod,
        paymentReference: null,
        notes: "Marked paid manually using Quick Mark Paid.",
      });

      setInvoices((currentInvoices) =>
        currentInvoices.map((invoice) => (invoice.id === saved.id ? saved : invoice))
      );
      await loadInvoices();
      setQuickPayInvoiceId(null);
      setToast({
        title: "Payment recorded manually",
        detail: `${currency(recordedAmount)} was recorded as a ${quickPayMethod === "cash" ? "cash" : "UPI"} payment.`,
      });
    } catch (caught: unknown) {
      setQuickPayError(
        caught instanceof Error
          ? caught.message === "Payment must be greater than zero and no more than the outstanding amount."
            ? "Could not record payment. Please try again."
            : caught.message
          : "Could not record payment. Please try again."
      );
    } finally {
      setSavingInvoiceId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto min-h-screen max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap items-center justify-between gap-3 py-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white shadow-lg shadow-slate-950/20">B</div>
            <div><p className="text-sm font-black tracking-[0.2em]">BILLS</p><p className="text-xs text-slate-500">Invoice less. Earn more.</p></div>
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <OnlineStatus />
            <Link href="/settings" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">{dictionary.navSettings}</Link>
            <Link href="/customers" className="hidden rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 sm:block">{dictionary.navCustomers}</Link>
            <Link href="/invoices/new" className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">{dictionary.createBill}</Link>
          </div>
        </nav>

        <p className="mt-3 text-sm font-semibold text-slate-500">Your setup: <span className="text-slate-900">{profile?.professionName}</span></p>

        <section className="relative mt-5 overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-2xl shadow-slate-900/20 sm:px-10 sm:py-12">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-xs font-semibold text-amber-100"><span className="h-2 w-2 rounded-full bg-amber-300" />Local-only mode</div>
            <h1 className="max-w-xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">Turn messy work<span className="block text-blue-400">into clean money.</span></h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">Invoices are stored only on this device and are not synced to Supabase.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link href="/invoices/new" className="flex min-h-14 items-center justify-between rounded-2xl bg-blue-500 px-5 py-4 font-bold text-white shadow-xl shadow-blue-500/25 transition hover:bg-blue-400"><span><span className="block text-xs uppercase tracking-wider text-blue-100">Manual</span>Create Invoice</span><span className="text-2xl">+</span></Link>
            </div>
          </div>
        </section>

        {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}<button type="button" onClick={() => void loadInvoices()} className="ml-3 font-bold underline">Retry</button></div>}

        {showSetupChecklist && (
          <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-amber-900">Get BILLS ready</p>
                <p className="mt-1 text-sm text-amber-800">Complete the essentials before you send your next bill.</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  setSetupChecklistDismissed(true);
                  await writeAppMetadata("dashboard_setup_checklist_dismissed", true);
                }}
                className="rounded-full border border-amber-300 bg-white px-2 py-1 text-xs font-bold text-amber-800"
              >
                Hide for now
              </button>
            </div>

            <div className="mt-3 space-y-2 text-sm text-amber-900">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-white/70 px-3 py-2">
                <span>{businessProfileComplete ? "✓ Business profile completed" : "• Business profile completed"}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-white/70 px-3 py-2">
                <span>{upiConfigured ? "✓ UPI QR configured" : "• UPI QR configured"}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-white/70 px-3 py-2">
                <span>{backupConfigured ? "✓ Backup file created" : "• Backup file created"}</span>
              </div>
            </div>
          </section>
        )}

        {loading ? <p className="mt-8 font-bold">Loading local invoices...</p> : <>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              aria-label={amountsHidden ? dictionary.showAmounts : dictionary.hideAmounts}
              title={amountsHidden ? dictionary.showAmounts : dictionary.hideAmounts}
              onClick={async () => {
                const next = !amountsHidden;
                setAmountsHidden(next);
                await writeAppMetadata("dashboard_amounts_hidden", next);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm"
            >
              <span aria-hidden="true">👁</span>
              {amountsHidden ? dictionary.showAmounts : dictionary.hideAmounts}
            </button>
          </div>

          <section className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-xl">₹</div><p className="mt-6 text-sm font-medium text-slate-500">Money expected</p><p className="mt-1 text-3xl font-black tracking-tight">{amountsHidden ? "₹- - - - -" : currency(unpaid)}</p><p className="mt-1 text-xs text-slate-500">Across {invoices.filter((invoice) => invoice.status !== "paid").length} unpaid invoices</p></div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-xl">◷</div><p className="mt-6 text-sm font-medium text-slate-500">Total invoices</p><p className="mt-1 text-3xl font-black tracking-tight">{invoices.length}</p><p className="mt-1 text-xs text-slate-500">Saved on this device</p></div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-xl">✓</div><p className="mt-6 text-sm font-medium text-slate-500">Collected</p><p className="mt-1 text-3xl font-black tracking-tight">{amountsHidden ? "₹- - - - -" : currency(paid)}</p><p className="mt-1 text-xs text-emerald-700">Paid invoices</p></div>
          </section>

          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-900">{dictionary.backupStatus}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {lastBackupAt ? `Last backup file created: ${formatBackupDate(lastBackupAt)}` : "Backup not created yet"}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={backupState === "preparing"}
              onClick={() => { void handleBackupNow(); }}
              className="mt-4 inline-flex min-h-12 items-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {backupState === "preparing"
                ? "Preparing backup file…"
                : backupState === "success"
                  ? "Backup file created"
                  : backupState === "error"
                    ? "Could not create backup file"
                    : "Create Backup File"}
            </button>

            {backupMessage && (
              <p className="mt-3 text-sm font-medium text-slate-600">{backupMessage}</p>
            )}
          </section>

          <section className="mt-8"><div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Your workspace</p><h2 className="mt-1 text-2xl font-black tracking-tight">Recent invoices</h2></div>
            {invoices.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">₹</div><h3 className="mt-4 text-lg font-black">No invoices yet</h3><p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">Create your first invoice and it will stay on this device.</p><Link href="/invoices/new" className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">Create first invoice</Link></div> : <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">{invoices.slice(0, 10).map((invoice, index) => {
              const canQuickMarkPaid = isQuickMarkPaidEligible(invoice);
              const isSavingThisInvoice = savingInvoiceId === invoice.id;

              return (
                <div key={invoice.id} className={`flex flex-col gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between ${index < Math.min(invoices.length, 10) - 1 ? "border-b border-slate-100" : ""}`}>
                  <Link href={`/invoices/${invoice.id}`} className="flex flex-1 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-sm font-black text-blue-700">{initials(invoice.customerName)}</div>
                    <div>
                      <p className="font-bold">{invoice.customerName}</p>
                      <p className="mt-1 text-sm text-slate-500">{invoice.description}</p>
                      <p className="mt-1 text-xs text-slate-400">{invoice.invoiceNumber}</p>
                    </div>
                  </Link>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="font-black">{currency(invoice.total)}</p>
                      <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold capitalize text-amber-700">{invoice.status}</span>
                      <span className="mt-1 block text-xs text-slate-400">Local only</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {canQuickMarkPaid && (
                        <button
                          type="button"
                          onClick={() => setQuickPayInvoiceId(invoice.id)}
                          disabled={savingInvoiceId !== null}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSavingThisInvoice ? "Recording payment…" : "✓ Mark paid"}
                        </button>
                      )}

                      <Link href={`/invoices/${invoice.id}`} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500">→</Link>
                    </div>
                  </div>
                </div>
              );
            })}</div>}
          </section>
        </>}
      </div>

      {quickPayInvoice && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Record payment</p>
                <h2 className="mt-2 text-2xl font-black">Record payment</h2>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 p-3">
                <span className="font-semibold text-slate-500">Customer</span>
                <span className="text-right font-bold text-slate-900">{getCustomerLabel(quickPayInvoice)}</span>
              </div>

              <div className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 p-3">
                <span className="font-semibold text-slate-500">Work</span>
                <span className="max-w-[60%] text-right font-bold text-slate-900">{getWorkSummary(quickPayInvoice)}</span>
              </div>

              <div className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 p-3">
                <span className="font-semibold text-slate-500">Invoice</span>
                <span className="text-right font-bold text-slate-900">{quickPayInvoice.invoiceNumber}</span>
              </div>

              <div className="flex items-start justify-between gap-4 rounded-2xl bg-emerald-50 p-3">
                <span className="font-semibold text-emerald-700">Outstanding</span>
                <span className="text-right font-black text-emerald-700">{currency(quickPayInvoice.outstandingAmount)}</span>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-bold text-slate-700">How did you receive payment?</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {(["upi", "cash"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    disabled={savingInvoiceId !== null}
                    onClick={() => setQuickPayMethod(method)}
                    className={`rounded-xl border px-3 py-3 text-sm font-bold ${
                      quickPayMethod === method
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-700"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {method === "upi" ? "📲 UPI" : "💵 Cash"}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-600">This records the full outstanding amount as a manually received {quickPayMethod === "cash" ? "cash" : "UPI"} payment.</p>

            {quickPayError && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {quickPayError}
              </p>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setQuickPayInvoiceId(null);
                  setQuickPayError("");
                }}
                disabled={savingInvoiceId !== null}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => { void handleQuickPay(); }}
                disabled={savingInvoiceId !== null}
                className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingInvoiceId === quickPayInvoice.id
                  ? "Recording payment…"
                  : `Record ${currency(quickPayInvoice.outstandingAmount)} as paid`}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setQuickPayInvoiceId(null);
                router.push(`/invoices/${quickPayInvoice.id}`);
              }}
              className="mt-4 block w-full text-center text-sm font-bold text-slate-600 underline underline-offset-4"
            >
              View full invoice
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed right-4 top-4 z-[60] w-full max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-lg shadow-emerald-900/10">
          <p className="font-black text-emerald-800">{toast.title}</p>
          {toast.detail && <p className="mt-1 text-sm text-emerald-700">{toast.detail}</p>}
        </div>
      )}
    </main>
  );
}
