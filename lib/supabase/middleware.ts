import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/supabase/env";

const protectedRoutes = [
  "/",
  "/dashboard",
  "/notes",
  "/tasks",
  "/reports",
  "/calendar",
  "/finance",
  "/templates",
  "/taxonomy",
  "/ai",
  "/settings",
  "/today",
];

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(
    (route) =>
      pathname === route || (route !== "/" && pathname.startsWith(`${route}/`)),
  );
}

function redirectWithCookies(
  request: NextRequest,
  sourceResponse: NextResponse,
  pathname: string,
  error?: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  if (error) {
    url.searchParams.set("error", error);
  }

  const response = NextResponse.redirect(url);

  sourceResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate, max-age=0",
  );

  return response;
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname === "/login";
  const requiresAuth = isProtectedRoute(pathname);

  if (!hasSupabaseEnv()) {
    if (requiresAuth) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set("error", "config");
      return NextResponse.redirect(url);
    }

    return NextResponse.next({ request });
  }

  const { anonKey, url } = getSupabaseEnv();
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, options, value }) => {
          supabaseResponse.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  let claims: Record<string, unknown> | undefined;

  try {
    const { data, error } = await supabase.auth.getClaims();
    if (!error) {
      claims = data?.claims;
    }
  } catch {
    if (requiresAuth) {
      return redirectWithCookies(
        request,
        supabaseResponse,
        "/login",
        "connection",
      );
    }
  }

  if (!claims && requiresAuth) {
    return redirectWithCookies(request, supabaseResponse, "/login");
  }

  if (claims && isLoginRoute) {
    return redirectWithCookies(request, supabaseResponse, "/dashboard");
  }

  supabaseResponse.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate, max-age=0",
  );

  return supabaseResponse;
}
