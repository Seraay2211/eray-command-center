export const SUPABASE_ENV_ERROR =
  "Supabase yapılandırması eksik. .env.local dosyasına NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY değerlerini ekleyin.";

export const SUPABASE_ENV_INVALID_ERROR =
  "Supabase yapılandırmasında örnek veya geçersiz değerler var. AYARLA_SUPABASE.cmd dosyasını açıp gerçek Project URL ve Publishable key değerlerini girin.";

function isValidSupabaseUrl(value?: string): boolean {
  if (!value || value.includes("proje-id")) return false;

  try {
    const url = new URL(value);
    return (
      ((url.protocol === "http:" || url.protocol === "https:") &&
        (url.hostname === "127.0.0.1" || url.hostname === "localhost")) ||
      (url.protocol === "https:" &&
        url.hostname.endsWith(".supabase.co") &&
        url.hostname !== "proje-id.supabase.co")
    );
  } catch {
    return false;
  }
}

function isValidSupabaseKey(value?: string): boolean {
  if (!value || value === "anon-key" || value.length < 20) return false;

  const normalized = value.toLowerCase();
  return (
    !normalized.startsWith("sb_secret_") &&
    !normalized.includes("service_role") &&
    (value.startsWith("sb_publishable_") || value.startsWith("eyJ"))
  );
}

export function hasSupabaseEnv(): boolean {
  return (
    isValidSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    isValidSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(SUPABASE_ENV_ERROR);
  }

  if (!isValidSupabaseUrl(url) || !isValidSupabaseKey(anonKey)) {
    throw new Error(SUPABASE_ENV_INVALID_ERROR);
  }

  return { anonKey, url };
}
