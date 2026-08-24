import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./supabase/config";

export function getSupabaseClient() {
	const { url, key } = getSupabaseConfig();

	return createClient(url, key);
}