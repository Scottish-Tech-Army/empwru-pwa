import { NextResponse } from "next/server";

/**
 * API Route to proxy ZenQuotes requests
 * 
 * ZenQuotes requires an API key for CORS headers, so we proxy
 * through our own API route to avoid browser CORS restrictions.
 * 
 * Uses no-store to avoid stale caching on Vercel edge. The client-side
 * component (DailyQuote) handles caching in localStorage by date.
 */
export async function GET() {
  try {
    // Fetch fresh quote - no server-side caching to ensure daily updates work
    const response = await fetch("https://zenquotes.io/api/today", {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch quote" },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Return with short cache headers - client handles daily caching
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch quote" },
      { status: 500 }
    );
  }
}
