# Agent Guide for empwru-app

## Context

EmpwrU PWA — a privacy-respecting, mobile-first Progressive Web App for coaching and goal-setting. Designed to help EmpwrU Scotland alumni maintain momentum after programmes end through reflection-first goal flows, weekly engagement loops, and visual progress tracking.

**Type**: Web Application (PWA)  
**Stage**: Early documentation / pre-development  
**Stack**: Next.js App Router, TypeScript, Tailwind CSS, localStorage-only

## Structure & Navigation

```
empwru-app/
├── .agent/              # Agent configuration and rules
│   └── rules/           # Always-on agent rules and templates
├── docs/                # System-level documentation (includes AGENT.md overview)
├── documentation/       # Product specs and design documents (14 files)
├── public/              # Static assets (SVGs, favicons)
├── src/                 # Source code (see src/AGENT.md)
│   └── app/             # Next.js App Router pages (see src/app/AGENT.md)
├── AGENT.md             # This file (root context)
├── package.json         # Dependencies and scripts
├── next.config.ts       # Next.js configuration
├── tsconfig.json        # TypeScript configuration
├── postcss.config.mjs   # PostCSS/Tailwind configuration
└── tailwind.config.ts   # Tailwind CSS configuration (if present)
```

**Entry points**:

- `src/app/layout.tsx` — Root layout with metadata and fonts
- `src/app/page.tsx` — Home page component

## Key Documentation

> **Always reference these documents to stay aligned with EmpwrU's design and voice.**

### Essential Reading (Check Before Building)

| Document                                                                                                      | Purpose                                                  |
| ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [Design System](file:///Users/boopster/Projects/empwru-app/documentation/10_Design_System_and_Decisions.md)   | Colours, typography, spacing, buttons, cards, CSS tokens |
| [UI Spec & Components](file:///Users/boopster/Projects/empwru-app/documentation/02_UI_Spec_and_Components.md) | Component patterns, screen layouts, micro-interactions   |
| [Brand Voice](file:///Users/boopster/Projects/empwru-app/documentation/13_Brand_Voice.md)                     | Tone, language choices, "U" usage, British English       |

### Project Context

| Document                                                                                                            | Purpose                             |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| [Project Brief](file:///Users/boopster/Projects/empwru-app/documentation/00_Project_Brief.md)                       | Vision, goals, target audience      |
| [User Personas](file:///Users/boopster/Projects/empwru-app/documentation/01_User_Personas.md)                       | Who we're building for              |
| [User Journeys & IA](file:///Users/boopster/Projects/empwru-app/documentation/03_User_Journeys_IA.md)               | Flow maps, information architecture |
| [Implementation Plan](file:///Users/boopster/Projects/empwru-app/documentation/09_Prototype_Implementation_Plan.md) | Roadmap, phases, localStorage keys  |

### Feature Specifications

| Document                                                                                                                 | Purpose                     |
| ------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| [Onboarding](file:///Users/boopster/Projects/empwru-app/documentation/08_Onboarding.md)                                  | Onboarding flow details     |
| [Onboarding UX Decisions](file:///Users/boopster/Projects/empwru-app/documentation/12_Onboarding_UX_Design_Decisions.md) | UX rationale for onboarding |
| [Seed/Loading Utilities](file:///Users/boopster/Projects/empwru-app/documentation/11_Seed_Loading_Utilities.md)          | Dev utilities for testing   |

### Standards & Guidelines

| Document                                                                                                                          | Purpose                       |
| --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| [PWA & Tech Stack](file:///Users/boopster/Projects/empwru-app/documentation/04_PWA_and_Tech_Stack.md)                             | Technical architecture        |
| [Security, Privacy, Accessibility](file:///Users/boopster/Projects/empwru-app/documentation/05_Security_Privacy_Accessibility.md) | WCAG AA, privacy requirements |
| [Success Metrics & QA](file:///Users/boopster/Projects/empwru-app/documentation/06_Success_Metrics_QA_Checklist.md)               | Testing checklist             |
| [Glossary](file:///Users/boopster/Projects/empwru-app/documentation/07_Glossary.md)                                               | Term definitions              |

---

## Development Workflow

### Getting Started

1. Read the [Project Brief](file:///Users/boopster/Projects/empwru-app/documentation/00_Project_Brief.md) for context
2. Review [Design System](file:///Users/boopster/Projects/empwru-app/documentation/10_Design_System_and_Decisions.md) and [Brand Voice](file:///Users/boopster/Projects/empwru-app/documentation/13_Brand_Voice.md) for styling and tone
3. Check [Implementation Plan](file:///Users/boopster/Projects/empwru-app/documentation/09_Prototype_Implementation_Plan.md) for current roadmap

### Adding New Features

1. Reference [UI Spec](file:///Users/boopster/Projects/empwru-app/documentation/02_UI_Spec_and_Components.md) for component patterns
2. Create components in `src/components/` following existing structure
3. Use localStorage for all data persistence (`empwru:*` keys—see `src/lib/storage.ts`)
4. Follow the reflection-first flow pattern for goal-related features
5. Apply [Brand Voice](file:///Users/boopster/Projects/empwru-app/documentation/13_Brand_Voice.md) to all user-facing text

### Testing

- **Test Location**: Co-located with source files (`*.test.ts` or `*.spec.ts`)
- **Current state**: No code to test (documentation phase)
- **Future**: Unit tests for utilities, component tests, Lighthouse audits

## Dependencies & Connections

### Planned Dependencies

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS (or vanilla CSS)
- Zustand (or React Context) for state
- Workbox/next-pwa for service worker

### Key Documentation

- Product specs in `documentation/`
- Agent rules in `.agent/rules/`

## Configuration

### Environment Variables (Future)

- `NEXT_PUBLIC_*` for client-side config
- No server-side secrets needed (localStorage-only architecture)

### Feature Flags (Planned)

```javascript
ENABLE_PUSH: false; // Phase 2
ENABLE_ACCOUNTS: false; // Phase 2
ENABLE_SYNC: false; // Phase 2
```

## Maintenance Guidelines

- **Privacy-first**: All data stored locally, no PII to server
- **Offline-first**: Service worker caches routes and assets
- **Performance**: Bundle < 500KB, first paint < 1s targets
- **Accessibility**: WCAG AA compliance required

### Key Constraints

- UK context
- Free/low-cost hosting only
- Private preview (`noindex` meta tag)
