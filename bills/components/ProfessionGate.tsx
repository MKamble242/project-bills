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
  const heading = language === "hi" ? "आप किस तरह का हिसाब रखना चाहते हैं?" : "How do you want to keep your records?";

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 text-slate-950 sm:flex sm:items-center sm:justify-center">
      <section className="mx-auto w-full max-w-xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Project BILLS</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{heading}</h1>
        <p className="mt-3 text-slate-600">Choose the work type that best matches your records.</p>
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

export default function ProfessionGate({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<DiaryProfile | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProfileState(readDiaryProfile());
      setChecked(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function setProfile(nextProfile: DiaryProfile) {
    setProfileState(writeDiaryProfile(nextProfile));
  }

  if (!checked) return <main className="min-h-screen bg-[#f5f7fb]" />;

  return (
    <ProfessionContext.Provider value={{ profile, setProfile }}>
      {profile ? children : <ProfessionSelection onSelected={setProfile} />}
    </ProfessionContext.Provider>
  );
}

export { generalDiaryProfile };
