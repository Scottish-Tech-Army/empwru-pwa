# Agent Guide for src/components/

## Context

Shared React components for the EmpwrU PWA. Follows atomic design principles with layouts, UI primitives, and composed elements.

**Type**: React component library

## Key Documentation

> **Always check these before building or modifying components:**

| Document                                                                                                      | Purpose                                         |
| ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| [Design System](file:///Users/boopster/Projects/empwru-app/documentation/10_Design_System_and_Decisions.md)   | Colours, typography, buttons, cards, CSS tokens |
| [UI Spec & Components](file:///Users/boopster/Projects/empwru-app/documentation/02_UI_Spec_and_Components.md) | Component patterns, states, micro-interactions  |
| [Brand Voice](file:///Users/boopster/Projects/empwru-app/documentation/13_Brand_Voice.md)                     | Tone for any user-facing text                   |

## Structure & Navigation

```
components/
├── layouts/         # Full-screen and card-based layouts
│   └── FullScreenLayout.tsx
├── ui/              # Reusable UI primitives
│   ├── PrimaryButton.tsx
│   ├── ProgressBar.tsx
│   └── ...
└── AGENT.md         # This file
```

## Development Workflow

### Adding a New Component

1. Check [UI Spec](file:///Users/boopster/Projects/empwru-app/documentation/02_UI_Spec_and_Components.md) for existing patterns
2. Place in appropriate subfolder (`layouts/`, `ui/`)
3. Use PascalCase for file and component names
4. Export props interface for TypeScript
5. Co-locate tests as `ComponentName.test.tsx`

### Component Guidelines

- **Props**: Use TypeScript interfaces, not inline types
- **Styling**: Tailwind classes + CSS custom properties from `globals.css`
- **Colours**: Use design tokens from [Design System](file:///Users/boopster/Projects/empwru-app/documentation/10_Design_System_and_Decisions.md)
- **Copy**: Apply [Brand Voice](file:///Users/boopster/Projects/empwru-app/documentation/13_Brand_Voice.md) (warm, honest, British English)
- **Accessibility**: ARIA labels, focus states, keyboard support (WCAG AA)
- **Touch targets**: Minimum 44px for interactive elements
- **Emojis**: Use sparingly; prefer icons instead

## Testing

- **Test Location**: Co-located (e.g., `PrimaryButton.test.tsx`)
- **Current state**: No tests yet

## Dependencies

- Tailwind CSS for styling
- CSS custom properties from `globals.css`
- See [Design System](file:///Users/boopster/Projects/empwru-app/documentation/10_Design_System_and_Decisions.md) for token definitions
