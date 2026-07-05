# 05 — Security, Privacy & Accessibility

## Privacy & Data (Phase 1)

### Client-Side Only

All user data is stored locally on the user's device:

| Data               | Storage      | Sensitivity |
| ------------------ | ------------ | ----------- |
| Onboarding state   | localStorage | Low         |
| Baseline responses | IndexedDB    | Medium      |
| Goals & progress   | IndexedDB    | Medium      |
| Preferences        | localStorage | Low         |

**No server-side data collection** in Phase 1.

### Privacy Principles

- **Data stays on device** — Nothing leaves the browser
- **No tracking** — No analytics beyond basic page views (if any)
- **No cookies** — Session-based, no persistent identifiers
- **User control** — Clear data anytime via browser settings
- **Transparent** — Explain what's stored in a simple privacy notice

### Privacy Notice (In-App)

```
Your data stays on your device.
We don't collect or store any personal information.
Clear your browser data anytime to start fresh.
```

---

## Access Model (Phase 1)

### Public Preview

- **No authentication** — Session-based access
- **`noindex` meta tag** — Hidden from search engines
- **Private URL** — Share link only with preview users

### Phase 2 Considerations

- User accounts (email magic link or OAuth)
- Data sync across devices
- Proper authentication and authorization

---

## Security (Phase 1)

### Client-Side Security

- **HTTPS only** — Enforced by hosting provider
- **Content Security Policy** — Restrict script sources
- **No sensitive data** — Nothing valuable to steal

### Input Validation

- Sanitize all user input before storage
- Validate data structure before rendering
- Prevent XSS via framework defaults (React escapes by default)

### Phase 2 Considerations

- API authentication
- Rate limiting
- Data encryption at rest
- Proper backup and recovery

---

## Accessibility

### WCAG 2.1 AA Compliance

#### Perceivable

- **Colour contrast**: 4.5:1 minimum for normal text, 3:1 for large text
- **Text alternatives**: Alt text for all images
- **Responsive text**: Support user font size preferences (no fixed px)

#### Operable

- **Touch targets**: 44px minimum (48px preferred)
- **Keyboard navigation**: All interactive elements focusable
- **Focus indicators**: Visible, high-contrast focus rings
- **No keyboard traps**: Easy to navigate in/out of components

#### Understandable

- **Simple language**: Clear, jargon-free copy (aligned with Brand Voice)
- **Consistent navigation**: Same patterns throughout
- **Error prevention**: Confirm destructive actions, clear error messages

#### Robust

- **Semantic HTML**: Proper heading hierarchy, landmarks, labels
- **ARIA labels**: Where semantic HTML isn't sufficient
- **Screen reader tested**: VoiceOver (iOS/Mac), TalkBack (Android)

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### High Contrast

- Support `prefers-contrast: more` where possible
- Ensure UI works with inverted colours

### Testing Checklist

- [ ] Lighthouse accessibility score > 90
- [ ] Keyboard-only navigation works
- [ ] VoiceOver/TalkBack tested on key flows
- [ ] Colour contrast verified (use WebAIM checker)
- [ ] Touch targets measured (44px+)
- [ ] Reduced motion preference respected
