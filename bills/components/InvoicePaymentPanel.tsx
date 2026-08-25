"use client";

import QRCode from "qrcode";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  defaultBusinessSettings,
  readBusinessSettings,
  writeBusinessSettings,
  type BusinessSettings,
} from "@/lib/business-settings";
import { useAppLanguage } from "@/components/AppLanguageProvider";

type Props = {
  invoiceNumber: string;
  total: number;
  outstandingAmount?: number;
  dueDays: number;
};

function paymentTerms(dueDays: number) {
  return dueDays === 0 ? "Due immediately" : `Within ${dueDays} days`;
}

export default function InvoicePaymentPanel({ invoiceNumber, total, outstandingAmount = total, dueDays }: Props) {
  const { dictionary } = useAppLanguage();
  const [settings, setSettings] = useState<BusinessSettings>(() => readBusinessSettings());
  const [editing, setEditing] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [draft, setDraft] = useState<BusinessSettings>(() => readBusinessSettings());

  const amount = outstandingAmount.toFixed(2);
  const payload = settings.upiId && outstandingAmount > 0
    ? `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.businessName)}&am=${amount}&cu=INR&tn=Bill_${encodeURIComponent(invoiceNumber)}`
    : "";

  useEffect(() => {
    if (!payload) return;
    void QRCode.toDataURL(payload, { width: 220, margin: 2, errorCorrectionLevel: "M" }).then(setQrCode).catch(() => setQrCode(""));
  }, [payload]);

  function saveSettings() {
    const next = {
      businessName: draft.businessName.trim() || defaultBusinessSettings.businessName,
      upiId: draft.upiId.trim(),
      phoneNumber: draft.phoneNumber.trim(),
      gstin: draft.gstin.trim(),
    };
    writeBusinessSettings(next);
    setSettings(next);
    setDraft(next);
    setEditing(false);
  }

  return (
    <section className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-5 print:hidden">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">{dictionary.paymentDetails}</p><h2 className="mt-1 text-xl font-black">{dictionary.payByUpi}</h2></div><button type="button" onClick={() => setEditing((value) => !value)} className="text-sm font-bold text-blue-700 underline">{editing ? dictionary.close : dictionary.editSettings}</button></div>
      {editing && <div className="mt-4 space-y-3 rounded-2xl bg-white p-4"><input aria-label="Business name" value={draft.businessName} onChange={(event) => setDraft({ ...draft, businessName: event.target.value })} placeholder="Business name" className="w-full rounded-xl border border-slate-200 px-3 py-2" /><input aria-label="UPI ID" value={draft.upiId} onChange={(event) => setDraft({ ...draft, upiId: event.target.value })} placeholder="merchant@upi" className="w-full rounded-xl border border-slate-200 px-3 py-2" /><input aria-label="Business phone" value={draft.phoneNumber} onChange={(event) => setDraft({ ...draft, phoneNumber: event.target.value })} placeholder="Phone number" className="w-full rounded-xl border border-slate-200 px-3 py-2" /><button type="button" onClick={saveSettings} className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white">Save settings</button></div>}
      <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row sm:items-start">{payload && qrCode ? <Image src={qrCode} alt="UPI payment QR code" width={220} height={220} unoptimized className="rounded-xl bg-white p-2" /> : <div className="flex h-[220px] w-[220px] items-center justify-center rounded-xl bg-white p-5 text-center text-sm font-semibold text-slate-500">{settings.upiId ? `${dictionary.outstanding} is zero.` : "Add your UPI ID to show a payment QR code."}</div>}<div className="text-sm text-slate-700"><p className="font-bold">{settings.businessName}</p><p className="mt-1">UPI ID: {settings.upiId || dictionary.notConfigured}</p>{payload && <a href={payload} className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-3 font-bold text-white">{dictionary.tapToPay}</a>}<p className="mt-3 text-xs text-slate-600">{settings.upiId ? dictionary.scanWithUpi : dictionary.useEditSettings}</p><p className="mt-3 text-xs text-slate-500">{dictionary.terms}: {paymentTerms(dueDays)}</p></div></div>
    </section>
  );
}
