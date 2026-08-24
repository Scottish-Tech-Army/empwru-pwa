import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { AI_COACH_MOCK, checkAndIncrementGoalExtractUsage } from "@/lib/aicoach-context";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

const EXTRACT_GOAL_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    category: { type: "string", enum: GOAL_CATEGORIES },
    whyMatters: { type: "string" },
    steps: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
  },
  required: ["title", "category", "whyMatters", "steps"],
};

interface ChatTurn {
  role: "user" | "assistant";
  text: string;
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
  // Gemini quota — only the actual model call below is skipped for mock.
  const usage = await checkAndIncrementGoalExtractUsage(supabase, user.id);
  if (!usage.allowed) {
    return NextResponse.json(
      { error: "You've already turned a conversation into a goal today — come back tomorrow for another." },
      { status: 429 }
    );
  }

  if (AI_COACH_MOCK) {
    return NextResponse.json({
      title: "[mock] Get fit for a 5k run",
      category: "Wellbeing",
      whyMatters: "I want more energy and to feel proud of my progress.",
      steps: ["Walk 20 minutes 3x this week", "Try one short jog", "Sign up for a local 5k"],
    });
  }

  const transcript = history
    .map((turn) => `${turn.role === "assistant" ? "Em" : "User"}: ${turn.text}`)
    .join("\n");

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: EXTRACT_GOAL_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseJsonSchema: EXTRACT_GOAL_SCHEMA,
      },
      contents: [
        {
          role: "user",
          parts: [{ text: `Conversation:\n${transcript}\n\nExtract the goal now.` }],
        },
      ],
    });

    const parsed = JSON.parse(response.text ?? "{}") as {
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
        { error: "Couldn't pin down a clear goal from this yet — chat a bit more first." },
        { status: 422 }
      );
    }

    return NextResponse.json({ title, category, whyMatters, steps });
  } catch (error) {
    console.error("AI Coach goal extraction failed", error);
    return NextResponse.json({ error: "Failed to extract a goal" }, { status: 500 });
  }
}
