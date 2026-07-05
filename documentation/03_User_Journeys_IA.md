# 02 — Journeys & IA (Native Mobile PWA)

## Design Principle: Single-Purpose Screens

Each screen serves one clear purpose. No cognitive overload, no decision paralysis. Users always know what to do next.

---

## Information Architecture

```
empwrU PWA
│
├── /onboarding/
│   ├── /welcome        → Screen 1: Value proposition
│   ├── /baseline       → Screen 2: Baseline quiz (impact measures)
│   ├── /focus          → Screen 3: Category selection
│   └── /reminder       → Screen 4: Reminder setup
│
├── /checkin            → Daily check-in (main loop)
│
├── /dashboard          → Home: Progress overview & today's focus
│
├── /goals/
│   ├── /[id]           → Goal detail view
│   ├── /new            → Create new goal (reflection-first)
│   └── /reflect        → Reflection exercise
│
├── /progress           → Visual progress across impact measures
│
├── /resources          → Contextual templates & guides
│
└── /settings           → Preferences, reminders, about
```

---

## Primary User Journeys

### Journey 1: First-Time User (Install → First Task)

**Target:** Complete in ≤ 2 minutes

```
Install PWA
    ↓
Welcome Screen (5 sec) — Value prop, single CTA
    ↓
Baseline Quiz (45 sec) — 4-5 single-tap questions
    ↓
Category Selection (10 sec) — Choose focus area, auto-advance
    ↓
Reminder Setup (20 sec) — Pick morning or evening
    ↓
First Check-in (30 sec) — Simplified first task, celebration
    ↓
Dashboard — See progress, tomorrow preview
```

**Success Criteria:**

- 85%+ onboarding completion
- Median time ≤ 2 minutes
- First task completed same session

---

### Journey 2: Weekly Engagement Loop

**Target:** 5-10 minutes per session

```
Weekly reminder notification / App open
    ↓
Weekly Check-in Screen
    ├── Energy check: "How's your energy this week?"
    └── Progress summary since last check-in
    ↓
Review goals — Update progress on milestones
    ↓
Plan next week — Set intentions
    ↓
Celebration — Acknowledge wins
```

**Success Criteria:**

- 60%+ reminder setup rate
- 35%+ 7-day retention
- Weekly milestone reach by week 2: ≥ 25%

---

### Journey 3: Goal Setting (Reflection-First)

**Target:** Create meaningful, actionable goals

**Principles:**

- Goals are **user-generated** — in their own words
- Educate the user on how to set effective goals (SMART tips)
- Goals get broken down into milestones with linked dates
- Each goal has an action plan

```
Dashboard → "Set a new goal"
    ↓
Reflection Exercise
    ├── "Why does this matter to you?"
    ├── "How will you feel when you achieve it?"
    └── "What's holding you back?"
    ↓
Define Goal — Clear, specific outcome (user's own words)
    ↓
Break into Milestones — Weekly checkpoints with dates
    ↓
Daily Actions — Small, achievable steps (Tiny Steps)
    ↓
Confirm & Start — Add to dashboard
```

**Success Criteria:**

- Goals have clear "why" captured
- 25%+ reach weekly milestone by week 2

---

### Journey 4: Progress Review

**Target:** Visual motivation and confidence building

```
Dashboard → "View progress"
    ↓
Impact Measures Overview
    ├── Current Situation
    ├── Confidence & Self-Esteem
    ├── Aspirations for the Future
    ├── Skills, Learning & Progression
    └── Wellbeing & Balance
    ↓
Compare to Baseline — Show growth
    ↓
Celebrate wins — Motivational nudges
```

**Success Criteria:**

- 70%+ self-report "more confident" at 4-week check-in

---

### Journey 5: Re-engagement (After Lapse)

**Target:** Gentle return, no guilt

```
App open after 2+ days away
    ↓
Warm welcome back — No shame, encouragement
    ↓
Quick reflection — "What got in the way?"
    ↓
Reset streak OR continue — User choice
    ↓
Easy first task — Rebuild momentum
```

**Success Criteria:**

- 20%+ restart within 7 days of lapse

---

## Screen Inventory

| Screen             | Purpose              | Key Actions                |
| ------------------ | -------------------- | -------------------------- |
| Welcome            | Communicate value    | Tap "Get started"          |
| Baseline Quiz      | Gauge starting point | Answer 4-5 questions       |
| Category Selection | Personalize focus    | Select one category        |
| Reminder Setup     | Establish habit time | Choose morning/evening     |
| Dashboard          | Home base, progress  | View goals, start check-in |
| Check-in           | Daily engagement     | Complete tasks, reflect    |
| Goal Detail        | View/edit goal       | Mark progress, adjust      |
| New Goal           | Create goal          | Reflection → definition    |
| Progress           | Visualise growth     | View impact measures       |
| Resources          | Templates & guides   | Browse, download           |
| Settings           | Preferences          | Adjust reminders, etc.     |

---

## Navigation Patterns

### Primary Navigation

- **Bottom tab bar** (3-4 items max): Dashboard, Goals, Progress, Settings
- **Always visible** on main screens
- **Hidden** during focused flows (onboarding, check-in)

### Secondary Navigation

- **Back arrow** for drill-down screens
- **Close (X)** for modals and overlays
- **Swipe gestures** for card interactions

### Deep Linking

- `/checkin` — Direct to daily check-in (from reminders)
- `/goals/[id]` — Direct to specific goal
- `/progress` — Direct to progress view

---

## Offline Behaviour

All core journeys work offline:

- Onboarding data stored locally first
- Check-ins saved, synced when online
- Progress viewable from local state
- Graceful sync indicators (not blocking)
