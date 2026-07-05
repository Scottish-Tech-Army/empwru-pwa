# Agent Guide for src/lib/

## Context

Shared utilities, hooks, and stores for the EmpwrU PWA. Contains non-component code that is used across the application.

**Type**: Utility library

## Key Documentation

| Document                                                                                                            | Purpose                       |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| [Implementation Plan](file:///Users/boopster/Projects/empwru-app/documentation/09_Prototype_Implementation_Plan.md) | localStorage keys, data model |
| [Seed/Loading Utilities](file:///Users/boopster/Projects/empwru-app/documentation/11_Seed_Loading_Utilities.md)     | Dev utilities, test data      |

## Structure & Navigation

```
lib/
├── storage.ts      # localStorage helpers for persisting app state
└── (future)
    ├── hooks/      # Custom React hooks
    └── stores/     # Zustand stores (if added)
```

## Development Workflow

### Adding Utilities

1. Create focused, single-purpose modules
2. Export types alongside functions
3. Keep localStorage keys prefixed with `empwru:`

### localStorage Keys

Per implementation plan, data is stored as JSON:

| Key                  | Contents                  |
| -------------------- | ------------------------- |
| `empwru:onboarding`  | Onboarding state          |
| `empwru:baseline`    | Baseline survey responses |
| `empwru:category`    | Selected focus area       |
| `empwru:goals`       | User goals array          |
| `empwru:checkins`    | Weekly check-in history   |
| `empwru:preferences` | Reminder time, settings   |

## Testing

- **Test Location**: Co-located (e.g., `storage.test.ts`)
- **Current state**: No tests yet

## Dependencies

- No external dependencies (pure TypeScript utilities)
- See [storage.ts](file:///Users/boopster/Projects/empwru-app/src/lib/storage.ts) for current implementation
