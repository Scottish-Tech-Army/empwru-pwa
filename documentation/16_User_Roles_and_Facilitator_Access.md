# 16. User Roles & Facilitator Access

## Status of this document

`user_roles` was created by hand in the Supabase SQL editor (same convention
as every other table — see `15_Database_Schema.md`, there's no migration
tooling in this repo). The SQL below is what was actually run, kept here so
a role can be granted, revoked, or re-derived from scratch without digging
through chat history.

## Why this exists

The `/facilitator` page (`src/app/facilitator/page.tsx`) needs two things no
other route in this app needed before: (1) a way to gate a page to a subset
of users, and (2) a way for that subset to read *other* users' data, when
every table's Row Level Security is otherwise locked to
`auth.uid() = user_id`. `user_roles` plus the policies below solve both.

## Role model

One row per user; `role` is overwritten in place to promote or demote
someone — it is **not** a multi-role join table. Three tiers:

| Role | Access |
|---|---|
| `admin` | Full CRUD on every user's data (goals, checkins, baseline responses, discovery data) and every page, including `/facilitator` |
| `facilitator` | Read-only access to every user's data, plus their own pages and `/facilitator` |
| `user` (default) | CRUD on only their own data, access to only their own pages — this is the existing behaviour and needs no row in `user_roles` at all; absence of a row *is* this tier |

`admin`/`facilitator` grant broader **database** access via RLS. They do
**not** currently unlock any admin UI for editing another user's goals or
check-ins — no page in the app accepts a "view/edit as this other user"
parameter yet. Today's only consumer of the elevated read access is the
read-only `/facilitator` overview page.

## Schema

```sql
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('admin', 'facilitator', 'user')),
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

create policy "Users can view their own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);
```

`user_id` is the primary key (not a separate surrogate id), so a person
holds exactly one role at a time — promoting someone is a plain `update`,
not an extra `insert`. The only RLS policy lets a signed-in user see their
*own* row, which is all `src/lib/roles.ts`'s `getCurrentUser()` needs.

## Role-check helper

```sql
create or replace function public.has_role(_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = _role
  )
$$;
```

`security definer` matters here: without it, the `exists (...)` subquery
would run under `user_roles`' own RLS and could recurse/deny unexpectedly.
This is the pattern Supabase's own RBAC guide recommends.

## Policies on content tables

Additive to each table's existing "own rows" policy (Postgres combines
multiple permissive policies with `OR`, so these never replace the
originals — a plain `user` keeps working exactly as before). Repeated
identically for `goals`, `checkins`, `baseline_responses`, and
`discovery_data`; `goals` shown here, swap the table name for the others.

```sql
create policy "Admins and facilitators can view all goals"
  on public.goals for select
  using (public.has_role('admin') or public.has_role('facilitator'));

create policy "Admins can insert any goals"
  on public.goals for insert
  with check (public.has_role('admin'));

create policy "Admins can update any goals"
  on public.goals for update
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy "Admins can delete any goals"
  on public.goals for delete
  using (public.has_role('admin'));
```

`ai_coach_daily_usage` deliberately does **not** get these policies — it's
rate-limit bookkeeping, not reflective content a facilitator needs to
review.

## Seeding and promoting

Seed every current auth user as a plain `'user'` (safe to re-run — existing
rows, including anyone already promoted, are left untouched):

```sql
insert into public.user_roles (user_id, role)
select id, 'user' from auth.users
on conflict (user_id) do nothing;
```

Promote or demote someone (find their `user_id` via
`select id, email from auth.users where email = '...';` if needed):

```sql
update public.user_roles set role = 'admin' where user_id = '<uuid>';
update public.user_roles set role = 'facilitator' where user_id = '<uuid>';
update public.user_roles set role = 'user' where user_id = '<uuid>';
```

## Application code

- `src/lib/roles.ts` — `getCurrentUser()` reads the signed-in user's role via
  the RLS-scoped server client; `hasAnyRole()` checks it against a list.
- `src/app/facilitator/page.tsx` — gates on
  `hasAnyRole(currentUser, ["admin", "facilitator"])`, redirecting to `/`
  otherwise.
- `src/lib/facilitator-data.ts` — `getFacilitatorOverview()` aggregates
  engagement data using the caller's own RLS-scoped client for
  `goals`/`checkins`/`baseline_responses` (genuinely enforced by the
  policies above, not bypassed). The one exception is the alumni list
  itself (`auth.admin.listUsers()`), which still goes through the
  service-role admin client (`src/lib/supabase-admin.ts`) since `auth.users`
  can't carry custom RLS policies — callers must still verify the role
  check above before calling this function, since `listUsers()` has no
  row-level access control of its own.

## Invite-only sign-up

empwrU starts invite-only: admins and facilitators invite participants from
`/facilitator/invite`, and there is no self sign-up. This is meant for the
early stages; open sign-up can be switched back on later (see *Switching
between invite-only and open sign-up* below).

**Flow**

1. A facilitator enters the participant's name and email on
   `/facilitator/invite`. `POST /api/facilitator/invite` re-checks
   `hasAnyRole(["admin", "facilitator"])`, then calls
   `auth.admin.inviteUserByEmail()` through the service-role client with the
   same `first_name` / `last_name` / `display_name` metadata the old sign-up
   form wrote.
