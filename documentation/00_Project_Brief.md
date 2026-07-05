# 00 — Project Brief

**Organisation:** EmpwrU Scotland  
**Programme:** Empowering Women (post-programme support)  
**Project Title:** Coaching & Goal-Setting PWA Prototype  
**Prepared by:** Becky Still  
**Date:** 12-01-2026

## 1. Problem & Opportunity

- Alumni often lose momentum after programmes end: time‑poor, demotivated, and unsure of next steps. Guidance is scattered across documents and apps, and most tools feel heavy or generic. EmpwrU needs a simple, mobile‑first (PWA) way to turn coaching into daily action while respecting privacy and cost constraints.
- Opportunity: a lightweight PWA that guides reflection‑first goal setting — all free/low‑cost to run.

## 2. Objectives (ranked)

1. Guide users through a full goal→action journey (reflection-first)
2. Ongoing, bite-size guidance (employability and broader life goals)
3. Low/zero-cost hosting, simple ops, privacy-respecting; defer community to later

## 3. Target Users

- **Primary:** Alumni and broader users seeking progress across life areas; mobile-first

## 4. Success Signals (prototype)

- Onboarding completion (4 screens): ≥ 85%
- Median time install → first task: ≤ 2 minutes
- Reminder setup rate (morning/evening): ≥ 60%
- 7‑day retention (completed 7 consecutive days): ≥ 35%
- Weekly milestone reach by week 2: ≥ 25%
- Median streak length in first 14 days: ≥ 5 days
- Re‑engagement after lapse (restart within 7 days): ≥ 20%
- Qualitative: ≥ 70% self‑report "more confident" at 4‑week check‑in (aggregate only)

## 5. Out of Scope (prototype)

- Production auth/SSO; PII storage; complex analytics; payments; community features; AI-powered prompts; admin/coach features

## 6. Constraints & Assumptions

- UK context; offline-first where possible; free/low-cost hosting
- Session-based access (no registration required for prototype)
- Private preview only; add `noindex` meta tag

## 7. Notifications & Reminders

- Web Push notifications for weekly check-in reminders (VAPID-based, serverless)
- ICS calendar export as fallback for users who decline push permission
- In-app nudges when app is opened after lapse

## 8. Impact Measures

- Current Situation
- Confidence & Self-Esteem
- Aspirations for the Future
- Skills, Learning & Progression
- Wellbeing & Balance

## 9. Experience & Design Ethos

- Inspirational, motivating, empowering; we prompt and guide, never dictate
- Clean, Notion-like clarity but laser-focused on goals and progress
- Reflection-first flow: capture "why" and value before planning actions
- Visual prompts (vision-board style), motivational nudges, progress markers

## 10. Onboarding & Baseline

- Short baseline quiz to gauge starting point across the impact measures
- Use baseline to personalise nudges and show progress across life areas over time

## 11. Resources Approach

- Start with contextual templates/guides (free). For CV/cover letters and detailed resources, enable coach support and consider a paid document area later.

## 12. Stakeholders & Decision Making

- Product Owner & Content: Nicola Melvin
- Tech Lead: Becky Still
- Review cadence: Daily Checkin; Weekly review

## 13. Approvals

- [ ] Brief approved by client
