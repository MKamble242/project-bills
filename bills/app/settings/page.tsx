"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAppLanguage } from "@/components/AppLanguageProvider";
import {
  defaultBusinessSettings,
  readBusinessSettings,
  writeBusinessSettings,
  type BusinessSettings,
} from "@/lib/business-settings";
import { languageOptions, setStoredAppLanguage } from "@/lib/i18n";
import { downloadText, invoiceCsv } from "@/lib/invoices/backup";
import {
  createLocalBackup,
  importLocalBackup,
  validateLocalBackup,
  type LocalBackup,
} from "@/lib/invoices/local-repository";
import { readAppMetadata, writeAppMetadata } from "@/lib/invoices/local-repository";
import type { WhatsAppMessageLanguage } from "@/types/invoice";
import { useProfession } from "@/components/ProfessionGate";
import { professionOptions } from "@/lib/profession";

type Preview = { backup: LocalBackup; invalidRecords: number };

export default function SettingsPage() {
  const { language, dictionary, setLanguage } = useAppLanguage();
  const { profile, setProfile } = useProfession();
  const [settings, setSettings] = useState<BusinessSettings>(() => readBusinessSettings());
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [storageStatus, setStorageStatus] = useState<"checking" | "enabled" | "unsupported" | "failed">("checking");
  const [messageLanguage, setMessageLanguage] = useState<WhatsAppMessageLanguage>("simple_english");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.storage || !navigator.storage.persist) {
      const timer = window.setTimeout(() => setStorageStatus("unsupported"), 0);
      return () => window.clearTimeout(timer);
    }

    void navigator.storage
      .persisted()
      .then((persisted) => {
        setStorageStatus(persisted ? "enabled" : "failed");
      })
      .catch(() => setStorageStatus("failed"));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setStoredAppLanguage(language);
  }, [language]);

  useEffect(() => {
    void readAppMetadata("whatsapp_message_language").then((value) => {
      const normalizedLanguage = value === "hinglish"
        ? "simple_english"
        : value === "simple_english" || value === "simple_hindi" || value === "simple_marathi"
          ? value
          : "simple_english";

      setMessageLanguage(normalizedLanguage);
      if (value === "hinglish") {
        void writeAppMetadata("whatsapp_message_language", "simple_english");
      }
    });
  }, []);

  function save() {
    const next = {
      ...settings,
      businessName: settings.businessName.trim() || defaultBusinessSettings.businessName,
      upiId: settings.upiId.trim(),
      phoneNumber: settings.phoneNumber.trim(),
      gstin: settings.gstin.trim().toUpperCase(),
    };

    writeBusinessSettings(next);
    setSettings(next);
    setMessage("Business settings saved on this device.");
  }

  async function exportFiles() {
    setBusy(true);
    setMessage("");

    try {
      const backup = await createLocalBackup();
      const stamp = new Date().toISOString().slice(0, 10);
      downloadText(
        `project-bills-backup-${stamp}.json`,
        JSON.stringify(backup, null, 2),
        "application/json"
      );
      downloadText(
        `project-bills-invoices-${stamp}.csv`,
        invoiceCsv(backup.invoices),
        "text/csv"
      );
      setMessage("Backup downloaded successfully.");
    } catch {
      setMessage("Could not create backup. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function inspect(file: File) {
    setMessage("");
    setPreview(null);

    if (file.type !== "application/json" && !file.name.toLowerCase().endsWith(".json")) {
      setMessage("Choose a JSON backup file.");
      return;
    }

    try {
      setPreview(validateLocalBackup(JSON.parse(await file.text())));
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Could not read backup.");
    }
  }

  async function restore(replaceProfile: boolean) {
    if (!preview) return;
    const confirmed = window.confirm(
      replaceProfile
        ? "Import this backup and replace your current business profile? Existing records with the same ID will stay unchanged."
        : "Import this backup? Existing records with the same ID will stay unchanged."
    );
    if (!confirmed) return;

    setBusy(true);

    try {
      const result = await importLocalBackup(preview.backup, { replaceProfile });
      setMessage(
        `Backup restored: ${result.imported} imported, ${result.skipped + preview.invalidRecords} skipped or invalid.`
      );
      setPreview(null);
      if (fileInput.current) fileInput.current.value = "";
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Could not restore backup.");
    } finally {
      setBusy(false);
    }
  }

  async function protectStorage() {
    if (typeof navigator === "undefined" || !navigator.storage || !navigator.storage.persist) {
      setStorageStatus("unsupported");
      return;
    }

    try {
      const protectedStorage = await navigator.storage.persist();
      setStorageStatus(protectedStorage ? "enabled" : "failed");
    } catch {
      setStorageStatus("failed");
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 text-slate-950">
      <div className="mx-auto max-w-xl">
        <Link href="/" className="text-sm font-bold text-slate-500">
          ← Back to dashboard
        </Link>

        <h1 className="mt-8 text-4xl font-black">{dictionary.appPreferences}</h1>
        <p className="mt-2 text-slate-600">{dictionary.settingsStored}</p>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Change my work type</h2>
          <p className="mt-2 text-sm text-slate-600">Current setup: <strong>{profile?.professionName}</strong></p>
          <div className="mt-4 space-y-3">
            {professionOptions.map((option) => (
              <button
                key={option.professionGroup}
                type="button"
                onClick={() => setProfile(option)}
                className={`flex min-h-[52px] w-full items-center justify-between rounded-2xl border px-4 py-3 text-left ${profile?.professionGroup === option.professionGroup ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700"}`}
              >
                <span className="font-bold">{option.professionName}</span>
                {profile?.professionGroup === option.professionGroup && <span aria-hidden="true">✓</span>}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">{dictionary.appLanguage}</h2>
          <div className="mt-4 space-y-3" role="radiogroup" aria-label={dictionary.appLanguage}>
            {languageOptions.map((option) => (
              <label
                key={option.value}
                className={`flex min-h-[52px] cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 transition ${
                  language === option.value
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="app-language"
                    checked={language === option.value}
                    onChange={() => {
                      setLanguage(option.value);
                      setStoredAppLanguage(option.value);
                    }}
                    className="h-4 w-4 accent-blue-600"
                  />
                  <div>
                    <div className="font-bold">{option.label}</div>
                    <div className="text-xs opacity-75">{option.subtitle}</div>
                  </div>
                </div>
                {language === option.value && <span aria-hidden="true">✓</span>}
              </label>
            ))}
          </div>
          <p className="mt-3 text-sm text-slate-600">{dictionary.appLanguageNote}</p>
        </section>

        <section className="mt-8 space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block text-sm font-bold">
            {dictionary.businessName}
            <input
              value={settings.businessName}
              onChange={(event) => setSettings({ ...settings, businessName: event.target.value })}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
            />
          </label>

          <label className="block text-sm font-bold">
            {dictionary.upiId}
            <input
              value={settings.upiId}
              onChange={(event) => setSettings({ ...settings, upiId: event.target.value })}
              placeholder="merchant@upi"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
            />
          </label>

          <label className="block text-sm font-bold">
            {dictionary.phoneNumber}
            <input
              value={settings.phoneNumber}
              onChange={(event) => setSettings({ ...settings, phoneNumber: event.target.value })}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
            />
          </label>

          <label className="block text-sm font-bold">
            {dictionary.gstin}
            <input
              value={settings.gstin}
              onChange={(event) => setSettings({ ...settings, gstin: event.target.value.toUpperCase() })}
              placeholder="27ABCDE1234F1Z5"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
            />
            <span className="mt-1 block text-xs font-normal text-slate-500">Used to enable Tax Invoice details.</span>
          </label>

          <button type="button" onClick={save} className="min-h-12 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white">
            {dictionary.saveSettings}
          </button>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">{dictionary.whatsAppMessageLanguage}</h2>
          <p className="mt-2 text-sm text-slate-600">Choose the language used when sharing invoice messages on WhatsApp.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {(["simple_english", "simple_hindi", "simple_marathi"] as const).map((language) => (
              <button
                key={language}
                type="button"
                onClick={() => { setMessageLanguage(language); void writeAppMetadata("whatsapp_message_language", language); }}
                className={`rounded-xl border px-4 py-3 text-sm font-bold ${messageLanguage === language ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-700"}`}
              >
                {language === "simple_english" ? "Simple English" : language === "simple_hindi" ? "Simple Hindi" : "Simple Marathi"}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">{dictionary.backupAndData}</h2>
          <p className="mt-2 text-sm text-slate-600">
            Your invoices are stored on this device. Download a backup before changing phones or clearing browser data.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void exportFiles()}
              className="min-h-12 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white"
            >
              {busy ? "Preparing backup..." : dictionary.downloadFullBackup}
            </button>

            <label className="flex min-h-12 cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700">
              <input
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void inspect(file);
                }}
              />
              {dictionary.importBackup}
            </label>
          </div>

          {preview && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-900">Backup preview</p>
              <p className="mt-2 text-sm text-slate-600">
                {preview.backup.invoices.length} invoices found. {preview.invalidRecords} records looked invalid.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button type="button" onClick={() => void restore(false)} className="min-h-12 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white">
                  Import without replacing profile
                </button>
                <button type="button" onClick={() => void restore(true)} className="min-h-12 rounded-xl bg-slate-950 px-4 py-3 font-bold text-white">
                  Replace profile and import
                </button>
              </div>
            </div>
          )}

          {message && (
            <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              {message}
            </p>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Stay safe on this browser</h2>
          <p className="mt-2 text-sm text-slate-600">
            Keep browser storage active so the app can keep your local invoices even when the tab is closed.
          </p>

          <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-sm font-bold text-slate-900">Protected storage</p>
              <p className="mt-1 text-sm text-slate-600">
                {storageStatus === "enabled"
                  ? "Enabled"
                  : storageStatus === "checking"
                    ? "Checking…"
                    : storageStatus === "unsupported"
                      ? "Not supported in this browser"
                      : storageStatus === "failed"
                        ? "Not enabled yet"
                        : "Checking…"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void protectStorage()}
              className="min-h-12 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white"
            >
              {storageStatus === "enabled" ? "Storage protected" : "Enable protection"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
