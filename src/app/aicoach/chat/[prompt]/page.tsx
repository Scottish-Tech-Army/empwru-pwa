"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components";

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
};

export default function ChatPage({ params }: { params: { prompt: string } }) {
  const router = useRouter();
  const decodedPrompt = decodeURIComponent(params.prompt || "");

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: `Hi Nicola — I’m Em, your AI coach. I can help you with your choice` },
    { role: "user", text: "I want to take action but feel stuck" },
    {
      role: "assistant",
      text: "Great — tell me more about what you want to achieve, and I’ll help you shape the next step.",
    },
  ]);

  const [inputValue, setInputValue] = useState("");

  const addMessage = (m: ChatMessage) => setMessages((cur) => [...cur, m]);

  const handleSend = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    addMessage({ role: "user", text: trimmed });
    setInputValue("");

    // fake assistant reply for prototype
    setTimeout(() => {
      addMessage({
        role: "assistant",
        text: "Thanks — I’m thinking through that now. Here’s a practical next step: try breaking the task into one small action you can do today.",
      });
    }, 300);
  };

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

                return (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex w-full ${isAssistant ? "justify-start" : "justify-end"}`}
                  >
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
                );
              })}
            </div>
          </div>
        </div>

        <form onSubmit={handleSend} className="mt-6 space-y-4">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message to Em..."
            className="w-full rounded-full border border-gray-200 bg-white px-5 py-4 text-sm text-[var(--color-charcoal)] outline-none transition focus:border-[var(--color-magenta)] focus:ring-2 focus:ring-[var(--color-magenta)]/20"
          />
          <PrimaryButton type="submit" fullWidth={true} className="w-full rounded-full py-4 text-base">
            Send
          </PrimaryButton>
        </form>
      </div>
    </div>
  );
}
