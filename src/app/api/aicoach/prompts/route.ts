import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  AI_COACH_MOCK,
  buildContextBlock,
  checkAndIncrementChatUsage,
  fetchAiCoachContext,
  hasAiCoachContext,
} from "@/lib/aicoach-context";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const PROMPTS_SYSTEM_INSTRUCTION = `You write conversation-starter suggestions for Em, empwrU's AI coach.
Each suggestion is a short sentence the USER would say to Em to open a coaching conversation —
not something Em would say back. Base each one on the specific goal, strength, or value given below;
never write a generic prompt that could apply to any user. Under 12 words each, first person,
warm but plain British English — no jargon, no exclamation marks.`;

const PROMPTS_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    prompts: {
      type: "array",
      items: { type: "string" },
      minItems: 4,
      maxItems: 4,
    },
  },
  required: ["prompts"],
};

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { goals, discovery } = await fetchAiCoachContext(supabase, user.id);

  console.log("[aicoach/prompts] user", user.id, "goals:", goals.length, "discovery:", discovery);

  // Brand-new user with nothing to personalise around — let the client fall
  // back to its generic template instead of spending a model call on it.
  if (!hasAiCoachContext(goals, discovery)) {
    console.log("[aicoach/prompts] no context found — falling back to generic prompts");
    return NextResponse.json({ prompts: null, chatLimitReached: false });
  }

  // Personalising the landing page is itself an AI Coach query, so it draws
  // from the same daily chat budget as regular chat turns — checked and
  // claimed against the real DB even in mock mode, matching /api/aicoach.
  const usage = await checkAndIncrementChatUsage(supabase, user.id);
  console.log("[aicoach/prompts] chat usage for", user.id, "=", usage);
  if (!usage.allowed) {
    console.log("[aicoach/prompts] chat limit reached — skipping Gemini, no prompts");
    return NextResponse.json({ prompts: null, chatLimitReached: true });
  }
  const chatLimitReached = usage.chatCount >= usage.limit;

  const contextBlock = buildContextBlock(goals, discovery);
  console.log("[aicoach/prompts] context block sent to model:\n", contextBlock);

  if (AI_COACH_MOCK) {
    console.log("[aicoach/prompts] AI_COACH_MOCK on — skipping Gemini call");
    return NextResponse.json({
      prompts: [
        "[mock] I want to talk about my top goal",
        "[mock] Help me plan my next step",
        "[mock] I'm feeling stuck today",
        "[mock] Let's talk about my strengths",
      ],
      chatLimitReached,
    });
  }

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3.6-flash",
      config: {
        systemInstruction: PROMPTS_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseJsonSchema: PROMPTS_RESPONSE_SCHEMA,
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${contextBlock}\n\nWrite exactly 4 conversation-starter suggestions based on this.`,
            },
          ],
        },
      ],
    });

    console.log("[aicoach/prompts] raw model response.text:", response.text);

    const parsed = JSON.parse(response.text ?? "{}") as { prompts?: unknown };
    const prompts =
      Array.isArray(parsed.prompts) && parsed.prompts.every((p) => typeof p === "string")
        ? (parsed.prompts as string[]).slice(0, 4)
        : null;

    console.log("[aicoach/prompts] resolved prompts:", prompts);

    return NextResponse.json({ prompts, chatLimitReached });
  } catch (error) {
    console.error("[aicoach/prompts] AI Coach prompt generation failed", error);
    return NextResponse.json({ prompts: null, chatLimitReached });
  }
}
