import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

/**
 * Which model backs the AI Coach. AI_COACH_PROVIDER=claude uses Claude, and
 * so does leaving it unset (Claude is the default) — only an explicit
 * AI_COACH_PROVIDER=gemini switches to Gemini. Any other value falls back to
 * Claude too, so a typo in the env var never silently disables the feature.
 */
export const AI_COACH_PROVIDER: "claude" | "gemini" =
  process.env.AI_COACH_PROVIDER === "gemini" ? "gemini" : "claude";

// Identity-linked API keys (personal keys that can act in more than one
// workspace) require an explicit anthropic-workspace-id header on every
// request — without it the API rejects the request. Workspace-scoped keys
// don't need this, so the header is only added when the env var is set.
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: process.env.ANTHROPIC_WORKSPACE_ID
    ? { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID }
    : undefined,
});
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CLAUDE_MODEL = "claude-sonnet-5";
const GEMINI_MODEL = "gemini-2.5-flash";
// Headroom above what a normal reply needs, so a verbose response doesn't
// get cut off mid-JSON — a truncated response is worse than a slow one.
const MAX_TOKENS = 4096;

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

/**
 * Sends a system instruction + turn history to whichever model backs the AI
 * Coach and returns the raw JSON text it produced. Gemini and Claude use
 * different schema dialects for structured output (Gemini's OpenAPI-style
 * responseJsonSchema vs. Claude's structured-outputs json_schema, which
 * requires additionalProperties:false and doesn't support min/maxItems), so
 * callers pass one schema per provider — but every caller parses the
 * returned text the same way regardless of which provider ran.
 */
export async function generateAiCoachJson({
  systemInstruction,
  contents,
  geminiSchema,
  claudeSchema,
}: {
  systemInstruction: string;
  contents: ChatTurn[];
  geminiSchema: Record<string, unknown>;
  claudeSchema: Record<string, unknown>;
}): Promise<string> {
  if (AI_COACH_PROVIDER === "gemini") {
    const response = await genAI.models.generateContent({
      model: GEMINI_MODEL,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseJsonSchema: geminiSchema,
      },
      contents: contents.map((turn) => ({
        role: turn.role === "assistant" ? "model" : "user",
        parts: [{ text: turn.text }],
      })),
    });
    // ?? only catches null/undefined, not an empty string — Gemini can
    // return .text as "" when there's genuinely no text content, which
    // would otherwise reach JSON.parse("") and throw a confusing
    // "Unexpected end of JSON input" instead of a clear error.
    if (!response.text) {
      throw new Error("Gemini returned no text content");
    }
    return response.text;
  }

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS,
    system: systemInstruction,
    output_config: { format: { type: "json_schema", schema: claudeSchema } },
    messages: contents.map((turn) => ({ role: turn.role, content: turn.text })),
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Claude declined to respond");
  }

  if (response.stop_reason === "max_tokens") {
    // The response was cut off before finishing — content, if any, is
    // partial/invalid JSON. Fail clearly here rather than letting truncated
    // text reach JSON.parse and throw a cryptic syntax error downstream.
    throw new Error("Claude's response was cut off before it finished");
  }

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );
  if (!textBlock?.text) {
    throw new Error("Claude returned no text content");
  }
  return textBlock.text;
}
