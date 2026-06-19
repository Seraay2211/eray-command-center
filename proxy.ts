import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const publicAssetPaths = [
  "/manifest.json",
  "/site.webmanifest",
  "/favicon.ico",
  "/favicon.svg",
  "/apple-touch-icon.png",
  "/robots.txt",
  "/sitemap.xml",
  "/sw.js",
];

const publicAssetPrefixes = [
  "/_next",
  "/icons",
  "/images",
  "/assets",
];

function isPublicAssetPath(pathname: string): boolean {
  return (
    publicAssetPaths.includes(pathname) ||
    publicAssetPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  );
}

export async function proxy(request: NextRequest) {
  if (isPublicAssetPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|icons/|images/|assets/|manifest\\.json|site\\.webmanifest|favicon\\.ico|favicon\\.svg|apple-touch-icon\\.png|robots\\.txt|sitemap\\.xml|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
