import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { AI_COACH_MOCK, checkAndIncrementDiscoveryExtractUsage } from "@/lib/aicoach-context";
import { generateAiCoachJson, type ChatTurn } from "@/lib/aicoach-provider";

const EXTRACT_DISCOVERY_SYSTEM_INSTRUCTION = `You read a coaching conversation between a user and Em, empwrU's AI coach,
and pull out any self-awareness items the user genuinely surfaced — things they said about
their skills, personal qualities, values, or interests. Base everything only on what's
genuinely in the conversation — never invent items that weren't discussed.
skills: things the user said they can do or are good at, short phrases (2-6 words).
qualities: personal strengths/character traits the user showed or named, short phrases (2-6 words).
values: things the user said matter to them, short phrases (2-6 words).
interests: things the user said they enjoy or are curious about, short phrases (2-6 words).
Leave any pillar as an empty array if the conversation didn't genuinely touch on it.`;

const EXTRACT_DISCOVERY_GEMINI_SCHEMA = {
  type: "object",
  properties: {
    skills: { type: "array", items: { type: "string" } },
    qualities: { type: "array", items: { type: "string" } },
    values: { type: "array", items: { type: "string" } },
    interests: { type: "array", items: { type: "string" } },
  },
  required: ["skills", "qualities", "values", "interests"],
};

const EXTRACT_DISCOVERY_CLAUDE_SCHEMA = {
  type: "object",
  properties: {
    skills: { type: "array", items: { type: "string" } },
    qualities: { type: "array", items: { type: "string" } },
    values: { type: "array", items: { type: "string" } },
    interests: { type: "array", items: { type: "string" } },
  },
  required: ["skills", "qualities", "values", "interests"],
  additionalProperties: false,
};

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string")
    ? (value as string[]).map((v) => v.trim()).filter(Boolean)
    : [];
}

export async function POST(req: Request) {
  const { history } = (await req.json()) as { history?: ChatTurn[] };

  if (!history || history.length === 0) {
    return NextResponse.json({ error: "No conversation to extract from" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Usage is checked/incremented against the real DB even in mock mode, so
  // the daily-limit behaviour itself can be tested locally without burning
  // model quota — only the actual model call below is skipped for mock.
  const usage = await checkAndIncrementDiscoveryExtractUsage(supabase, user.id);
  const { remaining, limitReached } = usage;
  if (!usage.allowed) {
    return NextResponse.json(
      {
        error:
          "You've used up today's AI Coach requests — come back tomorrow to turn another conversation into discovery notes.",
        remaining,
        limitReached,
      },
      { status: 429 }
    );
  }

  if (AI_COACH_MOCK) {
    return NextResponse.json({
      skills: ["[mock] Public speaking"],
      qualities: ["[mock] Persistent"],
      values: ["[mock] Growth"],
      interests: ["[mock] Painting"],
      remaining,
      limitReached,
    });
  }

  const transcript = history
    .map((turn) => `${turn.role === "assistant" ? "Em" : "User"}: ${turn.text}`)
    .join("\n");

  try {
    const responseText = await generateAiCoachJson({
      systemInstruction: EXTRACT_DISCOVERY_SYSTEM_INSTRUCTION,
      contents: [
        { role: "user", text: `Conversation:\n${transcript}\n\nExtract the discovery notes now.` },
      ],
      geminiSchema: EXTRACT_DISCOVERY_GEMINI_SCHEMA,
      claudeSchema: EXTRACT_DISCOVERY_CLAUDE_SCHEMA,
    });

    const parsed = JSON.parse(responseText) as {
      skills?: unknown;
      qualities?: unknown;
      values?: unknown;
      interests?: unknown;
    };

    const skills = toStringArray(parsed.skills);
    const qualities = toStringArray(parsed.qualities);
    const values = toStringArray(parsed.values);
    const interests = toStringArray(parsed.interests);

    if (skills.length === 0 && qualities.length === 0 && values.length === 0 && interests.length === 0) {
      return NextResponse.json(
        {
          error: "Couldn't pin down anything new yet — chat a bit more first.",
          remaining,
          limitReached,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ skills, qualities, values, interests, remaining, limitReached });
  } catch (error) {
    console.error("AI Coach discovery extraction failed", error);
    return NextResponse.json({ error: "Failed to extract discovery notes", remaining, limitReached }, { status: 500 });
  }
}
