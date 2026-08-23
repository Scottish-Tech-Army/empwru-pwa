"use client";

import Image from "next/image";
import { Clock, Compass, Flame, Lightbulb, Target } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { PrimaryButton } from "@/components";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { hasSeenAiCoachWelcome, markAiCoachWelcomeSeen } from "@/lib/storage";
import BottomNav from "@/components/ui/BottomNav";

// Shown when there's nothing yet to personalise around — a brand-new user
// with no goals and no discovery data — or if prompt generation fails.
const GENERIC_PROMPTS = [
  "I want to discover what I'm good at",
  "I want to get clear on my goals",
  "I want to take action but feel stuck",
  "I want to discuss an idea",
];

async function fetchPersonalizedPrompts(): Promise<{
  prompts: string[] | null;
  chatLimitReached: boolean;
}> {
  const res = await fetch("/api/aicoach/prompts");
  if (!res.ok) return { prompts: null, chatLimitReached: false };

  const data = (await res.json()) as { prompts?: unknown; chatLimitReached?: boolean };
  const prompts =
    Array.isArray(data.prompts) && data.prompts.length === 4 ? (data.prompts as string[]) : null;
  return { prompts, chatLimitReached: Boolean(data.chatLimitReached) };
}

// Toggle this to true to only allow selecting from the predefined prompts
const ONLY_PREDEFINED = true;

// Cycled by tile position — prompts are always exactly 4, generated or generic
const TILE_ICONS = [Target, Compass, Flame, Lightbulb];

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: "assistant",
    text: "Hi — I’m Em, your AI coach. Choose one of the prompts below or ask me anything to get started.",
  },
];

function getDisplayNameFromEmail(email: string | null | undefined) {
  const localPart = email?.split("@")[0] ?? "there";
  const cleaned = localPart.replace(/[^a-zA-Z0-9]/g, "");
  const derived = cleaned.slice(0, 6) || "there";

  return derived.charAt(0).toUpperCase() + derived.slice(1);
}

