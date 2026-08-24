"use client";

import { readBusinessSettings } from "@/lib/business-settings";
import { readAppMetadata } from "@/lib/invoices/local-repository";
import type { DocumentType, InvoiceItem, WhatsAppMessageLanguage } from "@/types/invoice";

type WhatsAppShareButtonProps = {
  phone: string | null;
  customerName: string;
  invoiceNumber: string;
  items?: InvoiceItem[];
  description?: string; // Legacy fallback
  total: number;
  dueDays: number;
  businessName?: string;
  outstandingAmount?: number;
  advanceReceived?: number;
  documentType?: DocumentType;
};

export function normalizeIndianPhone(phone: string | null | undefined) {
  if (!phone) return "";

  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length > 10) return digits;
  return "";
}

function buildUpiLink(amount: number, invoiceNumber: string, businessName: string, upiId: string) {
  if (!upiId.trim()) return "";

  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(businessName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Bill_${invoiceNumber}`)}`;
}

export default function WhatsAppShareButton({
  phone,
  customerName,
  invoiceNumber,
  items,
  description,
  total,
  dueDays,
  businessName = "Your Business Name",
  outstandingAmount = total,
  advanceReceived = 0,
  documentType = "simple_bill",
}: WhatsAppShareButtonProps) {
  async function shareOnWhatsApp() {
    const settings = readBusinessSettings();
    const storedLanguage = await readAppMetadata("whatsapp_message_language");
    const language: WhatsAppMessageLanguage = storedLanguage === "hinglish" ? "hinglish" : "simple_english";
    const resolvedBusinessName = settings.businessName || businessName;
    const normalizedPhone = normalizeIndianPhone(phone);
    const activeAmount = Number.isFinite(outstandingAmount) ? outstandingAmount : total;
    const advanceAmount = Number.isFinite(advanceReceived) ? advanceReceived : 0;
    const upiId = settings.upiId?.trim() || "";
    const dueText = dueDays === 0 ? "Due immediately" : `Within ${dueDays} days`;

    // Format amounts
    const formatAmount = (amount: number) => new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

    // Build item breakdown
    const itemsToShow = items && items.length > 0 ? items : 
      (description ? [{ id: "legacy", description, quantity: 1, unitPrice: total, gstRate: 0, lineTotal: total }] : []);
    
    const itemBreakdown = itemsToShow
      .map((item) => {
        const lineTotal = (item.quantity || 1) * (item.unitPrice || 0);
        return `• ${item.description} — ${item.quantity} × ${formatAmount(item.unitPrice || 0)} = ${formatAmount(lineTotal)}`;
      })
      .join("\n");

    const paymentSection =
      activeAmount > 0 && settings.upiId?.trim()
        ? `
📲 Click to Pay via UPI:
${buildUpiLink(activeAmount, invoiceNumber, resolvedBusinessName, settings.upiId.trim())}

`
        : "";

    const englishMessage = `${documentType === "tax_invoice" ? "TAX INVOICE" : "BILL"}: *${invoiceNumber}*

Dear *${customerName || "Customer"}*,

Work details:
${itemBreakdown}

Total: *${formatAmount(total)}*
${advanceAmount > 0 ? `Advance received: *${formatAmount(advanceAmount)}*\n` : ""}Balance due: *${formatAmount(activeAmount)}*

Please verify payment through your UPI/bank app before recording it as paid.

${paymentSection}${upiId ? `UPI ID: *${upiId}*\n` : ""}${resolvedBusinessName}`;

    const hinglishMessage = `Namaste *${customerName || "Customer"} ji*,

Aapka bill *${resolvedBusinessName}* se ready hai.

📄 Bill No: *${invoiceNumber}*
🛠️ Kaam:
${itemsToShow.map((item) => `  • ${item.description}`).join("\n")}

💰 Total: *${formatAmount(total)}*
${advanceAmount > 0 ? `Advance received: *${formatAmount(advanceAmount)}*\n` : ""}Balance due: *${formatAmount(activeAmount)}*
Payment Terms: *${dueText}*
${upiId ? `UPI ID: *${upiId}*` : ""}

${activeAmount > 0 && settings.upiId?.trim() ? `📲 UPI se payment karein:
${buildUpiLink(activeAmount, invoiceNumber, resolvedBusinessName, settings.upiId.trim())}

` : ""}Payment ke baad screenshot ya UPI reference / UTR number bhej dein, taaki hum payment record kar saken.

*Dhanyavaad!*
${resolvedBusinessName}`;

    const message = language === "hinglish" ? hinglishMessage : englishMessage;

    const fallbackUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    const whatsappUrl = normalizedPhone
      ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`
      : fallbackUrl;

    const shareWindow = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    if (shareWindow) shareWindow.opener = null;
  }

  return (
    <button
      type="button"
      onClick={shareOnWhatsApp}
      className="min-h-14 w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-black text-emerald-700 transition hover:bg-emerald-100"
    >
      Open WhatsApp
    </button>
  );
}