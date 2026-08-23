# 15. Database Schema (Supabase)

## Status of this document

There is no migration tooling in this repo (no `supabase/migrations`, no
tracked `.sql` files) — every table below already exists in the live
Supabase project and was created by hand through the Supabase dashboard.
All four tables (`goals`, `discovery_data`, `baseline_responses`,
`ai_coach_daily_usage`) have been confirmed against SQL exported directly
from the dashboard, so the `CREATE TABLE` / `CREATE POLICY` statements here
are exact, not reconstructed from app code.

If a table is altered in the dashboard in future, this doc will drift out of
date silently — there's nothing enforcing that it stays in sync. Re-export
and re-check periodically, or move to tracked migrations if that drift risk
becomes a real problem.

All tables use Supabase's built-in `auth.users` for identity — every table
has a `user_id uuid references auth.users(id)` column, and Row Level Security
is enabled everywhere so a user can only ever read/write their own rows.

---

## `goals`

Backs the SMART-goal creation wizard and goal detail/list views
(`src/lib/storage.ts` — `createGoal`, `updateGoal`, `deleteGoal`,
`loadGoalsFromSupabase`, `getGoalById`).

Note: `id` is **not** a Postgres `uuid` — goal ids are generated client-side
by `generateId()` (`${Date.now()}-${random}`), so the column must be `text`.

Confirmed against the live schema — this section is exact, not code-inferred.
A few things the code usage alone couldn't have told us: `why_matters` is
`not null` (the code always supplies it), `target_date` is `text` rather
than a native `date` (goal target dates are stored as plain ISO-date
strings, not parsed), `feel_when_done` has a default but no `not null`
constraint, and there are two indexes supporting the common query patterns
(`eq("user_id", ...)` and `order("created_at", ...)`). The `pgcrypto`
extension is enabled but nothing in this table actually calls a
`gen_random_uuid()`-style function — likely a leftover from an earlier
design, not something current code depends on.

```sql
create extension if not exists pgcrypto;

create table if not exists public.goals (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null,
  why_matters text not null,
  success_criteria text,
  confidence integer,
  target_date text,
  feel_when_done text default '',
  holding_back text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'active',
  steps jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb
);

create index if not exists goals_user_id_idx on public.goals (user_id);
create index if not exists goals_created_at_idx on public.goals (created_at desc);

alter table public.goals enable row level security;

create policy "Users can view their own goals"
  on public.goals for select
  using (auth.uid() = user_id);

create policy "Users can insert their own goals"
  on public.goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own goals"
  on public.goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own goals"
  on public.goals for delete
  using (auth.uid() = user_id);
```

`category` is a free-text column but the app only ever writes one of:
`Wellbeing`, `Career`, `Finance`, `Skills, Education & Learning`,
`Relationships`, `other` (see `GoalCategory` in `src/lib/storage.ts`).

---

## `discovery_data`

One row per user holding their Discovery answers (skills/qualities/values/
interests) as JSON (`src/lib/storage.ts` — `syncDiscoveryDataToSupabase`,
`loadDiscoveryDataFromSupabase`). Read server-side by the AI Coach context
builder (`src/lib/aicoach-context.ts`).

Confirmed against the live schema (exported from the Supabase dashboard) —
this section is exact, not code-inferred. It has a `created_at` column and a
`delete` policy that the app code never touches, and the `update` policy
carries a `with check` in addition to `using` (blocks a user from
reassigning `user_id` on update, not just filtering which rows they can see).

```sql
create table if not exists public.discovery_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.discovery_data enable row level security;

create policy "Users can view their own discovery data"
  on public.discovery_data for select
  using (auth.uid() = user_id);

create policy "Users can insert their own discovery data"
  on public.discovery_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own discovery data"
  on public.discovery_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own discovery data"
  on public.discovery_data for delete
  using (auth.uid() = user_id);
```

`payload` shape (see `DiscoveryData` in `src/lib/storage.ts`):
`{ skills?: string[], qualities?: string[], values?: string[], interests?: string[], updatedAt: string }`.

---

## `baseline_responses`

One row per user holding their onboarding baseline-quiz answers and
weekly-reminder preference (`src/lib/baseline.ts` —
`saveBaselineToSupabase`, `loadBaselineForCurrentUser`).

> **Discrepancy worth flagging**: `CLAUDE.md` currently states that baseline
> quiz data "never syncs to Supabase" and stays in localStorage only. The
> code in `src/lib/baseline.ts` contradicts that — it does sync to this
> table. Worth confirming with the team which is actually true in production
> and correcting whichever side is stale.

Confirmed against the live schema — this section is exact, not code-inferred.
It has a `created_at` column the app never touches, and instead of one
policy per operation it uses a single `for all` policy (select/insert/
update/delete all in one, with both `using` and `with check`) — simpler than
the split-policy style used on the other tables here, and note it technically
permits deleting a baseline row even though no app code path does that today.

```sql
create table if not exists public.baseline_responses (
  user_id uuid primary key references auth.users(id) on delete cascade,
  responses jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  reminder_day text,
  reminder_time text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.baseline_responses enable row level security;

create policy "Users can manage their own baseline" on public.baseline_responses
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

---

## `ai_coach_daily_usage`

Backs the AI Coach daily request cap: 4 regular chat turns + 1 reserved
"turn this into a goal" extraction per user per day
(`src/lib/aicoach-context.ts` — `checkAndIncrementChatUsage`,
`checkAndIncrementGoalExtractUsage`). One row per user per calendar day.

```sql
create table if not exists public.ai_coach_daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  chat_count integer not null default 0,
  goal_extract_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

alter table public.ai_coach_daily_usage enable row level security;

create policy "Users can read their own AI Coach usage"
  on public.ai_coach_daily_usage for select
  using (auth.uid() = user_id);

create policy "Users can insert their own AI Coach usage"
  on public.ai_coach_daily_usage for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own AI Coach usage"
  on public.ai_coach_daily_usage for update
  using (auth.uid() = user_id);
```

`chat_count` resets implicitly every day since the row is keyed by
`usage_date` — there's no cron/cleanup job, old rows are simply never read
again. Consider a periodic delete of rows older than N days if table size
ever becomes a concern.

---

## Adding a new table

Follow the same shape as above for anything new:

1. `user_id uuid references auth.users(id) on delete cascade` on every table.
2. `alter table ... enable row level security;` — never skip this.
3. One policy per operation the app actually performs (`select`/`insert`/
   `update`/`delete`), each scoped to `auth.uid() = user_id`.
4. Match `src/lib/storage.ts`'s existing three-part pattern (local get/save,
   `syncXToSupabase`, `loadXFromSupabase`) documented in `CLAUDE.md`, rather
   than introducing a different persistence pattern.
