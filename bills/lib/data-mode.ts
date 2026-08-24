import { isSupabaseConfigured } from "@/lib/supabase/config";

export type DataMode = "local" | "cloud";

export function getDataMode(): DataMode {
  return isSupabaseConfigured() ? "cloud" : "local";
}

export function isLocalOnlyMode(): boolean {
  return getDataMode() === "local";
}
