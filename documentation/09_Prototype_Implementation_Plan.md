# 09 — Prototype Implementation Plan

## Goal

Ship a privacy‑respecting, installable PWA that delivers a reflection‑first goal flow, a weekly engagement loop, and visual progress tracking — all on a free/low‑cost stack.

## Scope (Phase 1)

- Onboarding (Welcome → Baseline → Category → Reminder)
- Goal creation with reflection‑first flow
- Weekly check-in loop (energy check → progress review → goal updates)
- Dashboard (goals overview, progress, momentum days)
- Local storage only (no server data)
- No accounts, no push notifications (Phase 2)

## Architecture

- **Framework**: Next.js App Router + TypeScript
- **Styling**: Tailwind CSS (or vanilla CSS per project preference)
- **State**: Zustand (or React Context for simplicity)
- **Storage**: localStorage only (simple JSON, no database)
- **Seed data**: Bundled JSON files loaded on first visit
- **Service Worker**: Offline shell + route pre‑cache (Workbox/next-pwa)

## Milestones & Deliverables

### 1. Foundations (Week 1)

- Repo scaffold (Next.js, TS, styling setup)
- PWA: manifest, icons, service worker with push handler
- VAPID keys generation and environment setup
- Routing skeleton: `/onboarding/*`, `/checkin`, `/goals/*`, `/progress`, `/settings`
- `noindex` meta tag for private preview

**Acceptance criteria:**

- App boots locally with PWA manifest present and installable
- Routes render stub screens without errors
- Seed loader hydrates localStorage (verify keys exist)
- Service worker registered with push event handler

---

### 2. Onboarding + Baseline (Week 2)

- Screens: Welcome, Baseline Quiz, Category Selection, Reminder Setup
- Baseline survey: 5 sections, 11 questions (as documented)
- Local state + persistence; happy path navigation
- Web Push subscription flow (request permission, subscribe)
- Serverless push function (`/api/send-push`)
- ICS calendar export as fallback

**Acceptance criteria:**

- User completes 4-screen onboarding in < 2 minutes
- Baseline data saved to localStorage/IndexedDB
- ICS download works

---

### 3. Goal Flow (Week 3)

- `/goals/new`: Reflection exercise → Define goal → Milestones → Actions
- `/goals/:id`: Goal page with "Why" snippets, progress, nudges
- Dashboard integration: Show active goals

**Acceptance criteria:**

- User can create goal with reflection captured
- Goals display on dashboard with progress indicator

---

### 4. Weekly Loop & Celebrations (Week 4)

- Weekly check-in: Energy capture, progress summary
- Celebration screens with micro-interactions
- Momentum days tracking (gentle streaks)
- Re‑engagement UX (soft nudges on return after lapse)

**Acceptance criteria:**

- Weekly check-in flow complete
- Celebrations trigger on milestones
- Momentum tracked correctly

---

### 5. Polish & QA (Week 5)

- Accessibility pass (WCAG AA targets)
- Performance budgets (bundle < 500KB, first paint < 1s)
- Copy tone audit (aligned with Brand Voice)
- Offline testing
- Device testing (iOS Safari, Android Chrome, Desktop)

**Acceptance criteria:**

- Lighthouse PWA score > 90
- Accessibility score > 90
- Works offline

---

## Data Storage

All data stored as simple JSON in localStorage:

| Key                   | Contents                  |
| --------------------- | ------------------------- |
| `empwru:onboarding`   | Onboarding state          |
| `empwru:baseline`     | Baseline survey responses |
| `empwru:category`     | Selected focus area       |
| `empwru:goals`        | User goals array          |
| `empwru:checkins`     | Weekly check-in history   |
| `empwru:preferences`  | Reminder time, settings   |
| `empwru:seed_version` | Seed data version         |

**Privacy**: All local, no PII sent to server.

## Feature Flags

```javascript
const features = {
  ENABLE_PUSH: false, // Phase 2
  ENABLE_ACCOUNTS: false, // Phase 2
  ENABLE_SYNC: false, // Phase 2
};
```

## Risks & Mitigations

| Risk                       | Mitigation                                              |
| -------------------------- | ------------------------------------------------------- |
| Engagement without push    | ICS calendar, in‑app nudges, momentum days              |
| Scope creep                | Strict Phase 1 scope, defer advanced features           |
| Performance on low devices | Pre‑cache routes, reduce motion, small bundles          |
| Data loss on clear         | Warn user before destructive actions; Phase 2 adds sync |

## Success Criteria (Phase 1)

- Onboarding completion: ≥ 85% (4 screens)
- Time to first goal: ≤ 2 minutes
- Weekly milestone reach by week 2: ≥ 25%
- 7-day retention: ≥ 35%
- Lighthouse PWA score: > 90
