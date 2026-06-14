import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";

let browserClient: SupabaseClient | undefined;

export function createClient(): SupabaseClient {
  const { anonKey, url } = getSupabaseEnv();

  browserClient ??= createBrowserClient(url, anonKey);

  return browserClient;
}
