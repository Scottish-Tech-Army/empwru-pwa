import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getTodayAiCoachUsage } from "@/lib/aicoach-context";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const usage = await getTodayAiCoachUsage(supabase, user.id);
  console.log("[aicoach/usage] user", user.id, "=", usage);
  return NextResponse.json(usage);
}
