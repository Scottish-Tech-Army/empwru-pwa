import { NextResponse } from "next/server";
import { getCurrentUser, hasAnyRole } from "@/lib/roles";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Invites a participant by email. empwrU is invite-only — public sign-ups
 * are switched off in Supabase — so this is the only way a new participant
 * account gets created. Supabase sends the invite email; its link lands on
 * /auth/confirm, which signs them in and sends them to /create-account.
 */
export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!hasAnyRole(currentUser, ["admin", "facilitator"])) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    firstName?: unknown;
    lastName?: unknown;
    email?: unknown;
  } | null;

  const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!firstName || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { error: "Please enter a first name and a valid email address." },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdminClient();
  // Same metadata keys the old self sign-up form wrote, so greetings and
  // the facilitator roster read the name the same way for invited users.
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      first_name: firstName,
      last_name: lastName,
      display_name: `${firstName} ${lastName}`.trim(),
    },
  });

  if (error) {
    if (error.code === "email_exists" || /already been registered/i.test(error.message)) {
      return NextResponse.json(
        {
          error:
            "That email address already has an empwrU account or an invite. If they're under Pending invites, use Resend.",
        },
        { status: 409 }
      );
    }
    // Supabase's built-in email only delivers to members of the Supabase
    // organisation; anyone else needs custom SMTP configured.
    if (error.code === "email_address_not_authorized") {
      return NextResponse.json(
        {
          error:
            "Invite emails can't be sent to this address yet. Custom email (SMTP) needs to be set up in Supabase first.",
        },
        { status: 422 }
      );
    }
    if (error.status === 429) {
      return NextResponse.json(
        { error: "Too many invites have been sent in a short time. Please try again later." },
        { status: 429 }
      );
    }
    console.error("Failed to invite participant", error);
    return NextResponse.json({ error: "Couldn't send the invite. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
