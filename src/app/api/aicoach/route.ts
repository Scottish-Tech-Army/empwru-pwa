import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  AI_COACH_MOCK,
  buildContextBlock,
  checkAndIncrementChatUsage,
  fetchAiCoachContext,
  getTodayAiCoachUsage,
} from "@/lib/aicoach-context";
import { CRISIS_OPTIONS, CRISIS_REPLY, detectCrisisLanguage } from "@/lib/aicoach-guardrails";
import { generateEmReply } from "@/lib/aicoach-chat";
import type { ChatTurn } from "@/lib/aicoach-provider";

export async function POST(req: Request) {
  const { message, history, topic } = (await req.json()) as {
    message?: string;
    history?: ChatTurn[];
    topic?: string;
  };

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  console.log("[aicoach] AI_COACH_MOCK =", AI_COACH_MOCK);

  // Checked before the usage limit so someone in crisis always gets
  // signposting — even with no requests left — and it never costs them one.
  if (detectCrisisLanguage(message)) {
    console.log("[aicoach] crisis language detected — returning signposting, skipping model call");
    const { remaining, limitReached } = await getTodayAiCoachUsage(supabase, user.id);
    return NextResponse.json({ reply: CRISIS_REPLY, options: CRISIS_OPTIONS, remaining, limitReached });
  }

  // Usage is checked/incremented against the real DB even in mock mode, so
  // the daily-limit behaviour itself can be tested locally without burning
  // model quota — only the actual model call below is skipped for mock.
  const usage = await checkAndIncrementChatUsage(supabase, user.id);
  console.log("[aicoach] chat usage for", user.id, "=", usage);
  const { remaining, limitReached } = usage;
  if (!usage.allowed) {
    console.log("[aicoach] daily limit reached — returning canned reply, skipping model call");
    return NextResponse.json({
      reply: "That's a good place to pause for today.",
      options: [],
      remaining,
      limitReached,
    });
  }
  console.log("[aicoach] remaining after this message =", remaining);

  const { goals, discovery } = await fetchAiCoachContext(supabase, user.id);
  const contextBlock = buildContextBlock(goals, discovery);

  if (AI_COACH_MOCK) {
    return NextResponse.json({
      reply: `[mock] You said: "${message.trim()}". Here's a placeholder coaching reply so you can check the UI without calling the model.`,
      options: [
        "Tell me more about that",
        "What should I focus on this week",
        "I want to talk about something else",
      ],
      remaining,
      limitReached,
    });
  }

  try {
    const { reply, options, refused } = await generateEmReply({ message, history: history ?? [], topic, contextBlock });
    if (refused) {
      console.log("[aicoach] model refused — returning out-of-scope reply");
    }
    return NextResponse.json({ reply, options, remaining, limitReached });
  } catch (error) {
    console.error("AI Coach request failed", error);
    return NextResponse.json({ error: "Failed to get a response" }, { status: 500 });
  }
}
