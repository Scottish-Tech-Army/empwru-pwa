import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { AI_COACH_MOCK, checkAndIncrementGoalExtractUsage } from "@/lib/aicoach-context";
import { generateAiCoachJson, type ChatTurn } from "@/lib/aicoach-provider";

const GOAL_CATEGORIES = [
  "Wellbeing",
  "Career",
  "Finance",
  "Skills, Education & Learning",
  "Relationships",
  "other",
];

const EXTRACT_GOAL_SYSTEM_INSTRUCTION = `You read a coaching conversation between a user and Em, empwrU's AI coach,
and extract a single SMART goal that captures what the user actually wants to work on.
Base everything only on what's genuinely in the conversation — never invent details that
weren't discussed.
title: short and specific, under 10 words.
category: pick the closest match from the fixed list given.
whyMatters: one or two sentences on why this matters to the user, written in first person
as if the user is saying it.
steps: 3-6 concrete, ordered action steps the user could actually take, short phrases.`;

const EXTRACT_GOAL_GEMINI_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    category: { type: "string", enum: GOAL_CATEGORIES },
    whyMatters: { type: "string" },
    steps: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
  },
  required: ["title", "category", "whyMatters", "steps"],
};

// Claude's structured-outputs dialect requires additionalProperties:false and
// doesn't support min/maxItems — the 3-6 step count stays enforced by the
// prompt text instead.
const EXTRACT_GOAL_CLAUDE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    category: { type: "string", enum: GOAL_CATEGORIES },
    whyMatters: { type: "string" },
    steps: { type: "array", items: { type: "string" } },
  },
  required: ["title", "category", "whyMatters", "steps"],
  additionalProperties: false,
};

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
  const usage = await checkAndIncrementGoalExtractUsage(supabase, user.id);
  const { remaining, limitReached } = usage;
  if (!usage.allowed) {
    return NextResponse.json(
      {
        error:
          "You've used up today's AI Coach requests — come back tomorrow to turn another conversation into a goal.",
        remaining,
        limitReached,
      },
      { status: 429 }
    );
  }

  if (AI_COACH_MOCK) {
    return NextResponse.json({
      title: "[mock] Get fit for a 5k run",
      category: "Wellbeing",
      whyMatters: "I want more energy and to feel proud of my progress.",
      steps: ["Walk 20 minutes 3x this week", "Try one short jog", "Sign up for a local 5k"],
      remaining,
      limitReached,
    });
  }

  const transcript = history
    .map((turn) => `${turn.role === "assistant" ? "Em" : "User"}: ${turn.text}`)
    .join("\n");

  try {
    const responseText = await generateAiCoachJson({
      systemInstruction: EXTRACT_GOAL_SYSTEM_INSTRUCTION,
      contents: [
        { role: "user", text: `Conversation:\n${transcript}\n\nExtract the goal now.` },
      ],
      geminiSchema: EXTRACT_GOAL_GEMINI_SCHEMA,
      claudeSchema: EXTRACT_GOAL_CLAUDE_SCHEMA,
    });

    const parsed = JSON.parse(responseText) as {
      title?: unknown;
      category?: unknown;
      whyMatters?: unknown;
      steps?: unknown;
    };

    const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
    const category = GOAL_CATEGORIES.includes(parsed.category as string)
      ? (parsed.category as string)
      : "other";
    const whyMatters = typeof parsed.whyMatters === "string" ? parsed.whyMatters.trim() : "";
    const steps =
      Array.isArray(parsed.steps) && parsed.steps.every((s) => typeof s === "string")
        ? (parsed.steps as string[]).map((s) => s.trim()).filter(Boolean)
        : [];

    if (!title || steps.length === 0) {
      return NextResponse.json(
        {
          error: "Couldn't pin down a clear goal from this yet — chat a bit more first.",
          remaining,
          limitReached,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ title, category, whyMatters, steps, remaining, limitReached });
  } catch (error) {
    console.error("AI Coach goal extraction failed", error);
    return NextResponse.json({ error: "Failed to extract a goal", remaining, limitReached }, { status: 500 });
  }
}
