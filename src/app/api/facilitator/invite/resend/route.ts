import { NextResponse } from "next/server";
import { getCurrentUser, hasAnyRole } from "@/lib/roles";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { isPendingInvite } from "@/lib/invite-status";

/**
 * Re-sends the invite email to someone who hasn't finished joining, with a
 * fresh link. Supabase's invite call resends for an existing user as long
 * as they haven't confirmed, so usually this is the same call as the first
 * invite.
 */
export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!hasAnyRole(currentUser, ["admin", "facilitator"])) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { userId?: unknown } | null;
  const userId = typeof body?.userId === "string" ? body.userId : "";
  if (!userId) {
    return NextResponse.json({ error: "Missing invite." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error: lookupError } = await admin.auth.admin.getUserById(userId);
  if (lookupError || !data.user?.email) {
    return NextResponse.json({ error: "That invite no longer exists." }, { status: 404 });
  }
  if (!isPendingInvite(data.user)) {
    return NextResponse.json(
      { error: "This person has already accepted their invite." },
      { status: 409 }
    );
  }

  const { email, user_metadata: metadata } = data.user;

  // Supabase only re-invites users whose email isn't confirmed yet. Someone
  // who followed their link but never chose a password is confirmed, so
  // their account (which can't hold any data yet — AppGuard keeps them on
  // /create-account) is removed and invited afresh with the same name.
  if (data.user.email_confirmed_at) {
    const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);
    if (deleteError) {
      console.error("Failed to reset unfinished invite", deleteError);
      return NextResponse.json({ error: "Couldn't resend the invite. Please try again." }, { status: 500 });
    }
  }

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      first_name: metadata?.first_name,
      last_name: metadata?.last_name,
      display_name: metadata?.display_name,
    },
  });
  if (error) {
    let message = "Couldn't resend the invite. Please try again.";
    let status = 500;
    if (error.code === "email_address_not_authorized") {
      message =
        "Invite emails can't be sent to this address yet. Custom email (SMTP) needs to be set up in Supabase first.";
      status = 422;
    } else if (error.status === 429) {
      message = "An invite was sent to this email very recently. Please wait a minute and try again.";
      status = 429;
    } else {
      console.error("Failed to resend invite", error);
    }
    // The unfinished account was already removed above, so they're no longer
    // in the list — say how to invite them again.
    if (data.user.email_confirmed_at) {
      message = `${message} Their old invite has been cleared, so please invite them again using the form above.`;
    }
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({ success: true });
}
