import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DownloadInvoiceButton from "@/components/DownloadInvoiceButton";
import WhatsAppShareButton from "@/components/WhatsAppShareButton";
import InvoiceStatusButton from "@/components/InvoiceStatusButton";
import PrintInvoiceButton from "@/components/PrintInvoiceButton";
import LocalInvoiceDetails from "@/components/LocalInvoiceDetails";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import InvoicePaymentPanel from "@/components/InvoicePaymentPanel";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function InvoiceDetailsPage({ params }: Props) {
  const { id } = await params;
  if (!isSupabaseConfigured() && id.startsWith("local_")) {
    return <LocalInvoiceDetails id={id} />;
  }

  const supabase = await createClient();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !invoice) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 text-slate-950">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="text-sm font-bold text-slate-500 hover:text-slate-950"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              Invoice details
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-tight">
              {invoice.invoice_number}
            </h1>
          </div>

          <span className="rounded-full bg-amber-100 px-3 py-2 text-xs font-bold text-amber-700">
            {invoice.status}
          </span>
        </div>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Customer
              </p>

              <p className="mt-2 text-lg font-black">
                {invoice.customer_name}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {invoice.customer_phone || "No phone number"}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Payment terms
              </p>

              <p className="mt-2 font-bold">
                {invoice.due_days === 0
                  ? "Due immediately"
                  : `Due within ${invoice.due_days} days`}
              </p>
            </div>
          </div>

          <div className="my-8 border-t border-slate-200" />

          <div className="rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between bg-slate-50 p-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Description</span>
              <span>Amount</span>
            </div>

            <div className="flex items-start justify-between gap-4 p-4">
              <div>
                <p className="font-bold">{invoice.description}</p>

                <p className="mt-1 text-sm text-slate-500">
                  {invoice.quantity} ×{" "}
                  {formatCurrency(Number(invoice.price))}
                </p>
              </div>

              <p className="font-black">
                {formatCurrency(Number(invoice.subtotal))}
              </p>
            </div>
          </div>

          <div className="ml-auto mt-6 max-w-xs space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold">
                {formatCurrency(Number(invoice.subtotal))}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-500">
                GST ({invoice.gst_rate}%)
              </span>
              <span className="font-semibold">
                {formatCurrency(Number(invoice.gst_amount))}
              </span>
            </div>

            <div className="border-t border-slate-200 pt-3">
              <div className="flex justify-between">
                <span className="font-bold">Total</span>
                <span className="text-2xl font-black">
                  {formatCurrency(Number(invoice.total))}
                </span>
              </div>
            </div>
          </div>
        </section>

        <InvoicePaymentPanel
          invoiceNumber={invoice.invoice_number}
          total={Number(invoice.total)}
          outstandingAmount={Number(invoice.total)}
          dueDays={invoice.due_days}
        />

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <DownloadInvoiceButton invoice={invoice} />

          <WhatsAppShareButton
            phone={invoice.customer_phone}
            customerName={invoice.customer_name}
            invoiceNumber={invoice.invoice_number}
            description={invoice.description}
            total={Number(invoice.total)}
            outstandingAmount={Number(invoice.total)}
            dueDays={invoice.due_days}
            businessName="Your Business Name"
          />

          <InvoiceStatusButton
            invoiceId={id}
            status={invoice.status}
            amount={Number(invoice.total)}
          />
          <PrintInvoiceButton />
        </div>
      </div>
    </main>
  );
}