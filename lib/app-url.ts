const LOCAL_APP_URL = "http://localhost:3000";

function normalizeAppUrl(value?: string): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

export function getAppUrl(fallback = LOCAL_APP_URL): string {
  return (
    normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizeAppUrl(fallback) ??
    LOCAL_APP_URL
  );
}

export function getAuthCallbackUrl(
  fallback?: string,
  nextPath = "/dashboard",
): string {
  const callbackUrl = new URL("/auth/callback", getAppUrl(fallback));
  callbackUrl.searchParams.set("next", nextPath);

  return callbackUrl.toString();
}
