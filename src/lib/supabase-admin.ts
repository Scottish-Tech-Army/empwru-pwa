import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client authenticated with the service role key.
 * Bypasses Row Level Security — never import this from client code, and
 * never expose SUPABASE_SERVICE_ROLE_KEY with a NEXT_PUBLIC_ prefix.
 * Used for operations the anon/publishable key can't do, e.g.
 * `auth.admin.deleteUser`.
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
