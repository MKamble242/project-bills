"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAppLanguage } from "@/components/AppLanguageProvider";
import { languageOptions, setStoredAppLanguage } from "@/lib/i18n";
import { useProfession } from "@/components/ProfessionGate";
import { professionOptions } from "@/lib/profession";
import { defaultBusinessSettings, readBusinessSettings, writeBusinessSettings, type BusinessSettings } from "@/lib/business-settings";

export default function SettingsPage() {
  const { language, dictionary, setLanguage } = useAppLanguage();
  const { profile, setProfile } = useProfession();
  const [settings, setSettings] = useState<BusinessSettings>(() => readBusinessSettings());
  const [message, setMessage] = useState("");
  const [storageStatus, setStorageStatus] = useState("Checking...");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!navigator.storage?.persisted) { setStorageStatus("Not supported in this browser"); return; }
      void navigator.storage.persisted().then((persisted) => setStorageStatus(persisted ? "Protected" : "Not protected"));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function save() {
    const next = { ...settings, businessName: settings.businessName.trim() || defaultBusinessSettings.businessName, phoneNumber: settings.phoneNumber.trim() };
    writeBusinessSettings(next);
    setSettings(next);
    setMessage("Settings saved on this device.");
  }

  async function protectStorage() {
    if (!navigator.storage?.persist) { setStorageStatus("Not supported in this browser"); return; }
    setStorageStatus((await navigator.storage.persist()) ? "Protected" : "Not protected");
  }

  return <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 text-slate-950"><div className="mx-auto max-w-xl"><Link href="/" className="text-sm font-bold text-slate-500">← {dictionary.backDashboard}</Link><h1 className="mt-8 text-4xl font-black">Diary settings</h1><p className="mt-2 text-slate-600">Your diaries and entries stay on this device.</p><section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Choose your diary</h2><p className="mt-2 text-sm text-slate-600">Current setup: <strong>{profile?.professionName}</strong></p><div className="mt-4 space-y-3">{professionOptions.map((option) => <button key={option.professionGroup} type="button" onClick={() => setProfile(option)} className={`flex min-h-[52px] w-full items-center justify-between rounded-2xl border px-4 py-3 text-left ${profile?.professionGroup === option.professionGroup ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700"}`}><span className="font-bold">{option.professionName}</span>{profile?.professionGroup === option.professionGroup && <span aria-hidden="true">✓</span>}</button>)}</div><Link href="/expenses" className="mt-4 block text-sm font-bold text-blue-700">Open Mere Kharche</Link></section><section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-black">{dictionary.appLanguage}</h2><div className="mt-4 space-y-3">{languageOptions.map((option) => <label key={option.value} className="flex min-h-[52px] cursor-pointer items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"><span className="flex items-center gap-3"><input type="radio" name="app-language" checked={language === option.value} onChange={() => { setLanguage(option.value); setStoredAppLanguage(option.value); }} className="accent-blue-600" /><span className="font-bold">{option.label}</span></span>{language === option.value && <span aria-hidden="true">✓</span>}</label>)}</div></section><section className="mt-8 space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Diary details</h2><label className="block text-sm font-bold">{dictionary.businessName}<input value={settings.businessName} onChange={(event) => setSettings({ ...settings, businessName: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label><label className="block text-sm font-bold">{dictionary.phoneNumber}<input value={settings.phoneNumber} onChange={(event) => setSettings({ ...settings, phoneNumber: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label><button type="button" onClick={save} className="min-h-12 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white">Save settings</button>{message && <p className="text-sm font-semibold text-slate-600">{message}</p>}</section><section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Protect your entries</h2><p className="mt-2 text-sm text-slate-600">Keep browser storage active so Diary can retain local entries.</p><div className="mt-4 flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4"><span className="text-sm font-bold">{storageStatus}</span><button type="button" onClick={() => void protectStorage()} className="min-h-12 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white">Protect storage</button></div></section><section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Diary feedback</h2><Link href="/feedback" className="mt-4 inline-flex min-h-12 items-center rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white">Send feedback</Link></section></div></main>;
}
