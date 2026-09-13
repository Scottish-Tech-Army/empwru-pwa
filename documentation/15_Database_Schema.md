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

An append-only history of the baseline-quiz/"About U checkin" answers and
weekly-reminder preference (`src/lib/baseline.ts` —
`saveBaselineToSupabase`, `loadBaselineForCurrentUser`,
`loadBaselineHistoryForCurrentUser`): one row per *completion*, not one row
per user — retaking the quiz inserts a new row rather than overwriting the
previous one, so the first-ever row is "where you started" and the review
UI can compare it against the latest.

> **Discrepancy worth flagging**: `CLAUDE.md` currently states that baseline
> quiz data "never syncs to Supabase" and stays in localStorage only. The
> code in `src/lib/baseline.ts` contradicts that — it does sync to this
> table. Worth confirming with the team which is actually true in production
> and correcting whichever side is stale.

Confirmed against the live schema (post-migration target — see
`baseline_responses_history_migration.sql`) — this section is exact, not
code-inferred, other than that migration itself. It has a `created_at`
column the app never touches, and instead of one policy per operation it
uses a single `for all` policy (select/insert/update/delete all in one, with
both `using` and `with check`) — simpler than the split-policy style used on
the other tables here, and note it technically permits deleting a baseline
row even though no app code path does that today.

`user_id` used to be the primary key (strictly one row per user); it's now
a plain indexed column since a user can have many completions. Ordering by
`(user_id, completed_at)` is how "latest" (`loadBaselineForCurrentUser`) and
"full history, oldest first" (`loadBaselineHistoryForCurrentUser`) are
told apart — both are the same table, just different `order`/`limit`.

```sql
create table if not exists public.baseline_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  responses jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  reminder_day text,
  reminder_time text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists baseline_responses_user_id_completed_at_idx
  on public.baseline_responses (user_id, completed_at);

alter table public.baseline_responses enable row level security;

create policy "Users can manage their own baseline" on public.baseline_responses
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

---

## `ai_coach_daily_usage`

Backs the AI Coach daily request cap: one combined pool of `AICOACH_DAILY_LIMIT`
(250) requests per user per day, shared across regular chat turns, goal
extraction, and discovery extraction (`src/lib/aicoach-context.ts` —
`checkAndIncrementChatUsage`, `checkAndIncrementGoalExtractUsage`,
`checkAndIncrementDiscoveryExtractUsage`). All three are checked identically
here — allowed as long as the combined total is under the limit — and each
increment call returns how many requests are left (`remaining`).

The "always leave one request free so a conversation can save itself"
reservation is **not** enforced here — it's a client-side decision in the
chat page (`src/app/aicoach/chat/[topic]/[prompt]/page.tsx`), which disables
its own chat-send once `remaining <= 1` unless *that* conversation has
already used "turn this into a goal / discovery notes". This table has no
notion of separate conversations (just aggregate counts), so it genuinely
can't make that call — an earlier, unrelated conversation extracting earlier
today must not silently strip a later conversation's own chance to save
itself, which ruled out enforcing the reservation here. `goal_extract_count`
and `discovery_extract_count` are tracked in separate columns purely so
usage can be told apart by type later — the limit check itself sums all
three against the one shared `AICOACH_DAILY_LIMIT`. One row per user per
calendar day.

```sql
create table if not exists public.ai_coach_daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  chat_count integer not null default 0,
  goal_extract_count integer not null default 0,
  discovery_extract_count integer not null default 0,
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

`discovery_extract_count` was added after the table's initial creation, via:
```sql
alter table public.ai_coach_daily_usage
  add column if not exists discovery_extract_count integer not null default 0;
```
Run directly in the Supabase SQL editor (no migrations folder/CLI in this
repo) — the `create table` above already reflects the column so a fresh
environment gets it from the start.

---

## `checkins`

Backs the weekly check-in wizard and the progress dashboard's "proud of" /
"learning" memories (`src/lib/storage.ts` — `saveCheckIn`,
`syncCheckInToSupabase`, `loadCheckInsFromSupabase`, `toggleCheckInLike`).

Not yet created in the live Supabase project — unlike the tables above, this
one has never been exported from the dashboard, so treat the DDL below as
code-inferred and authoritative for what to create, not a confirmed export.
Follows the same shape as `goals` (multi-row per user, client-generated
`text` id from `generateId()`), since a user accrues many check-ins over
time rather than one aggregate row.

`liked_achievement` / `liked_reflection` are the heart-icon "save this as a
memory" flags shown on the progress page — modeled as columns on the
check-in row itself (1:1 with an existing check-in) rather than a separate
likes table, so there's no possibility of an orphaned reference. Sync is
forward-only: check-ins created before this table existed stay local-only on
whichever device/browser created them and are not backfilled.

```sql
create table if not exists public.checkins (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,
  energy_level integer not null,
  achievements text,
  reflection text,
  steps_completed jsonb not null default '[]'::jsonb,
  liked_achievement boolean not null default false,
  liked_reflection boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists checkins_user_id_idx on public.checkins (user_id);
create index if not exists checkins_created_at_idx on public.checkins (created_at desc);

alter table public.checkins enable row level security;

create policy "Users can view their own checkins"
  on public.checkins for select
  using (auth.uid() = user_id);

create policy "Users can insert their own checkins"
  on public.checkins for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own checkins"
  on public.checkins for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own checkins"
  on public.checkins for delete
  using (auth.uid() = user_id);
```

`date` mirrors `goals.target_date`'s convention of storing a plain ISO-date
string rather than a native `date` column. `steps_completed` holds the
legacy `stepsCompleted`/`milestonesCompleted` string-id array from the
`CheckIn` type — not currently populated by the check-in wizard UI, but kept
so existing local data round-trips through Supabase without loss.

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
