import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  AI_COACH_MOCK,
  buildContextBlock,
  checkAndIncrementChatUsage,
  fetchAiCoachContext,
} from "@/lib/aicoach-context";
import { generateAiCoachJson, type ChatTurn } from "@/lib/aicoach-provider";

const EM_PERSONA = `You are Em, empwrU's AI coach for women rebuilding confidence and momentum
after a coaching programme. Voice: warm, honest, grounded, confident, a little playful —
a trusted guide, not a guru. Use "U" the way empwrU does (e.g. "growth begins with U").
British English. Keep replies short and conversational, like a supportive text message,
not an essay. Ground your responses in the user's actual goals and progress below rather
than generic advice.

After every reply, also suggest 2-4 short follow-up options — things the USER could say
next to keep the conversation going, written in the user's own voice (first person),
under 12 words each, no exclamation marks. Base them on what you just said and on the
user's actual goals/context, never generic filler.`;

const CHAT_RESPONSE_GEMINI_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    options: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
  },
  required: ["reply", "options"],
};

// Claude's structured-outputs dialect requires additionalProperties:false and
// doesn't support min/maxItems — the 2-4 option count stays enforced by the
// prompt text instead.
const CHAT_RESPONSE_CLAUDE_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    options: { type: "array", items: { type: "string" } },
  },
  required: ["reply", "options"],
  additionalProperties: false,
};

export async function POST(req: Request) {
  const { message, history } = (await req.json()) as {
    message?: string;
    history?: ChatTurn[];
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

  // Usage is checked/incremented against the real DB even in mock mode, so
  // the daily-limit behaviour itself can be tested locally without burning
  // model quota — only the actual model call below is skipped for mock.
  const usage = await checkAndIncrementChatUsage(supabase, user.id);
  console.log("[aicoach] chat usage for", user.id, "=", usage);
  if (!usage.allowed) {
    console.log("[aicoach] chat limit reached — returning canned reply, skipping model call");
    return NextResponse.json({
      reply: "That's a good place to pause for today.",
      options: [],
      chatLimitReached: true,
    });
  }
  const chatLimitReached = usage.chatCount >= usage.limit;
  console.log("[aicoach] chatLimitReached after this message =", chatLimitReached);

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
      chatLimitReached,
    });
  }

  try {
    const responseText = await generateAiCoachJson({
      systemInstruction: `${EM_PERSONA}\n\n${contextBlock}`,
      contents: [...(history ?? []), { role: "user", text: message }],
      geminiSchema: CHAT_RESPONSE_GEMINI_SCHEMA,
      claudeSchema: CHAT_RESPONSE_CLAUDE_SCHEMA,
    });

    const parsed = JSON.parse(responseText) as { reply?: unknown; options?: unknown };
    const reply = typeof parsed.reply === "string" ? parsed.reply : responseText;
    const options =
      Array.isArray(parsed.options) && parsed.options.every((o) => typeof o === "string")
        ? (parsed.options as string[]).slice(0, 4)
        : [];

    return NextResponse.json({ reply, options, chatLimitReached });
  } catch (error) {
    console.error("AI Coach request failed", error);
    return NextResponse.json({ error: "Failed to get a response" }, { status: 500 });
  }
}
