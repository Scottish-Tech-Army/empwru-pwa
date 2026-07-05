# App Routes Reference

Complete reference of all routes in the EmpwrU PWA.

---

## Core Navigation

| Route       | Page            | Purpose                                                                     |
| ----------- | --------------- | --------------------------------------------------------------------------- |
| `/`         | Dashboard       | Main home page with momentum, quick stats, focus today, and goals overview  |
| `/goals`    | Goals List      | View all goals (active, paused, completed) with option to create new        |
| `/progress` | Progress        | Visual progress across impact measures, baseline comparisons, energy trends |
| `/checkin`  | Weekly Check-in | 4-step wizard: Energy → Goals → Reflection → Celebration                    |

---

## Goal Management

| Route         | Page        | Purpose                                                                          |
| ------------- | ----------- | -------------------------------------------------------------------------------- |
| `/goals/new`  | Create Goal | Multi-step wizard: Why → Feel → Holding Back → Title → Target Date → Milestones  |
| `/goals/[id]` | Goal Detail | View and manage individual goal, toggle milestones, pause/resume/complete/delete |

---

## Onboarding Flow

| Route                  | Page           | Purpose                                                                      |
| ---------------------- | -------------- | ---------------------------------------------------------------------------- |
| `/onboarding/welcome`  | Welcome        | First impression screen with value proposition                               |
| `/onboarding/baseline` | Baseline Quiz  | 5-section assessment (Situation, Confidence, Aspirations, Skills, Wellbeing) |
| `/onboarding/reminder` | Reminder Setup | Set weekly check-in day and time, then celebrate completion                  |

---

## Development Routes

| Route    | Page       | Purpose                                                                 |
| -------- | ---------- | ----------------------------------------------------------------------- |
| `/reset` | Reset Data | **Dev only** — Clears all localStorage data and redirects to onboarding |

> [!NOTE]
> The `/reset` route is intended for development and testing. It clears all user data including onboarding state, goals, and check-ins.

---

## Route Guards

The app implements automatic route guards:

- **Dashboard** (`/`) — Redirects to `/welcome` if onboarding is not completed
- **All other routes** — No guards; accessible directly for development

---

## File Structure

src/app/
├── page.tsx                    # Dashboard (/)
├── layout.tsx                  # Root layout with fonts
├── globals.css                 # Global styles & CSS variables
├── checkin/                    
│   └── page.tsx                # Weekly check-in wizard
├── welcome/
│   │   └── page.tsx            # Welcome screen 
├── signUp/
│   │   └── page.tsx            # Sign Up screen 
├── signIn/
│   │   └── page.tsx            # Sign In screen               
├── goals/
│   ├── page.tsx                # Goals list
│   ├── new/
│   │   └── page.tsx            # Create goal wizard
│   └── [id]/
│       └── page.tsx            # Goal detail (dynamic)
├── onboarding/
│   ├── welcome/
│   │   └── page.tsx            # Onboarding Welcome screen
│   ├── baseline/
│   │   └── page.tsx            # Baseline quiz
│   └── reminder/
│       └── page.tsx            # Reminder setup + celebration
├── progress/
│   └── page.tsx                # Progress overview
└── reset/
    └── page.tsx                # Dev reset utility
```
