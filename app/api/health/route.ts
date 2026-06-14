import { NextResponse } from "next/server";
import { hasGeminiApiKey } from "@/lib/ai/config";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return NextResponse.json(
    {
      app: "ok",
      timestamp: new Date().toISOString(),
      supabaseConfigured: hasSupabaseEnv(),
      aiConfigured: hasGeminiApiKey(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
