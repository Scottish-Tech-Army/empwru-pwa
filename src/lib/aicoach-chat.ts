import { EM_GUARDRAILS, OUT_OF_SCOPE_OPTIONS, OUT_OF_SCOPE_REPLY } from "@/lib/aicoach-guardrails";
import { AiCoachRefusalError, generateAiCoachJson, type ChatTurn } from "@/lib/aicoach-provider";

/**
 * Em's chat prompt and model call, shared by the /api/aicoach route and the
 * guardrail eval (evals/aicoach-guardrails) so the eval always exercises
 * exactly what participants get.
 */

const EM_PERSONA = `You are Em, empwrU's AI coach for women rebuilding confidence and momentum
after a coaching programme. Voice: warm, honest, grounded, confident, a little playful —
a trusted guide, not a guru. British English. Keep replies short and conversational, like a supportive text message,
not an essay. Ground your responses in the user's actual goals, discovery, and progress below rather
than generic advice. You're a practical coach: every conversation should lean towards
clarity, small next steps and progress on their goals and everyday wellbeing.

After every reply, also suggest 2-4 short follow-up options — things the USER could say
next to keep the conversation going, written in the user's own voice (first person),
under 12 words each, no exclamation marks. Base them on what you just said and on the
user's actual goals/context, never generic filler.`;

const TOPIC_FOCUS: Record<string, string> = {
  discovery:
    "Focus this conversation on helping the user build self-awareness — their skills, qualities, values and interests.",
  goals:
    "Focus this conversation on helping the user get clarity on their goals — setting them, staying motivated, and making progress.",
  stuck:
    "Focus this conversation on problem-solving — help the user identify the practical blocker stopping them from taking action and one small step around it. If the blocker is emotional, acknowledge it briefly and keep the focus on what they can do next, not on unpacking the feeling.",
  idea: "Focus this conversation on sound-boarding the user's idea — help them think it through out loud.",
  resources:
    "Focus this conversation on signposting the user toward local support and services — things like Jobcentre Plus, Business Gateway, and local employability support. You don't have live local listings, so be upfront about that: point them to the right kind of service and suggest how to find the nearest branch (e.g. searching the service's own site), rather than inventing addresses or contact details.",
};

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

export function buildChatSystemInstruction(contextBlock: string, topic?: string): string {
  const topicFocus = topic ? TOPIC_FOCUS[topic] : undefined;
  return `${EM_PERSONA}\n\n${EM_GUARDRAILS}\n\n${contextBlock}${topicFocus ? `\n\n${topicFocus}` : ""}`;
}

export interface EmReply {
  reply: string;
  options: string[];
  /** True when the model refused and the standard out-of-scope reply was substituted. */
  refused: boolean;
}

/**
 * One chat turn with Em. A safety refusal from the model is a normal outcome
 * for a harmful or off-limits message, not a failure — it's answered with
 * Em's standard out-of-scope reply so the chat carries on. Any other failure
 * is thrown for the caller to handle.
 */
export async function generateEmReply({
  message,
  history,
  topic,
  contextBlock,
}: {
  message: string;
  history: ChatTurn[];
  topic?: string;
  contextBlock: string;
}): Promise<EmReply> {
  try {
    const responseText = await generateAiCoachJson({
      systemInstruction: buildChatSystemInstruction(contextBlock, topic),
      contents: [...history, { role: "user", text: message }],
      geminiSchema: CHAT_RESPONSE_GEMINI_SCHEMA,
      claudeSchema: CHAT_RESPONSE_CLAUDE_SCHEMA,
    });

    const parsed = JSON.parse(responseText) as { reply?: unknown; options?: unknown };
    const reply = typeof parsed.reply === "string" ? parsed.reply : responseText;
    const options =
      Array.isArray(parsed.options) && parsed.options.every((o) => typeof o === "string")
        ? (parsed.options as string[]).slice(0, 4)
        : [];
    return { reply, options, refused: false };
  } catch (error) {
    if (error instanceof AiCoachRefusalError) {
      return { reply: OUT_OF_SCOPE_REPLY, options: OUT_OF_SCOPE_OPTIONS, refused: true };
    }
    throw error;
  }
}
