export type BusinessSettings = {
  businessName: string;
  upiId: string;
  phoneNumber: string;
  gstin: string;
};

export const defaultBusinessSettings: BusinessSettings = {
  businessName: "Your Business Name",
  upiId: "",
  phoneNumber: "",
  gstin: "",
};

const storageKey = "project-bills.business-settings.v1";

export function readBusinessSettings(): BusinessSettings {
  if (typeof window === "undefined") return defaultBusinessSettings;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (typeof parsed !== "object" || parsed === null) return defaultBusinessSettings;
    const value = parsed as Record<string, unknown>;
    return {
      businessName: typeof value.businessName === "string" && value.businessName.trim() ? value.businessName : defaultBusinessSettings.businessName,
      upiId: typeof value.upiId === "string" ? value.upiId : "",
      phoneNumber: typeof value.phoneNumber === "string" ? value.phoneNumber : "",
      gstin: typeof value.gstin === "string" ? value.gstin : "",
    };
  } catch {
    return defaultBusinessSettings;
  }
}

export function writeBusinessSettings(settings: BusinessSettings) {
  localStorage.setItem(storageKey, JSON.stringify(settings));
}
