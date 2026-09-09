"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAppLanguage } from "@/components/AppLanguageProvider";
import {
  generalDiaryProfile,
  professionOptions,
  readDiaryProfile,
  writeDiaryProfile,
  type DiaryProfile,
} from "@/lib/profession";

type ProfessionContextValue = {
  profile: DiaryProfile | null;
  setProfile: (profile: DiaryProfile) => void;
};

const ProfessionContext = createContext<ProfessionContextValue | null>(null);

export function useProfession() {
  const context = useContext(ProfessionContext);
  if (!context) throw new Error("useProfession must be used inside ProfessionGate");
  return context;
}

function ProfessionSelection({ onSelected }: { onSelected: (profile: DiaryProfile) => void }) {
  const { language } = useAppLanguage();
  const heading = language === "hi" ? "आप किस तरह की डायरी रखना चाहते हैं?" : "Which diary do you want to keep?";

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 text-slate-950 sm:flex sm:items-center sm:justify-center">
      <section className="mx-auto w-full max-w-xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Diary</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{heading}</h1>
        <p className="mt-3 text-slate-600">Choose the diary that best matches what you record.</p>
        <div className="mt-6 space-y-3">
          {professionOptions.map((option) => (
            <button
              key={option.professionGroup}
              type="button"
              onClick={() => onSelected(option)}
              className="flex min-h-[68px] w-full flex-col items-start justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-left shadow-sm transition hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              <span className="text-base font-black">{option.professionName}</span>
              <span className="mt-1 text-sm text-slate-500">{option.explanation}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function QuickStart({ onClose }: { onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><section role="dialog" aria-modal="true" aria-labelledby="diary-quick-start" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Welcome to Diary</p><h2 id="diary-quick-start" className="mt-2 text-2xl font-black">Start in three simple steps</h2><p className="mt-2 text-sm text-slate-600">Diary keeps your records on this device. Download a backup from Settings before changing phones or clearing browser data.</p><ol className="mt-5 space-y-3 text-sm"><li className="rounded-xl bg-slate-50 p-3"><strong>1. Select your diary</strong><span className="mt-1 block text-slate-600">Choose the dashboard that fits you.</span></li><li className="rounded-xl bg-slate-50 p-3"><strong>2. Add your first record</strong><span className="mt-1 block text-slate-600">Record a sale, job, student fee, or personal expense.</span></li><li className="rounded-xl bg-slate-50 p-3"><strong>3. Come back tomorrow</strong><span className="mt-1 block text-slate-600">Your saved records will be waiting on this device.</span></li></ol><div className="mt-5 grid grid-cols-2 gap-3"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">Skip for now</button><button type="button" onClick={onClose} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">Start using Diary</button></div></section></div>;
}

export default function ProfessionGate({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<DiaryProfile | null>(null);
  const [checked, setChecked] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProfileState(readDiaryProfile());
      setShowQuickStart(readDiaryProfile() !== null && window.localStorage.getItem("diary.quick-start-seen.v1") !== "yes");
      setChecked(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function setProfile(nextProfile: DiaryProfile) {
    setProfileState(writeDiaryProfile(nextProfile));
    setShowQuickStart(true);
  }

  function closeQuickStart() {
    window.localStorage.setItem("diary.quick-start-seen.v1", "yes");
    setShowQuickStart(false);
  }

  if (!checked) return <main className="min-h-screen bg-[#f5f7fb]" />;

  return (
    <ProfessionContext.Provider value={{ profile, setProfile }}>
      {profile ? <>{children}{showQuickStart && <QuickStart onClose={closeQuickStart} />}</> : <ProfessionSelection onSelected={setProfile} />}
    </ProfessionContext.Provider>
  );
}

export { generalDiaryProfile };
