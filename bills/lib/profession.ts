export type ProfessionGroup = "shop" | "job" | "fees" | "general";

export type DiaryProfile = {
  professionGroup: ProfessionGroup;
  professionName: string;
  personalSectionEnabled: boolean;
};

export type ProfessionOption = DiaryProfile & { explanation: string };

export const professionStorageKey = "project-bills.diary-profile.v1";

export const professionOptions: ProfessionOption[] = [
  { professionGroup: "shop", professionName: "Meri Dukaan", personalSectionEnabled: false, explanation: "Sale and expense records" },
  { professionGroup: "job", professionName: "Mera Kaam", personalSectionEnabled: false, explanation: "Jobs, materials and payments" },
  { professionGroup: "fees", professionName: "Meri Class", personalSectionEnabled: false, explanation: "Students and fee records" },
  { professionGroup: "general", professionName: "Mera Hisaab", personalSectionEnabled: false, explanation: "Invoices and payment records" },
];

export const generalDiaryProfile: DiaryProfile = professionOptions.find((option) => option.professionGroup === "general")!;

function isProfessionGroup(value: unknown): value is ProfessionGroup {
  return value === "shop" || value === "job" || value === "fees" || value === "general";
}

export function getProfessionOption(group: ProfessionGroup) {
  return professionOptions.find((option) => option.professionGroup === group) || generalDiaryProfile;
}

export function validateDiaryProfile(value: unknown): DiaryProfile {
  if (typeof value !== "object" || value === null) return generalDiaryProfile;
  const candidate = value as Record<string, unknown>;
  if (!isProfessionGroup(candidate.professionGroup)) return generalDiaryProfile;
  const option = getProfessionOption(candidate.professionGroup);
  if (candidate.professionName !== option.professionName || typeof candidate.personalSectionEnabled !== "boolean") {
    return generalDiaryProfile;
  }
  return {
    professionGroup: option.professionGroup,
    professionName: option.professionName,
    personalSectionEnabled: candidate.personalSectionEnabled,
  };
}

export function readDiaryProfile(): DiaryProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(professionStorageKey);
    if (!raw) return null;
    return validateDiaryProfile(JSON.parse(raw));
  } catch {
    return generalDiaryProfile;
  }
}

export function writeDiaryProfile(profile: DiaryProfile): DiaryProfile {
  const validated = validateDiaryProfile(profile);
  window.localStorage.setItem(professionStorageKey, JSON.stringify(validated));
  return validated;
}
