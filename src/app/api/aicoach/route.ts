import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { AI_COACH_MOCK, buildContextBlock, fetchAiCoachContext } from "@/lib/aicoach-context";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

const CHAT_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    options: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
  },
  required: ["reply", "options"],
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

  const { goals, discovery } = await fetchAiCoachContext(supabase, user.id);
  const contextBlock = buildContextBlock(goals, discovery);

  if (AI_COACH_MOCK) {
    return NextResponse.json({
      reply: `[mock] You said: "${message.trim()}". Here's a placeholder coaching reply so you can check the UI without calling Gemini.`,
      options: [
        "Tell me more about that",
        "What should I focus on this week",
        "I want to talk about something else",
      ],
    });
  }

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3.6-flash",
      config: {
        systemInstruction: `${EM_PERSONA}\n\n${contextBlock}`,
        responseMimeType: "application/json",
        responseJsonSchema: CHAT_RESPONSE_SCHEMA,
      },
      contents: [
        ...(history ?? []).map((turn) => ({
          role: turn.role === "assistant" ? "model" : "user",
          parts: [{ text: turn.text }],
        })),
        { role: "user", parts: [{ text: message }] },
      ],
    });

    const parsed = JSON.parse(response.text ?? "{}") as { reply?: unknown; options?: unknown };
    const reply = typeof parsed.reply === "string" ? parsed.reply : response.text ?? "";
    const options =
      Array.isArray(parsed.options) && parsed.options.every((o) => typeof o === "string")
        ? (parsed.options as string[]).slice(0, 4)
        : [];

    return NextResponse.json({ reply, options });
  } catch (error) {
    console.error("AI Coach request failed", error);
    return NextResponse.json({ error: "Failed to get a response" }, { status: 500 });
  }
}
