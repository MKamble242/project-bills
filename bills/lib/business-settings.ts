export type BusinessSettings = {
  businessName: string;
  phoneNumber: string;
};

export const defaultBusinessSettings: BusinessSettings = {
  businessName: "Your name",
  phoneNumber: "",
};

const storageKey = "project-bills.diary-settings.v1";

export function readBusinessSettings(): BusinessSettings {
  if (typeof window === "undefined") return defaultBusinessSettings;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (typeof parsed !== "object" || parsed === null) return defaultBusinessSettings;
    const value = parsed as Record<string, unknown>;
    return {
      businessName: typeof value.businessName === "string" && value.businessName.trim() ? value.businessName : defaultBusinessSettings.businessName,
      phoneNumber: typeof value.phoneNumber === "string" ? value.phoneNumber : "",
    };
  } catch {
    return defaultBusinessSettings;
  }
}

export function writeBusinessSettings(settings: BusinessSettings) {
  localStorage.setItem(storageKey, JSON.stringify(settings));
}
