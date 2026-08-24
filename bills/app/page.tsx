import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import LocalDashboard from "@/components/LocalDashboard";

export const dynamic = "force-dynamic";

type Invoice = {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_phone: string | null;
  description: string;
  quantity: number;
  price: number;
  gst_rate: number;
  subtotal: number;
  gst_amount: number;
  total: number;
  due_days: number;
  status: string;
  created_at: string;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getStatusStyle(status: string) {
  if (status === "paid") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "overdue") {
    return "bg-red-100 text-red-700";
  }

  return "bg-amber-100 text-amber-700";
}

function getStatusLabel(status: string) {
  if (status === "paid") {
    return "Paid";
  }

  if (status === "overdue") {
    return "Overdue";
  }

  return "Approved";
}

export default async function Home() {
  if (!isSupabaseConfigured()) {
    return <LocalDashboard />;
  }

  const supabase = await createClient();

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 text-slate-950">
        <div className="mx-auto max-w-2xl rounded-3xl border border-red-200 bg-red-50 p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-700">Database unavailable</p>
          <h1 className="mt-2 text-3xl font-black">We could not reach your invoice database.</h1>
          <p className="mt-3 text-red-900">Please check your Supabase connection and try again.</p>
        </div>
      </main>
    );
  }

  const savedInvoices = (invoices || []) as Invoice[];

  const unpaidInvoices = savedInvoices.filter(
    (invoice) => invoice.status !== "paid"
  );

  const paidInvoices = savedInvoices.filter(
    (invoice) => invoice.status === "paid"
  );

  const unpaidAmount = unpaidInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.total),
    0
  );

  const paidAmount = paidInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.total),
    0
  );

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto min-h-screen max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white shadow-lg shadow-slate-950/20">
              B
            </div>

            <div>
              <p className="text-sm font-black tracking-[0.2em]">BILLS</p>
              <p className="text-xs text-slate-500">Invoice less. Earn more.</p>
            </div>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold shadow-sm">
            <Link href="/settings" aria-label="Business settings">MK</Link>
          </div>
        </nav>

        <section className="relative mt-5 overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-2xl shadow-slate-900/20 sm:px-10 sm:py-12">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Your money desk is ready
            </div>

            <h1 className="max-w-xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
              Turn messy work
              <span className="block text-blue-400">into clean money.</span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
              Create professional invoices and keep track of every payment.
            </p>

            <Link
              href="/invoices/new"
              className="mt-8 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-blue-500 px-6 py-4 text-base font-bold text-white shadow-xl shadow-blue-500/25 transition hover:bg-blue-400 sm:w-auto"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xl">
                +
              </span>
              Create invoice
              <span className="text-blue-200">→</span>
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-xl">
              ₹
            </div>

            <p className="mt-6 text-sm font-medium text-slate-500">
              Money expected
            </p>

            <p className="mt-1 text-3xl font-black tracking-tight">
              {formatCurrency(unpaidAmount)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Across {unpaidInvoices.length} unpaid invoice
              {unpaidInvoices.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-xl">
              ◷
            </div>

            <p className="mt-6 text-sm font-medium text-slate-500">
              Total invoices
            </p>

            <p className="mt-1 text-3xl font-black tracking-tight">
              {savedInvoices.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Saved in your workspace
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-xl">
              ✓
            </div>

            <p className="mt-6 text-sm font-medium text-slate-500">Collected</p>

            <p className="mt-1 text-3xl font-black tracking-tight">
              {formatCurrency(paidAmount)}
            </p>

            <p className="mt-1 text-xs text-emerald-700">Paid invoices</p>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Your workspace
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight">
                Recent invoices
              </h2>
            </div>
          </div>

          {savedInvoices.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                ₹
              </div>

              <h3 className="mt-4 text-lg font-black">No invoices yet</h3>

              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                Create your first invoice and it will appear here automatically.
              </p>

              <Link
                href="/invoices/new"
                className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
              >
                Create first invoice
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              {savedInvoices.slice(0, 10).map((invoice, index) => (
                <div
                  key={invoice.id}
                  className={`flex flex-col gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between ${
                    index !== Math.min(savedInvoices.length, 10) - 1
                      ? "border-b border-slate-100"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-sm font-black text-blue-700">
                      {getInitials(invoice.customer_name)}
                    </div>

                    <div>
                      <p className="font-bold">{invoice.customer_name}</p>

                      <p className="mt-1 text-sm text-slate-500">
                        {invoice.description}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {invoice.invoice_number} ·{" "}
                        {formatDate(invoice.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-5 sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="font-black">
                        {formatCurrency(Number(invoice.total))}
                      </p>

                      <span
                        className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getStatusStyle(
                          invoice.status
                        )}`}
                      >
                        {getStatusLabel(invoice.status)}
                      </span>
                    </div>

                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-slate-950 hover:text-slate-950"
                    >
                      →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-6 mt-8 flex flex-col gap-4 rounded-3xl border border-blue-100 bg-blue-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-blue-950">
              Small habit, faster payment.
            </p>

            <p className="mt-1 text-sm text-blue-800">
              Send your invoice on the same day the work is completed.
            </p>
          </div>

          <div className="shrink-0 rounded-2xl bg-white px-4 py-3 text-center shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Saved invoices
            </p>

            <p className="mt-1 text-sm font-black text-blue-700">
              {savedInvoices.length}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}