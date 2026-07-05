# Agent Guide for src/app/

## Context

Next.js App Router directory. Contains all pages, layouts, and route handlers for the PWA.

**Type**: Next.js 14+ App Router pages

## Key Documentation

> **Check these before building screens:**

| Document                                                                                                      | Purpose                             |
| ------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| [Design System](file:///Users/boopster/Projects/empwru-app/documentation/10_Design_System_and_Decisions.md)   | Colours, spacing, cards, CSS tokens |
| [UI Spec & Components](file:///Users/boopster/Projects/empwru-app/documentation/02_UI_Spec_and_Components.md) | Screen layouts, micro-interactions  |
| [Brand Voice](file:///Users/boopster/Projects/empwru-app/documentation/13_Brand_Voice.md)                     | User-facing copy guidelines         |
| [Onboarding](file:///Users/boopster/Projects/empwru-app/documentation/08_Onboarding.md)                       | Onboarding flow details             |

## Structure & Navigation

```
app/
├── layout.tsx     # Root layout (html, body, fonts, metadata)
├── page.tsx       # Home page (/)
├── globals.css    # Tailwind base + global styles
├── favicon.ico    # App favicon
├── onboarding/    # /onboarding/*
├── goals/         # /goals/*
├── checkin/       # /checkin
├── progress/      # /progress
└── reset/         # /reset (dev utility)
```

## Development Workflow

### Adding a New Route

1. Create folder matching URL path (e.g., `app/goals/page.tsx` → `/goals`)
2. Check [UI Spec](file:///Users/boopster/Projects/empwru-app/documentation/02_UI_Spec_and_Components.md) for screen layout patterns
3. Apply [Brand Voice](file:///Users/boopster/Projects/empwru-app/documentation/13_Brand_Voice.md) to all user-facing copy
4. Add `page.tsx` for the route content
5. Optional: `layout.tsx` for route-specific layouts
6. Optional: `loading.tsx` for loading states

### Route List

| Route           | Purpose                               |
| --------------- | ------------------------------------- |
| `/onboarding/*` | Welcome, Baseline, Category, Reminder |
| `/checkin`      | Weekly energy check + progress review |
| `/goals/*`      | Goal creation and management          |
| `/progress`     | Dashboard with momentum tracking      |
| `/settings`     | Preferences, reminder time            |
| `/reset`        | Dev utility to clear localStorage     |

### Testing

- Component tests should be co-located in `__tests__/` or as `*.test.tsx`

## Dependencies

- `next/image` for optimized images
- `next/font` for font optimization (Geist in layout.tsx)
- Tailwind CSS for styling
- Components from `src/components/`

## Maintenance

- Keep `layout.tsx` minimal — extract providers to `lib/`
- Use route groups `(group)` for shared layouts without URL segments
- Add `noindex` meta tag for private preview (in layout.tsx metadata)
