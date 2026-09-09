export type AppLanguage = "en" | "hi" | "mr";
export type AppDictionaryKey = "appLanguage" | "backDashboard" | "businessName" | "phoneNumber";
export type AppDictionary = Record<AppDictionaryKey, string>;

export const languageOptions: Array<{ value: AppLanguage; label: string }> = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिंदी" },
  { value: "mr", label: "मराठी" },
];

export const dictionaries: Record<AppLanguage, AppDictionary> = {
  en: { appLanguage: "App language", backDashboard: "Back to dashboard", businessName: "Name", phoneNumber: "Phone number" },
  hi: { appLanguage: "ऐप भाषा", backDashboard: "डैशबोर्ड पर वापस", businessName: "नाम", phoneNumber: "फोन नंबर" },
  mr: { appLanguage: "अॅप भाषा", backDashboard: "डॅशबोर्डवर परत", businessName: "नाव", phoneNumber: "फोन नंबर" },
};

export const appLanguageStorageKey = "project-bills.app-language.v1";

export function getBrowserLanguage(): AppLanguage {
  if (typeof navigator === "undefined") return "en";
  const language = navigator.language.toLowerCase();
  return language.startsWith("mr") ? "mr" : language.startsWith("hi") ? "hi" : "en";
}

export function getInitialAppLanguage(): AppLanguage {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(appLanguageStorageKey);
  return stored === "hi" || stored === "mr" || stored === "en" ? stored : getBrowserLanguage();
}

export function setStoredAppLanguage(language: AppLanguage) {
  if (typeof window !== "undefined") window.localStorage.setItem(appLanguageStorageKey, language);
}

export function getDictionary(language: AppLanguage): AppDictionary {
  return dictionaries[language];
}
