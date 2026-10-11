import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Roles that are actually stored in `user_roles`. Plain "user" is never
 * stored — it's the default for anyone with no row there.
 */
export type AppRole = "admin" | "facilitator";

export interface CurrentUser {
  id: string;
  email: string;
  roles: AppRole[];
}

/**
 * The signed-in user plus whichever privileged roles they hold. Reads
 * through the RLS-scoped server client — `user_roles`' select policy only
 * ever returns the caller's own rows, which is exactly what's needed here.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);

  const roles = (data ?? []).map((row) => row.role as AppRole);

  return { id: user.id, email: user.email ?? "", roles };
}

export function hasAnyRole(user: CurrentUser | null, roles: AppRole[]): boolean {
  if (!user) return false;
  return roles.some((role) => user.roles.includes(role));
}