export default function AiCoachPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [displayName, setDisplayName] = useState("there");
  const [promptOptions, setPromptOptions] = useState<string[]>(GENERIC_PROMPTS);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const [chatLimitReached, setChatLimitReached] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      const metadataName = session.user.user_metadata?.display_name;
      setDisplayName(metadataName || getDisplayNameFromEmail(session.user.email));
    });
  }, []);

  useEffect(() => {
    if (hasSeenAiCoachWelcome()) {
      setShowWelcomeModal(false);
    }
  }, []);

  const hasFetchedPrompts = useRef(false);

  useEffect(() => {
    if (hasFetchedPrompts.current) return;
    hasFetchedPrompts.current = true;

    async function loadPersonalizedPrompts() {
      const { prompts, chatLimitReached: limitReached } = await fetchPersonalizedPrompts();
      // null covers both "brand-new user" and "generation failed" — either
      // way, keep the generic template already set as the default state.
      if (prompts) setPromptOptions(prompts);
      setChatLimitReached(limitReached);
      setIsLoadingPrompts(false);
    }

    void loadPersonalizedPrompts();
  }, []);

  const addMessage = (message: ChatMessage) => {
    setMessages((current) => [...current, message]);
  };

  const handlePromptClick = (prompt: string) => {
    if(ONLY_PREDEFINED){
    router.push(`/aicoach/chat/${encodeURIComponent(prompt)}`);
    }else{
       addMessage({ role: "user", text: prompt });
      setTimeout(() => {
        addMessage({
          role: "assistant",
          text: "Great choice! Tell me more about what you want to achieve, and I’ll help you shape the next step.",
        });
      }, 150);
    }
  };

  const handleSend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = inputValue.trim();
    if (!trimmed) return;

    addMessage({ role: "user", text: trimmed });
    setInputValue("");

    setTimeout(() => {
      addMessage({
        role: "assistant",
        text: "Thanks! I’m thinking through your question now. I’ll give you a clear, practical next step in a moment.",
      });
    }, 150);
  };

  return (
    <div className="relative min-h-screen bg-white text-[var(--color-charcoal)]">
      <div className="mx-auto flex min-h-screen w-full flex-col justify-center px-4 py-6 sm:px-8 lg:px-12">
        {showWelcomeModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/25 p-6 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-2xl ring-1 ring-black/10 sm:p-8">
              <div className="space-y-5 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[var(--color-magenta)]">
                  AI Coach
                </p>
                <div className="mx-auto mt-4 h-20 w-20 overflow-hidden rounded-full bg-[var(--color-magenta)]/10">
                  <div className="relative h-full w-full">
                    <Image
                      src="/illustrations/em-aicoachv2-white-full.png"
                      alt="Em AI Coach"
                      fill
                      className="object-cover"
                    />
                </div>
                </div>
                <h2 className="text-2xl font-bold text-[var(--color-charcoal)] sm:text-3xl">
                  Hi, I&apos;m Em — empwrU&apos;s AI coach.
                </h2>
                <p className="mx-auto max-w-xl text-sm leading-7 text-[rgba(3,3,3,0.75)]">
                  I&apos;m here if you need me, any time. Here are some ways I can help:
                </p>
                <ul className="mx-auto max-w-xs space-y-2 text-left text-sm leading-7 text-[var(--color-charcoal)]">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-magenta)]" />
                    <span>Discover your strengths and clarity</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-magenta)]" />
                    <span>Get clear on your next goals</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-magenta)]" />
                    <span>Turn ideas into action with confidence</span>
                  </li>
                </ul>
                <p className="mx-auto max-w-xl text-sm leading-7 text-[rgba(3,3,3,0.7)]">
                  So if you&apos;re feeling stuck, or have an idea to discuss, drop by for a cuppa and chat.
                </p>
                <PrimaryButton
                  type="button"
                  onClick={() => {
                    markAiCoachWelcomeSeen();
                    setShowWelcomeModal(false);
                  }}
                  fullWidth={true}
                  className="mt-2"
                >
                  LET&apos;S CHAT
                </PrimaryButton>

              </div>
            </div>
          </div>
        )}

        <div className="flex-1 mx-auto w-full max-w-6xl rounded-[32px] bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] ring-1 ring-black/5 sm:p-8">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 text-center">
            <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[var(--color-magenta)] via-[var(--color-deep-violet)] to-[var(--color-pumpkin)] text-white shadow-lg shadow-[rgba(188,3,185,0.25)]">
              <Image
                src="/illustrations/em-aicoachv2-half.png"
                alt="Em AI Coach"
                fill
                className="object-cover"
              />
            </div>

            <div className="space-y-3 px-3">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[var(--color-magenta)]">
                AI Coach
              </p>
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
                Hi {displayName}, how can I help you today?
              </h1>
              <p className="mx-auto max-w-2xl text-sm leading-7 text-[rgba(3,3,3,0.7)] sm:text-base">
                {isLoadingPrompts
                  ? "Getting a few ideas ready for you…"
                  : chatLimitReached
                  ? "You've used today's chats with Em."
                  : ONLY_PREDEFINED
                  ? "Pick one of the quick prompts to start a helpful conversation."
                  : "Pick one of the quick prompts to start a helpful conversation, or type your own question below."}
              </p>
            </div>
          </div>

          {!isLoadingPrompts && chatLimitReached ? (
            <div className="mt-8 rounded-[28px] bg-[var(--color-bg-card)] p-6 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient">
                <Clock className="h-[18px] w-[18px] text-white" />
              </div>
              <p className="text-sm font-semibold text-[var(--color-charcoal)]">That&apos;s today&apos;s chats</p>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-6 text-[var(--color-text-muted)]">
                Come back tomorrow for more time with Em.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
              {isLoadingPrompts
                ? Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex w-full animate-pulse items-center gap-3 rounded-3xl border border-[var(--color-magenta)]/10 bg-[var(--color-bg-card)] px-4 py-4"
                    >
                      <span className="h-9 w-9 flex-shrink-0 rounded-xl bg-[var(--color-magenta)]/10" />
                      <span className="h-3 flex-1 rounded-full bg-[var(--color-magenta)]/10" />
                    </div>
                  ))
                : promptOptions.map((prompt, index) => {
                    const TileIcon = TILE_ICONS[index % TILE_ICONS.length];

                    return (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handlePromptClick(prompt)}
                        className="flex w-full items-center gap-3 rounded-3xl border border-[var(--color-magenta)]/15 bg-[linear-gradient(135deg,rgba(74,15,126,0.06)_0%,rgba(188,3,185,0.06)_45%,rgba(242,115,33,0.06)_100%)] px-4 py-4 text-left text-sm text-[var(--color-charcoal)] transition hover:scale-[1.01]"
                      >
                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-gradient">
                          <TileIcon className="h-4 w-4 text-white" />
                        </span>
                        <span>{prompt}</span>
                      </button>
                    );
                  })}
            </div>
          )}

          {!ONLY_PREDEFINED ? (<div className="mt-10 space-y-5">
            <div className="rounded-[28px] bg-[var(--color-bg-card)] p-4 shadow-sm">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`rounded-3xl p-4 ${
                      message.role === "assistant"
                        ? "bg-white text-[var(--color-charcoal)] shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
                        : "bg-[var(--color-magenta)]/10 text-[var(--color-charcoal)] border border-[var(--color-magenta)]/20"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="flex items-start gap-3">
                        <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-[var(--color-magenta)]/10">
                          <Image
                            src="/illustrations/em-aicoachv2-half.png"
                            alt="Em AI Coach"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <p className="text-sm leading-6">{message.text}</p>
                      </div>
                    ) : (
                     <div className="flex items-start gap-3">
                        <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-[var(--color-magenta)]/10">
                          <Image
                            src="/illustrations/user-half.png"
                            alt="user"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <p className="text-sm leading-6">{message.text}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>


              <form onSubmit={handleSend} className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  placeholder="Type your message to Em..."
                  className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-4 text-sm text-[var(--color-charcoal)] outline-none transition focus:border-[var(--color-magenta)] focus:ring-2 focus:ring-[var(--color-magenta)]/20"
                />
                <PrimaryButton type="submit" fullWidth={false} className="min-w-[140px]">
                  Send
                </PrimaryButton>
              </form>
           
          </div>
           ) : null}
        </div>

        {/* Spacer for BottomNav */}
        <div className="h-20" />
      </div>

      {!showWelcomeModal && <BottomNav />}
    </div>
  );
}
