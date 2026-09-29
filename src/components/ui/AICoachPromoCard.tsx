import Image from "next/image";
import Link from "next/link";

/**
 * Promo card nudging users toward the AI Coach chat.
 * Shown on empty states / listing pages (e.g. Goals, Discovery).
 */
export function AICoachPromoCard() {
  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 p-8 flex flex-col items-center text-center gap-4">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-primary">
        AI Coach
      </p>
      <div className="relative w-24 h-24 rounded-full overflow-hidden bg-brand-primary/10">
        <Image
          src="/illustrations/em-aicoachv2-half.png"
          alt="Em, your AI Coach"
          fill
          className="object-cover"
        />
      </div>
      <p className="text-lg text-[var(--color-charcoal)]">
        Not sure where to start? I can help
      </p>
      <Link
        href="/aicoach"
        className="w-full max-w-xs h-14 flex items-center justify-center bg-brand-primary text-white text-sm uppercase tracking-wide rounded-full transition-all duration-150 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]"
      >
        Let&apos;s Chat
      </Link>
    </div>
  );
}