2. Supabase emails an invite link to `/auth/confirm?token_hash=…&type=invite`.
   That route handler calls `verifyOtp()` server-side, which sets the session
   cookie, then redirects to `/create-account`. An invalid, used or expired link
   redirects to `/signIn?link=expired`, which explains what to do.
3. `/create-account` ("Create your account") pre-fills the name from the invite.
   It saves the password, any name changes and the
   `account_setup_complete: true` metadata flag with `auth.updateUser()`, then
   hands off to `AppGuard`, which routes the new participant into onboarding.

Following the link signs the participant in before they've chosen a
password. Until the `account_setup_complete` flag is set, `AppGuard` keeps
them on `/create-account` (see `src/lib/invite-status.ts`). Otherwise, leaving
that page or reopening the used link would drop them into onboarding on an
account with no password. Once the flag is set, `/create-account` redirects
away.

While sign-up is invite-only, `/signUp` explains that accounts are by
invitation instead of showing the form, because the onboarding carousel
still ends there.

**Supabase dashboard setup (do this in each project, dev and prod)**

The code alone can't stop self sign-up: the publishable key lets anyone call
`auth.signUp()` directly. Public sign-ups have to be switched off in Supabase:

1. **Authentication → Sign In / Providers →** turn off **Allow new users to
   sign up**. Admin invites still work with this off.
2. **Authentication → Emails → Invite user**, point the link at the confirm
   route instead of the default `{{ .ConfirmationURL }}`:
   ```html
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite">Accept your invite</a>
   ```
   The default link returns the session in the URL fragment (implicit flow),
   which the PKCE-configured browser client rejects.
3. **Authentication → URL Configuration →** make sure **Site URL** is the
   deployed app's URL, because the invite link is built from it.
4. Supabase's built-in email service only sends a few emails an hour. Set up
   custom SMTP (**Authentication → Emails → SMTP Settings**) before inviting a
   cohort.
5. **Authentication → Sign In / Providers → Email →** set **Minimum password
   length** to `8` and **Password requirements** to *lowercase, uppercase,
   digits and symbols*. `src/lib/password-rules.ts` shows these rules as a
   checklist on the create-account and sign-up forms, so if you change them
   here, change that file too.

Invite links expire after the project's **Email OTP Expiration**
(**Authentication → Sign In / Providers → Email**). It defaults to 1 hour,
which is too short for invitees, so set it to the 24-hour maximum (86400
seconds). `INVITE_LINK_HOURS` in `src/lib/invites.ts` must match it, because
it decides when the app labels an invite "Link expired". Inviting an email
that already has an account or an invite returns an error pointing to the
Pending invites list.

**Pending invites and resending**

`/facilitator/invite` lists everyone invited who hasn't finished creating
their account (`invited_at` set, `account_setup_complete` not set). Each row
shows when the invite was last sent and one of three statuses:

- **Waiting**: link not used yet.
- **Link expired**: link not used and past `INVITE_LINK_HOURS`.
- **Opened, not finished**: they followed the link but left before choosing
  a password.

**Resend** calls `POST /api/facilitator/invite/resend`, which re-checks the
role and that the user is still pending, then calls `inviteUserByEmail()`
again. Supabase resends to an existing unconfirmed user with a fresh link,
and refuses a second send to the same address within about a minute.
Supabase won't re-invite a confirmed user, so for **Opened, not finished**
the route deletes that account first (it can't hold any data yet) and
invites again with the same name. If that new invite then fails, the error
says to invite them again from the form.

Pending invitees are left out of the facilitator overview's alumni roster
and totals until they accept, so they don't show as "Gone quiet".

**Switching between invite-only and open sign-up**

`NEXT_PUBLIC_SIGNUP_MODE` (read in `src/lib/signup-mode.ts`) decides what the
app shows:

| Value | `/signUp` shows | Sign-in page link |
| --- | --- | --- |
| `invite`, or not set | "Join by invitation" message | "How to join" |
| `open` | The sign-up form | "Sign up" |

Invites keep working in both modes. Anything other than `open` means
invite-only, so a missing variable never opens up sign-up by accident.

The variable only controls the app's screens. Supabase's **Allow new users
to sign up** setting is what actually allows or blocks sign-ups, so always
change both together.

To open up sign-up:

1. Vercel → project → **Settings → Environment Variables** → set
   `NEXT_PUBLIC_SIGNUP_MODE` to `open` (Production, and Preview if used).
2. **Deployments** → latest deployment → **Redeploy**. `NEXT_PUBLIC_`
   variables are built into the app at deploy time, so the change doesn't
   apply until a redeploy.
3. Supabase → **Authentication → Sign In / Providers** → turn **Allow new
   users to sign up** on.
4. Supabase → **Authentication → Emails → Confirm signup** → point its link
   at `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`,
   which `/auth/confirm` already handles.

To go back to invite-only, reverse steps 1–3. Locally, set the variable in
`.env.local` and restart `npm run dev`.
