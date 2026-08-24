"use client";

import dynamic from "next/dynamic";

const PDFDownloadLink = dynamic(
  () =>
    import("@react-pdf/renderer").then(
      (module) => module.PDFDownloadLink
    ),
  {
    ssr: false,
    loading: () => (
      <button
        disabled
        className="min-h-14 w-full rounded-2xl bg-slate-300 px-5 py-4 font-black text-slate-500"
      >
        Preparing PDF...
      </button>
    ),
  }
);

import InvoicePDF from "./InvoicePDF";

type DownloadInvoiceButtonProps = {
  invoice: {
    invoice_number: string;
    customer_name: string;
    customer_phone: string | null;
    description: string;
    quantity: number | string;
    price: number | string;
    gst_rate: number | string;
    subtotal: number | string;
    gst_amount: number | string;
    total: number | string;
    due_days: number;
    created_at: string;
    items?: Array<{ description: string; quantity: number; unitPrice: number }>;
    document_type?: "simple_bill" | "tax_invoice";
    advance_received?: number;
    outstanding_amount?: number;
  };
};

export default function DownloadInvoiceButton({
  invoice,
}: DownloadInvoiceButtonProps) {
  return (
    <PDFDownloadLink
      document={<InvoicePDF invoice={invoice} />}
      fileName={`${invoice.invoice_number}.pdf`}
      className="block"
    >
      {({ loading, error }) => {
        if (error) {
          return (
            <button
              disabled
              className="min-h-14 w-full rounded-2xl bg-red-100 px-5 py-4 font-black text-red-700"
            >
              PDF error
            </button>
          );
        }

        return (
          <button
            type="button"
            disabled={loading}
            className="min-h-14 w-full rounded-2xl bg-blue-600 px-5 py-4 font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? "Preparing PDF..." : "Download PDF"}
          </button>
        );
      }}
    </PDFDownloadLink>
  );
}