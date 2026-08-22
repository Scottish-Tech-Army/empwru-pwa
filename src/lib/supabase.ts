import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser client — persists the session in cookies (not just localStorage)
 * so server-side code (API routes, middleware) can read the same session.
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);