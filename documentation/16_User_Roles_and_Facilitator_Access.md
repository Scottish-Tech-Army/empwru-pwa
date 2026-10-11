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
