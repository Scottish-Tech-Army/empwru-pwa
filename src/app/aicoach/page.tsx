"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { PrimaryButton } from "@/components";
import { useRouter } from "next/navigation";

const PREDEFINED_PROMPTS = [
  "I want to discover what I'm good at",
  "I want to get clear on my goals",
  "I want to take action but feel stuck",
  "I want to discuss an idea",
];

// Toggle this to true to only allow selecting from the predefined prompts
const ONLY_PREDEFINED = true;

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: "assistant",
    text: "Hi Nicola — I’m Em, your AI coach. Choose one of the prompts below or ask me anything to get started.",
  },
];

export default function AiCoachPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const router = useRouter();

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
                  onClick={() => setShowWelcomeModal(false)}
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
                Hi Nicola, how can I help you today?
              </h1>
              <p className="mx-auto max-w-2xl text-sm leading-7 text-[rgba(3,3,3,0.7)] sm:text-base">
                {ONLY_PREDEFINED
                  ? "Pick one of the quick prompts to start a helpful conversation."
                  : "Pick one of the quick prompts to start a helpful conversation, or type your own question below."}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
            {PREDEFINED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handlePromptClick(prompt)}
                className="w-full rounded-[28px] border border-gray-200 bg-white px-5 py-5 text-left text-sm font-semibold text-[var(--color-charcoal)] shadow-sm transition hover:border-[var(--color-magenta)] hover:bg-[var(--color-magenta)]/10"
              >
                {prompt}
              </button>
            ))}
          </div>

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
      </div>
    </div>
  );
}
