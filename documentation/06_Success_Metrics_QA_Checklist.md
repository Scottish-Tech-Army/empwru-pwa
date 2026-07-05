# 06 — Success Metrics & QA Checklist

## Prototype KPIs

### Onboarding & Activation

| Metric                                | Target      |
| ------------------------------------- | ----------- |
| Onboarding completion (4 screens)     | ≥ 85%       |
| Median time install → first task      | ≤ 2 minutes |
| Reminder setup rate (morning/evening) | ≥ 60%       |

### Engagement & Retention

| Metric                                            | Target   |
| ------------------------------------------------- | -------- |
| 7-day retention (completed 7 consecutive days)    | ≥ 35%    |
| Weekly milestone reach by week 2                  | ≥ 25%    |
| Median streak length in first 14 days             | ≥ 5 days |
| Re-engagement after lapse (restart within 7 days) | ≥ 20%    |

### Outcome

| Metric                                          | Target            |
| ----------------------------------------------- | ----------------- |
| Self-report "more confident" at 4-week check-in | ≥ 70% (aggregate) |

---

## QA Checklist (Lightweight)

### Device Testing

- [ ] iOS Safari (iPhone)
- [ ] Android Chrome
- [ ] Desktop Chrome
- [ ] Desktop Safari

### Happy Path

- [ ] Onboarding: Welcome → Baseline quiz → Category selection → Reminder setup
- [ ] First experience: Complete first task, see celebration
- [ ] Weekly check-in: Energy check, progress summary
- [ ] Goal setting: Reflection → Define goal → Milestones → Daily actions
- [ ] Progress view: See baseline vs current across impact measures

### Edge Cases

- [ ] Offline: App loads with cached content
- [ ] Refresh: State persists after page reload
- [ ] Long text entries: Goal descriptions, reflections
- [ ] Clear data: Fresh start works correctly

### PWA Checks

- [ ] Install prompt appears
- [ ] App icon on home screen works
- [ ] Standalone mode (no browser UI)
- [ ] Offline indicator shows when disconnected

### Accessibility Checks

- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader announces key elements
- [ ] Touch targets ≥ 44px

---

## Feedback Collection

### In-App

- Quick rating (1-5 stars or emoji)
- Optional free text: "What could be better?"
- Shown after week 1 and week 4

### User Research

- Short debrief interviews with 5-10 preview users
- Focus: Onboarding clarity, goal-setting flow, motivation impact
- Collect at 2-week and 4-week marks
