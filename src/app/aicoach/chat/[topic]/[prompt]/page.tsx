"use client";

import Image from "next/image";
import { use, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Clock, Compass, Target, X } from "lucide-react";
import { PrimaryButton } from "@/components";
import { addDiscoveryItem, createGoal, generateId, type DiscoveryPillar, type GoalCategory } from "@/lib/storage";

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
  options?: string[];
  isError?: boolean;
};

type ExtractedGoalDraft = {
  title: string;
  category: GoalCategory;
  whyMatters: string;
  steps: string[];
};

type ExtractedDiscoveryDraft = {
  skills: string[];
  qualities: string[];
  values: string[];
  interests: string[];
};

const GOAL_CATEGORIES: GoalCategory[] = [
  "Wellbeing",
  "Career",
  "Finance",
  "Skills, Education & Learning",
  "Relationships",
  "other",
];

const DISCOVERY_PILLAR_LABELS: Record<DiscoveryPillar, string> = {
  skills: "Skills",
  qualities: "Qualities",
  values: "Values",
  interests: "Interests",
};
const DISCOVERY_PILLARS: DiscoveryPillar[] = ["skills", "qualities", "values", "interests"];

// `remaining` is the only thing the server reports — how many of today's
// combined AI Coach requests are left. Whether that should currently block
// *chat* (as opposed to extraction) is a client-side judgment call, made in
// the component below from `remaining` plus its own knowledge of whether
// this conversation has already extracted — the server has no notion of
// separate conversations, so it can't make that call itself.
type UsageStatus = { remaining?: number };

async function askEm(
  message: string,
  history: ChatMessage[],
  topic: string
): Promise<{ text: string; options: string[]; isError: boolean } & UsageStatus> {
  const res = await fetch("/api/aicoach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, topic }),
  });

  if (!res.ok) {
    const text =
      res.status === 401
        ? "You'll need to sign in for me to give you personalised coaching."
        : "Sorry, something went wrong on my end. Mind trying that again?";
    return { text, options: [], isError: true };
  }

  const data = (await res.json()) as { reply?: string; options?: string[] } & UsageStatus;
  const text = data.reply?.trim() || "Sorry, I didn't quite catch that — could you rephrase?";
  return {
    text,
    options: Array.isArray(data.options) ? data.options : [],
    isError: false,
    remaining: data.remaining,
  };
}

async function extractGoal(
  history: ChatMessage[]
): Promise<{ draft?: ExtractedGoalDraft; error?: string } & UsageStatus> {
  const res = await fetch("/api/aicoach/extract-goal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ history: history.map(({ role, text }) => ({ role, text })) }),
  });

  const data = (await res.json()) as {
    title?: string;
    category?: GoalCategory;
    whyMatters?: string;
    steps?: string[];
    error?: string;
  } & UsageStatus;

  if (!res.ok || !data.title || !data.steps) {
    return { error: data.error || "Sorry, something went wrong pulling that together.", remaining: data.remaining };
  }

  return {
    draft: {
      title: data.title,
      category: data.category ?? "other",
      whyMatters: data.whyMatters ?? "",
      steps: data.steps,
    },
    remaining: data.remaining,
  };
}

async function extractDiscovery(
  history: ChatMessage[]
): Promise<{ draft?: ExtractedDiscoveryDraft; error?: string } & UsageStatus> {
  const res = await fetch("/api/aicoach/extract-discovery", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ history: history.map(({ role, text }) => ({ role, text })) }),
  });

  const data = (await res.json()) as {
    skills?: string[];
    qualities?: string[];
    values?: string[];
    interests?: string[];
    error?: string;
  } & UsageStatus;

  if (!res.ok) {
    return { error: data.error || "Sorry, something went wrong pulling that together.", remaining: data.remaining };
  }

  return {
    draft: {
      skills: data.skills ?? [],
      qualities: data.qualities ?? [],
      values: data.values ?? [],
      interests: data.interests ?? [],
    },
    remaining: data.remaining,
  };
}

