"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getDictionary,
  getInitialAppLanguage,
  type AppDictionary,
  type AppLanguage,
  setStoredAppLanguage,
} from "@/lib/i18n";

type AppLanguageContextValue = {
  language: AppLanguage;
  dictionary: AppDictionary;
  setLanguage: (language: AppLanguage) => void;
};

const AppLanguageContext = createContext<AppLanguageContextValue | null>(null);

export function AppLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => getInitialAppLanguage());

  useEffect(() => {
    setStoredAppLanguage(language);
  }, [language]);

  const value = useMemo<AppLanguageContextValue>(
    () => ({ language, dictionary: getDictionary(language), setLanguage: setLanguageState }),
    [language]
  );

  return <AppLanguageContext.Provider value={value}>{children}</AppLanguageContext.Provider>;
}

export function useAppLanguage() {
  const context = useContext(AppLanguageContext);
  if (!context) {
    return {
      language: "en" as const,
      dictionary: getDictionary("en"),
      setLanguage: () => undefined,
    };
  }
  return context;
}
