# 11 — Seed Loading Utilities (TypeScript)

## Purpose

Load starter content (goals, prompts, UI copy) into localStorage on first run for demo/testing.

## Storage Keys

All keys use the `empwru:` prefix:

- `empwru:seed_version` — Numeric; bump to force re-seed
- `empwru:content:goals` — Goal templates
- `empwru:content:prompts` — Reflection prompts
- `empwru:content:nudges` — Nudge templates
- `empwru:content:strings` — UI copy

## Seed Files

```
/content
  ├── seed.json        # Goals, prompts, nudges
  └── strings.json     # UI copy (buttons, labels)
```

## Utility

```typescript
// utils/seed.ts
import seed from "@/content/seed.json";
import strings from "@/content/strings.json";

const PREFIX = "empwru:";
const CURRENT_SEED_VERSION = 1;

function set(key: string, value: unknown): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

function get(key: string): string | null {
  return localStorage.getItem(PREFIX + key);
}

export function seedIfNeeded(): void {
  try {
    const stored = Number(get("seed_version") || "0");
    if (stored >= CURRENT_SEED_VERSION) return;

    set("content:goals", seed.goals);
    set("content:prompts", seed.prompts);
    set("content:nudges", seed.nudges);
    set("content:strings", strings);

    localStorage.setItem(PREFIX + "seed_version", String(CURRENT_SEED_VERSION));

    console.log("[Seed] Loaded seed data v" + CURRENT_SEED_VERSION);
  } catch (e) {
    console.warn("[Seed] Failed to load seed data:", e);
    // Fail silently; app should still run without seed
  }
}

export function resetSeed(): void {
  localStorage.removeItem(PREFIX + "seed_version");
  seedIfNeeded();
}
```

## Usage

Call `seedIfNeeded()` once on app startup:

```typescript
// app/layout.tsx (client component)
"use client";

import { useEffect } from "react";
import { seedIfNeeded } from "@/utils/seed";

export default function RootLayout({ children }) {
  useEffect(() => {
    seedIfNeeded();
  }, []);

  return <html>...</html>;
}
```

## Updating the Seed

1. Modify `/content/seed.json` and/or `/content/strings.json`
2. Increment `CURRENT_SEED_VERSION` to force re-hydration on next load

## Accessing Seed Content

```typescript
// utils/storage.ts
const PREFIX = "empwru:";

export function getContent<T>(key: string): T | null {
  const item = localStorage.getItem(PREFIX + "content:" + key);
  return item ? JSON.parse(item) : null;
}

// Usage
const goals = getContent<Goal[]>("goals");
const strings = getContent<Record<string, string>>("strings");
```

## Demo Reset

For testing, provide a way to reset all data:

```typescript
export function resetAll(): void {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIX))
    .forEach((k) => localStorage.removeItem(k));

  seedIfNeeded(); // Reload seed data
}
```
