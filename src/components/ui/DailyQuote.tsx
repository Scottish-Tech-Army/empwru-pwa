"use client";

import { useEffect, useState } from "react";

interface Quote {
  q: string; // quote text
  a?: string; // author name (optional)
}

interface CachedQuote {
  quote: Quote;
  date: string; // ISO date string (YYYY-MM-DD)
}

const QUOTE_CACHE_KEY = "empwru_daily_quote";

/**
 * Get today's date as YYYY-MM-DD string
 */
function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * DailyQuote - Displays the daily inspirational quote from ZenQuotes API
 * 
 * Uses the free tier which provides a "quote of the day" that changes at midnight CST.
 * Caches the quote in localStorage for the day to minimize API calls.
 * Includes required attribution per ZenQuotes API terms.
 */
interface DailyQuoteProps {
  className?: string;
  title?: string;
  quote?: string;
  author?: string;
}

export default function DailyQuote({ className = "", title = "Daily Inspiration", quote: propQuote, author: propAuthor }: DailyQuoteProps) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadQuote() {
      // Check if we have props
      if (propQuote) {
        setQuote({ q: propQuote, a: propAuthor});
        setIsLoading(false);
        return;
      }

      const today = getTodayDateString();
      
      // Check localStorage for cached quote
      try {
        const cached = localStorage.getItem(QUOTE_CACHE_KEY);
        if (cached) {
          const parsed: CachedQuote = JSON.parse(cached);
          if (parsed.date === today && parsed.quote) {
            setQuote(parsed.quote);
            setIsLoading(false);
            return; // Use cached quote, no need to fetch
          }
        }
      } catch {
        // Invalid cache, continue to fetch
      }

      // Fetch fresh quote from API
      try {
        const response = await fetch("/api/quote");
        
        if (!response.ok) {
          throw new Error("Failed to fetch quote");
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
          const newQuote = { q: data[0].q, a: data[0].a };
          setQuote(newQuote);
          
          // Cache for today
          const cacheData: CachedQuote = { quote: newQuote, date: today };
          localStorage.setItem(QUOTE_CACHE_KEY, JSON.stringify(cacheData));
        }
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadQuote();
  }, [propQuote, propAuthor]);

  if (isLoading) {
    return (
      <section className={`${className}`}>
        <div className="bg-warm-ivory rounded-2xl py-8 px-12 h-full">
          <div className="animate-pulse flex gap-4">
            <div className="w-8 h-8 bg-white rounded"></div>
            <div className="flex-1">
              <div className="h-4 bg-white rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-white rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !quote) {
    return null; // Gracefully hide if API fails
  }

  return (
    <section className={`flex flex-col h-full ${className}`}>
      <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-[0_0_15px_rgba(0,0,0,0.08)] flex flex-col justify-between relative overflow-hidden h-full">
        <div className="relative z-10">
           <p className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-6">{title}</p>
           <svg className="h-10 w-10 text-brand-primary/10 absolute -top-2 -left-4 -z-10" fill="currentColor" viewBox="0 0 24 24">
             <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.570 9-10.609l.996 2.151c-2.433.917-4.001 3.638-4.001 5.849h4v10h-10z"/>
           </svg>
           <blockquote className="text-2xl md:text-3xl font-sans font-medium text-[var(--color-charcoal)] leading-tight mb-4">
            &ldquo;{quote.q.charAt(0).toUpperCase() + quote.q.slice(1)}&rdquo;
           </blockquote>
           {quote.a && (
             <cite className="text-text-muted not-italic font-medium">— {quote.a}</cite>
           )}
        </div>
        {!propQuote && (
          <p className="text-[10px] text-text-subtle mt-8">
            Powered by{" "}
            <a
              href="https://zenquotes.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-primary transition-colors"
            >
              ZenQuotes API
            </a>
          </p>
        )}
      </div>
    </section>
  );
}

