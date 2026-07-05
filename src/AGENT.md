# Agent Guide for src/

## Context

Source code directory for the EmpwrU PWA. Contains all TypeScript/React code including pages, components, utilities, and application logic.

**Type**: Next.js App Router application source

## Key Documentation

> **Reference these on every build:**

| Document                                                                                                      | Purpose                         |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| [Design System](file:///Users/boopster/Projects/empwru-app/documentation/10_Design_System_and_Decisions.md)   | Colours, typography, CSS tokens |
| [UI Spec & Components](file:///Users/boopster/Projects/empwru-app/documentation/02_UI_Spec_and_Components.md) | Component patterns, layouts     |
| [Brand Voice](file:///Users/boopster/Projects/empwru-app/documentation/13_Brand_Voice.md)                     | User-facing copy guidelines     |

## Structure & Navigation

```
src/
├── app/           # Next.js App Router pages and layouts (see app/AGENT.md)
│   ├── layout.tsx # Root layout (metadata, fonts, global providers)
│   ├── page.tsx   # Dashboard (/)
│   ├── globals.css # Global CSS with design tokens
│   ├── onboarding/ # Onboarding flow
│   ├── goals/      # Goal management
│   ├── checkin/    # Weekly check-in
│   └── progress/   # Progress dashboard
├── components/    # Shared React components (see components/AGENT.md)
│   ├── layouts/   # Full-screen and card layouts
│   └── ui/        # Reusable UI primitives
└── lib/           # Utilities, storage helpers (see lib/AGENT.md)
    └── storage.ts # localStorage persistence
```

**Entry points**:

- `app/layout.tsx` — Root layout wrapping all pages
- `app/page.tsx` — Dashboard

## Development Workflow

### Adding New Pages

1. Create folder in `app/` matching the route (e.g., `app/goals/page.tsx` for `/goals`)
2. Check [UI Spec](file:///Users/boopster/Projects/empwru-app/documentation/02_UI_Spec_and_Components.md) for layout patterns
3. Apply [Brand Voice](file:///Users/boopster/Projects/empwru-app/documentation/13_Brand_Voice.md) to copy
4. Use lowercase with hyphens for routes
5. Each route needs a `page.tsx` file

### Adding Components

1. Create in `components/` under `layouts/` or `ui/`
2. Use PascalCase for component files
3. Co-locate tests as `ComponentName.test.tsx`

### Testing

- **Test Location**: Co-located with source files (`*.test.tsx`)
- **Run tests**: `npm test` (after adding testing framework)

## Dependencies

- Consumes config from root (`next.config.ts`, `tsconfig.json`, `postcss.config.mjs`)
- Uses Tailwind CSS for styling with custom design tokens
- All data stored in localStorage (no server dependencies)

## Configuration

No environment variables required for Phase 1 (localStorage-only).
