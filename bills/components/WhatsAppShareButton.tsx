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
  paidAmount?: number;
  invoiceDate?: string;
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

export default function WhatsAppShareButton({
  phone,
  customerName,
  invoiceNumber,
  items,
  description,
  total,
  businessName = "",
  outstandingAmount = total,
  advanceReceived = 0,
  paidAmount,
  invoiceDate,
  documentType = "simple_bill",
}: WhatsAppShareButtonProps) {
  async function shareOnWhatsApp() {
    const settings = readBusinessSettings();
    const storedLanguage = await readAppMetadata("whatsapp_message_language");
    const language: WhatsAppMessageLanguage = storedLanguage === "simple_hindi" || storedLanguage === "simple_marathi" || storedLanguage === "hinglish" ? storedLanguage : "simple_english";
    const candidateBusinessName = settings.businessName.trim() || businessName.trim();
    const resolvedBusinessName = ["your business name", "your store name", "business name here"].includes(candidateBusinessName.toLowerCase()) ? "" : candidateBusinessName;
    const normalizedPhone = normalizeIndianPhone(phone);
    const activeAmount = Number.isFinite(outstandingAmount) ? Math.max(0, outstandingAmount) : Math.max(0, total);
    const advanceAmount = Number.isFinite(advanceReceived) ? advanceReceived : 0;
    const totalPaid = Number.isFinite(paidAmount) ? Math.max(0, paidAmount as number) : Math.max(0, advanceAmount);
    const upiId = settings.upiId?.trim() || "";
    const dateText = invoiceDate ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(invoiceDate)) : new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date());

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

    const paymentDetails = upiId && activeAmount > 0
      ? {
          simple_english: `\n\nYou can pay using any UPI app.\nUPI ID: \`${upiId}\`\nAfter payment, please share the payment screenshot.`,
          simple_hindi: `\n\nआप किसी भी UPI ऐप से भुगतान कर सकते हैं।\nUPI ID: \`${upiId}\`\nभुगतान के बाद कृपया स्क्रीनशॉट भेज दें।`,
          simple_marathi: `\n\nआपण कोणत्याही UPI अॅपमधून पेमेंट करू शकता।\nUPI ID: \`${upiId}\`\nपेमेंटनंतर कृपया स्क्रीनशॉट पाठवा.`,
          hinglish: `\n\nYou can pay using any UPI app.\nUPI ID: \`${upiId}\`\nAfter payment, please share the payment screenshot.`,
        }
      : { simple_english: "", simple_hindi: "", simple_marathi: "", hinglish: "" };
    const businessFooter = resolvedBusinessName
      ? {
          simple_english: `\n\nThank you,\n*${resolvedBusinessName}*`,
          simple_hindi: `\n\nधन्यवाद,\n*${resolvedBusinessName}*`,
          simple_marathi: `\n\nधन्यवाद,\n*${resolvedBusinessName}*`,
          hinglish: `\n\nThank you,\n*${resolvedBusinessName}*`,
        }
      : { simple_english: "", simple_hindi: "", simple_marathi: "", hinglish: "" };
    const commonEnglish = `${documentType === "tax_invoice" ? "TAX INVOICE" : "BILL"}: *${invoiceNumber}*\nDate: ${dateText}\n\nDear *${customerName || "Customer"}*,\n\nItems:\n${itemBreakdown}\n\nTotal: *${formatAmount(total)}*\n${advanceAmount > 0 ? `Advance received: *${formatAmount(advanceAmount)}*\n` : ""}Amount paid: *${formatAmount(totalPaid)}*\nBalance due: *${formatAmount(activeAmount)}*${paymentDetails.simple_english}${businessFooter.simple_english}`;
    const commonHindi = `${documentType === "tax_invoice" ? "टैक्स इनवॉइस" : "बिल"}: *${invoiceNumber}*\nदिनांक: ${dateText}\n\nप्रिय *${customerName || "ग्राहक"}*,\n\nविवरण:\n${itemBreakdown}\n\nकुल: *${formatAmount(total)}*\n${advanceAmount > 0 ? `एडवांस प्राप्त: *${formatAmount(advanceAmount)}*\n` : ""}भुगतान प्राप्त: *${formatAmount(totalPaid)}*\nबकाया राशि: *${formatAmount(activeAmount)}*${paymentDetails.simple_hindi}${businessFooter.simple_hindi}`;
    const commonMarathi = `${documentType === "tax_invoice" ? "कर बिल" : "बिल"}: *${invoiceNumber}*\nदिनांक: ${dateText}\n\nप्रिय *${customerName || "ग्राहक"}*,\n\nतपशील:\n${itemBreakdown}\n\nएकूण: *${formatAmount(total)}*\n${advanceAmount > 0 ? `आगाऊ मिळाले: *${formatAmount(advanceAmount)}*\n` : ""}मिळालेले पेमेंट: *${formatAmount(totalPaid)}*\nदेय बाकी: *${formatAmount(activeAmount)}*${paymentDetails.simple_marathi}${businessFooter.simple_marathi}`;
    const message = language === "simple_hindi" ? commonHindi : language === "simple_marathi" ? commonMarathi : commonEnglish;

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