export default function ChatPage({ params }: { params: Promise<{ topic: string; prompt: string }> }) {
  const router = useRouter();
  const { topic, prompt } = use(params);
  const decodedPrompt = decodeURIComponent(prompt || "");
  const isDiscoveryTopic = topic === "discovery";
  const isGoalsTopic = topic === "goals";
  const canTurnIntoAction = isDiscoveryTopic || isGoalsTopic;

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "Hi — I’m Em, your AI coach." },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const hasInitialized = useRef(false);
  // Tracks whether *this* conversation has used its "turn into X" action.
  // This is what decides, client-side, whether chat should still hold back
  // the day's last request for extraction — see the note on `remaining`
  // below.
  const [hasExtractedThisConversation, setHasExtractedThisConversation] = useState(false);

  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ExtractedGoalDraft | null>(null);
  const [savedGoalId, setSavedGoalId] = useState<string | null>(null);
  // How many of today's combined AI Coach requests are left (null until the
  // first response comes back). The server enforces this as a flat cap —
  // whether it should currently block *chat* specifically is decided below,
  // from this number plus whether this conversation has already extracted.
  const [remaining, setRemaining] = useState<number | null>(null);
  const [discoveryDraft, setDiscoveryDraft] = useState<ExtractedDiscoveryDraft | null>(null);
  const [savedDiscovery, setSavedDiscovery] = useState(false);

  // True once the shared daily pool is fully spent — nothing more is
  // possible, chat or extraction.
  const dailyLimitReached = remaining !== null && remaining <= 0;
  // Chat additionally holds back the pool's last request until *this*
  // conversation has extracted at least once, so a conversation can never
  // burn its only remaining chance to save itself without noticing.
  const chatLimitReached =
    dailyLimitReached || (remaining !== null && remaining <= 1 && !hasExtractedThisConversation);
  // Extraction was never subject to that holdback — it's the thing being
  // held back *for* — so it's blocked only once the whole pool is gone.
  const extractLimitReached = dailyLimitReached;

  useEffect(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }, [messages, isSending, draft, savedGoalId, discoveryDraft, savedDiscovery]);

  const addMessage = (m: ChatMessage) => setMessages((cur) => [...cur, m]);

  const applyRemaining = (value: number | undefined) => {
    if (value !== undefined) setRemaining(value);
  };

  const sendUserMessage = async (text: string, historyOverride?: ChatMessage[]) => {
    const historyForRequest = historyOverride ?? messages;
    addMessage({ role: "user", text });
    setIsSending(true);

    const { text: replyText, options, isError, remaining: newRemaining } = await askEm(text, historyForRequest, topic);
    addMessage({ role: "assistant", text: replyText, options, isError });
    setIsSending(false);
    applyRemaining(newRemaining);
  };

  // Checks today's usage first, then decides whether to auto-send the
  // tapped prompt — the two are sequenced (not two independent effects) so
  // an already-known limit can skip the real /api/aicoach round trip
  // entirely instead of firing it and getting the canned rejection back.
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    async function initialize() {
      let chatAlreadyReached = false;

      const res = await fetch("/api/aicoach/usage");
      if (res.ok) {
        const data = (await res.json()) as UsageStatus;
        applyRemaining(data.remaining);
        // Fresh page, so this conversation can't have extracted yet —
        // chatLimitReached's reservation logic above simplifies to this.
        chatAlreadyReached = data.remaining !== undefined && data.remaining <= 1;
      }

      if (!decodedPrompt) return;

      const greeting: ChatMessage[] = [
        { role: "assistant", text: "Hi — I’m Em, your AI coach." },
      ];

      if (chatAlreadyReached) {
        setMessages([
          ...greeting,
          { role: "user", text: decodedPrompt },
          { role: "assistant", text: "That's a good place to pause for today.", options: [] },
        ]);
        return;
      }

      setMessages(greeting);
      await sendUserMessage(decodedPrompt, greeting);
    }

    void initialize();
  }, [decodedPrompt]);

  const handleSend = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isSending || chatLimitReached) return;

    setInputValue("");
    await sendUserMessage(trimmed);
  };

  const handleOptionClick = (option: string) => {
    if (isSending || chatLimitReached) return;
    void sendUserMessage(option);
  };

  const handleExtractGoal = async () => {
    if (isSending || isExtracting || extractLimitReached) return;
    setIsExtracting(true);
    setExtractError(null);
    // Set before the round trip: attempting extraction is what fulfils this
    // conversation's reserved-slot guarantee, regardless of whether the
    // attempt itself succeeds.
    setHasExtractedThisConversation(true);

    const { draft: newDraft, error, remaining: newRemaining } = await extractGoal(messages);
    if (newDraft) {
      setDraft(newDraft);
    } else {
      setExtractError(error ?? "Sorry, something went wrong pulling that together.");
    }
    applyRemaining(newRemaining);
    setIsExtracting(false);
  };

  const handleExtractDiscovery = async () => {
    if (isSending || isExtracting || extractLimitReached) return;
    setIsExtracting(true);
    setExtractError(null);
    setHasExtractedThisConversation(true);

    const { draft: newDraft, error, remaining: newRemaining } = await extractDiscovery(messages);
    if (newDraft) {
      setDiscoveryDraft(newDraft);
    } else {
      setExtractError(error ?? "Sorry, something went wrong pulling that together.");
    }
    applyRemaining(newRemaining);
    setIsExtracting(false);
  };

  const removeDiscoveryDraftItem = (pillar: DiscoveryPillar, index: number) => {
    setDiscoveryDraft((current) => {
      if (!current) return current;
      return { ...current, [pillar]: current[pillar].filter((_, i) => i !== index) };
    });
  };

  const handleDiscardDiscoveryDraft = () => {
    setDiscoveryDraft(null);
    setSavedDiscovery(false);
  };

  const handleSaveDiscovery = () => {
    if (!discoveryDraft) return;
    for (const pillar of DISCOVERY_PILLARS) {
      for (const item of discoveryDraft[pillar]) {
        addDiscoveryItem(pillar, item);
      }
    }
    setSavedDiscovery(true);
  };

  const updateDraft = (updates: Partial<ExtractedGoalDraft>) => {
    setDraft((current) => (current ? { ...current, ...updates } : current));
  };

  const updateStep = (index: number, text: string) => {
    setDraft((current) => {
      if (!current) return current;
      const steps = [...current.steps];
      steps[index] = text;
      return { ...current, steps };
    });
  };

  const removeStep = (index: number) => {
    setDraft((current) => {
      if (!current) return current;
      return { ...current, steps: current.steps.filter((_, i) => i !== index) };
    });
  };

  const addStep = () => {
    setDraft((current) => (current ? { ...current, steps: [...current.steps, ""] } : current));
  };

  const handleDiscardDraft = () => {
    setDraft(null);
    setSavedGoalId(null);
  };

  const handleSaveGoal = () => {
    if (!draft) return;
    const cleanTitle = draft.title.trim();
    const cleanSteps = draft.steps.map((s) => s.trim()).filter(Boolean);
    if (!cleanTitle || cleanSteps.length === 0) return;

    const newGoal = createGoal({
      title: cleanTitle,
      category: draft.category,
      whyMatters: draft.whyMatters.trim(),
      feelWhenDone: "",
      actions: [],
      steps: cleanSteps.map((title) => ({ id: generateId(), title, completed: false })),
    });

    setSavedGoalId(newGoal.id);
  };

  const hasConversation = messages.some((m) => m.role === "user");
  const canSaveDraft = Boolean(draft?.title.trim()) && (draft?.steps.some((s) => s.trim()) ?? false);
  const canSaveDiscoveryDraft = Boolean(
    discoveryDraft && DISCOVERY_PILLARS.some((pillar) => discoveryDraft[pillar].length > 0)
  );

  return (
    <div className="relative min-h-screen bg-slate-100 text-[var(--color-charcoal)]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-between px-4 py-6 sm:px-6">
        <div>
          <div className="mb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm font-medium text-[var(--color-magenta)]"
            >
              ← Back
            </button>
            <div className="flex items-center gap-3 rounded-full bg-slate-50 px-3 py-2 shadow-sm">
              <div className="relative h-11 w-11 overflow-hidden rounded-full bg-[var(--color-magenta)]/10">
                <Image
                  src="/illustrations/em-aicoachv2-fullll.png"
                  alt="Em AI Coach"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-charcoal)]">Em</p>
                <p className="text-xs text-slate-500">empwrU&apos;s AI Coach - Chat</p>
              </div>
            </div>
          </div>

          <div className="rounded-[40px] bg-white p-6 shadow-[0_25px_70px_rgba(0,0,0,0.08)]">
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isAssistant = message.role === "assistant";
                const isLatest = index === messages.length - 1;
                const showOptions =
                  isAssistant &&
                  isLatest &&
                  !isSending &&
                  !chatLimitReached &&
                  (message.options?.length ?? 0) > 0;
                const showTurnIntoTrigger =
                  isAssistant &&
                  isLatest &&
                  !isSending &&
                  !draft &&
                  !discoveryDraft &&
                  hasConversation &&
                  !chatLimitReached &&
                  !message.isError &&
                  canTurnIntoAction;

                return (
                  <div key={`${message.role}-${index}`} className="space-y-2">
                    <div className={`flex w-full ${isAssistant ? "justify-start" : "justify-end"}`}>
                      <div
                        className={`rounded-3xl p-4 shadow-sm max-w-[90%] sm:max-w-[80%] ${
                          isAssistant
                            ? "bg-white text-[var(--color-charcoal)] shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
                            : "bg-[var(--color-magenta)]/10 text-[var(--color-charcoal)] border border-[var(--color-magenta)]/20"
                        }`}
                      >
                        <div className={`flex items-start gap-3 ${isAssistant ? "" : "flex-row-reverse"}`}>
                          {isAssistant ? (
                            <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-[var(--color-magenta)]/10">
                              <Image
                                src="/illustrations/em-aicoachv2-half.png"
                                alt="Em AI Coach"
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                          <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-[var(--color-magenta)]/10">
                              <Image
                                  src="/illustrations/user-half.png"
                                  alt="user"
                                  fill
                                  className="object-cover"
                              />
                          </div>
                          )}
                          <p className="text-sm leading-6">{message.text}</p>
                        </div>
                      </div>
                    </div>

                    {showOptions && (
                      <div className="flex flex-wrap gap-2 pl-12">
                        {message.options!.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => handleOptionClick(option)}
                            className="rounded-full border border-[var(--color-magenta)]/30 bg-[var(--color-magenta)]/5 px-4 py-2 text-left text-xs font-medium text-[var(--color-magenta)] transition hover:bg-[var(--color-magenta)]/10"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}

                    {showTurnIntoTrigger && (
                      <div className="pl-12">
                        <button
                          type="button"
                          onClick={isDiscoveryTopic ? handleExtractDiscovery : handleExtractGoal}
                          disabled={
                            isExtracting ||
                            extractLimitReached
                          }
                          className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-4 py-2 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(188,3,185,0.25)] transition hover:scale-[1.02] disabled:opacity-60"
                        >
                          {isDiscoveryTopic ? (
                            <Compass className="h-3.5 w-3.5" />
                          ) : (
                            <Target className="h-3.5 w-3.5" />
                          )}
                          {isExtracting
                            ? "Pulling this together…"
                            : extractLimitReached
                            ? "Already used today"
                            : isDiscoveryTopic
                            ? "Turn this into discovery notes"
                            : "Turn this into a goal"}
                        </button>
                        {extractError && (
                          <p className="mt-2 text-xs text-red-500">{extractError}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {isSending && (
                <div className="flex w-full justify-start">
                  <div className="rounded-3xl p-4 shadow-sm bg-white text-slate-400 text-sm shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                    Em is thinking…
                  </div>
                </div>
              )}

              {draft && (
                <div className="rounded-3xl border-2 border-[var(--color-magenta)]/20 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-magenta)]">
                    Goal summary
                  </p>

                  {savedGoalId ? (
                    <div className="space-y-3 text-center">
                      <p className="text-sm text-[var(--color-charcoal)]">
                        Saved — this goal is now in your list.
                      </p>
                      <div className="flex justify-center gap-2">
                        <PrimaryButton
                          type="button"
                          onClick={() => router.push(`/goals/${savedGoalId}`)}
                          fullWidth={false}
                          className="min-w-[120px]"
                        >
                          View goal
                        </PrimaryButton>
                        <button
                          type="button"
                          onClick={handleDiscardDraft}
                          className="rounded-full border border-gray-200 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50"
                        >
                          Keep chatting
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        value={draft.title}
                        onChange={(e) => updateDraft({ title: e.target.value })}
                        placeholder="Goal title"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-[var(--color-charcoal)] outline-none focus:border-[var(--color-magenta)]"
                      />

                      <select
                        value={draft.category}
                        onChange={(e) => updateDraft({ category: e.target.value as GoalCategory })}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-[var(--color-charcoal)] outline-none focus:border-[var(--color-magenta)]"
                      >
                        {GOAL_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>

                      <textarea
                        value={draft.whyMatters}
                        onChange={(e) => updateDraft({ whyMatters: e.target.value })}
                        placeholder="Why this matters to you"
                        rows={2}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-[var(--color-charcoal)] outline-none focus:border-[var(--color-magenta)]"
                      />

                      <div className="space-y-2">
                        {draft.steps.map((step, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              value={step}
                              onChange={(e) => updateStep(index, e.target.value)}
                              placeholder={`Step ${index + 1}`}
                              className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-[var(--color-charcoal)] outline-none focus:border-[var(--color-magenta)]"
                            />
                            <button
                              type="button"
                              onClick={() => removeStep(index)}
                              className="text-slate-400 hover:text-red-500"
                              aria-label="Remove step"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addStep}
                          className="text-xs font-medium text-[var(--color-magenta)]"
                        >
                          + Add step
                        </button>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <PrimaryButton
                          type="button"
                          onClick={handleSaveGoal}
                          disabled={!canSaveDraft}
                          fullWidth={true}
                          className="flex-1 disabled:opacity-60"
                        >
                          Save goal
                        </PrimaryButton>
                        <button
                          type="button"
                          onClick={handleDiscardDraft}
                          className="rounded-full border border-gray-200 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50"
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {discoveryDraft && (
                <div className="rounded-3xl border-2 border-[var(--color-magenta)]/20 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-magenta)]">
                    Discovery notes
                  </p>

                  {savedDiscovery ? (
                    <div className="space-y-3 text-center">
                      <p className="text-sm text-[var(--color-charcoal)]">
                        Saved — check your Discovery hub for what&apos;s new.
                      </p>
                      <div className="flex justify-center gap-2">
                        <PrimaryButton
                          type="button"
                          onClick={() => router.push("/discovery")}
                          fullWidth={false}
                          className="min-w-[120px]"
                        >
                          View discovery
                        </PrimaryButton>
                        <button
                          type="button"
                          onClick={handleDiscardDiscoveryDraft}
                          className="rounded-full border border-gray-200 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50"
                        >
                          Keep chatting
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {DISCOVERY_PILLARS.map((pillar) =>
                        discoveryDraft[pillar].length > 0 ? (
                          <div key={pillar}>
                            <p className="mb-2 text-xs font-semibold text-slate-500">
                              {DISCOVERY_PILLAR_LABELS[pillar]}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {discoveryDraft[pillar].map((item, index) => (
                                <span
                                  key={`${pillar}-${index}`}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-magenta)]/20 bg-[var(--color-magenta)]/5 px-3 py-1.5 text-xs text-[var(--color-charcoal)]"
                                >
                                  {item}
                                  <button
                                    type="button"
                                    onClick={() => removeDiscoveryDraftItem(pillar, index)}
                                    className="text-slate-400 hover:text-red-500"
                                    aria-label={`Remove ${item}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null
                      )}

                      <div className="flex gap-2 pt-2">
                        <PrimaryButton
                          type="button"
                          onClick={handleSaveDiscovery}
                          disabled={!canSaveDiscoveryDraft}
                          fullWidth={true}
                          className="flex-1 disabled:opacity-60"
                        >
                          Save to Discovery
                        </PrimaryButton>
                        <button
                          type="button"
                          onClick={handleDiscardDiscoveryDraft}
                          className="rounded-full border border-gray-200 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50"
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {chatLimitReached && !draft && !discoveryDraft ? (
          <div className="mt-6 rounded-[28px] bg-[var(--color-bg-card)] p-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient">
              <Clock className="h-[18px] w-[18px] text-white" />
            </div>
            <p className="text-sm font-semibold text-[var(--color-charcoal)]">That&apos;s today&apos;s chats</p>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-6 text-[var(--color-text-muted)]">
              {!canTurnIntoAction ||
              extractLimitReached
                ? "Come back tomorrow for more."
                : isDiscoveryTopic
                ? "Come back tomorrow for more — or turn this conversation into discovery notes so it doesn't go to waste."
                : "Come back tomorrow for more — or turn this conversation into a goal so it doesn't go to waste."}
            </p>
            {canTurnIntoAction && !extractLimitReached && (
              <button
                type="button"
                onClick={isDiscoveryTopic ? handleExtractDiscovery : handleExtractGoal}
                disabled={isExtracting}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(188,3,185,0.25)] transition hover:scale-[1.02] disabled:opacity-60"
              >
                {isDiscoveryTopic ? <Compass className="h-4 w-4" /> : <Target className="h-4 w-4" />}
                {isExtracting
                  ? "Pulling this together…"
                  : isDiscoveryTopic
                  ? "Turn this into discovery notes"
                  : "Turn this into a goal"}
              </button>
            )}
            {extractError && <p className="mt-3 text-xs text-red-500">{extractError}</p>}
          </div>
        ) : chatLimitReached && (draft || discoveryDraft) ? null : (
          <form onSubmit={handleSend} className="mt-6 space-y-4">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message to Em..."
              disabled={isSending}
              className="w-full rounded-full border border-gray-200 bg-white px-5 py-4 text-sm text-[var(--color-charcoal)] outline-none transition focus:border-[var(--color-magenta)] focus:ring-2 focus:ring-[var(--color-magenta)]/20 disabled:opacity-60"
            />
            <PrimaryButton
              type="submit"
              fullWidth={true}
              disabled={isSending}
              className="w-full rounded-full py-4 text-base disabled:opacity-60"
            >
              {isSending ? "Sending…" : "Send"}
            </PrimaryButton>
          </form>
        )}
      </div>
    </div>
  );
}
