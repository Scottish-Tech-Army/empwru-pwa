# 04 — PWA & Tech Stack

## Phased Approach

The prototype is structured in phases to enable fast feedback cycles.

### Phase 1: MVP (Initial Prototype)

- **Session-based** — No user accounts
- **localStorage only** — Simple JSON storage, no database
- **Bundled seed data** — Mock content loaded at startup
- **Web Push notifications** — Weekly reminders via browser push
- **Minimal backend** — Serverless function for push only

### Phase 2: Enhanced Prototype

- **User accounts** — Simple auth (email magic link or OAuth)
- **Cloud database** — Data persistence across devices
- **Scheduled push** — Automated weekly reminders via cron

---

## Phase 1 Tech Stack

### Framework

| Option      | Recommendation                                                        |
| ----------- | --------------------------------------------------------------------- | --- | --- |
| **Next.js** | ✅ Recommended — Great PWA support, static export, easy Vercel deploy |     |     |

### PWA Configuration

**Manifest** (`manifest.json`)

```json
{
  "name": "empwrU",
  "short_name": "empwrU",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#BC03B9",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Service Worker** — Use `next-pwa` or Workbox for:

- Offline caching of app shell
- Cache-first strategy for static assets

---

## Data Persistence (Phase 1)

### Approach: localStorage + Bundled Seed Data

**No database needed.** All data stored as simple JSON in localStorage.

```
┌─────────────────────────────────────────┐
│  App Bundle (seed data)                 │
│  ├── seed.json (goals, prompts)         │
│  ├── strings.json (UI copy)             │
│  └── templates.json (reflection Q's)    │
└─────────────────────────────────────────┘
         ↓ loads on first visit
┌─────────────────────────────────────────┐
│  localStorage                           │
│  ├── empwru:onboarding                  │
│  ├── empwru:baseline                    │
│  ├── empwru:goals                       │
│  ├── empwru:checkins                    │
│  └── empwru:preferences                 │
└─────────────────────────────────────────┘
```

### Storage Keys

| Key                   | Contents                  | Example                        |
| --------------------- | ------------------------- | ------------------------------ |
| `empwru:onboarding`   | Onboarding state          | `{ completed: true, step: 4 }` |
| `empwru:baseline`     | Baseline survey responses | `{ confidence: 7, ... }`       |
| `empwru:category`     | Selected focus area       | `"Career"`                     |
| `empwru:goals`        | User goals array          | `[{ id, title, why, ... }]`    |
| `empwru:checkins`     | Weekly check-in history   | `[{ date, energy, ... }]`      |
| `empwru:preferences`  | Reminder time, settings   | `{ reminderTime: "morning" }`  |
| `empwru:seed_version` | Seed data version         | `1`                            |

### Why localStorage (not IndexedDB)?

| localStorage            | IndexedDB                |
| ----------------------- | ------------------------ |
| ✅ Simple sync API      | ❌ Complex async API     |
| ✅ JSON.stringify/parse | ❌ Schema setup required |
| ✅ 5-10MB (enough)      | ✅ Larger capacity       |
| ✅ Works everywhere     | ⚠️ Safari quirks         |

**Decision:** localStorage is sufficient for Phase 1. Migrate to cloud DB in Phase 2 if needed.

### Helper Utilities

```typescript
// utils/storage.ts
const PREFIX = "empwru:";

export function get<T>(key: string): T | null {
  const item = localStorage.getItem(PREFIX + key);
  return item ? JSON.parse(item) : null;
}

export function set<T>(key: string, value: T): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export function remove(key: string): void {
  localStorage.removeItem(PREFIX + key);
}

export function clearAll(): void {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIX))
    .forEach((k) => localStorage.removeItem(k));
}
```

---

## Seed Data

Bundled JSON files provide starter content:

```
/content
  ├── seed.json        # Goals templates, prompts, nudges
  ├── strings.json     # UI copy (buttons, labels, messages)
  └── templates.json   # Reflection questions, challenge templates
```

**Loaded on first visit** via seed loader (see `11_Seed_Loading_Utilities.md`).

---

## Web Push Notifications (Phase 1)

### Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   PWA Client    │◄────►│  Push Server    │◄────►│  Browser Push   │
│  (Service       │      │  (Serverless)   │      │  (FCM/APNs)     │
│   Worker)       │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

### Components

**1. VAPID Keys** (for push authentication)

```bash
npx web-push generate-vapid-keys
```

Store in environment variables:

- `VAPID_PUBLIC_KEY` — Used in client
- `VAPID_PRIVATE_KEY` — Used in server only

**2. Service Worker** (`public/sw.js`)

```javascript
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || "empwrU", {
      body: data.body || "Time for your weekly check-in!",
      icon: "/icon-192.png",
      badge: "/badge-72.png",
      data: { url: data.url || "/checkin" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
```

**3. Client Subscription** (`utils/push.ts`)

```typescript
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  });

  // Store subscription locally (no server storage in Phase 1)
  localStorage.setItem(
    "empwru:push_subscription",
    JSON.stringify(subscription)
  );

  return subscription;
}
```

**4. Serverless Push Function** (Vercel Edge Function)

```typescript
// api/send-push.ts
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:hello@empwru.org",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: Request) {
  const { subscription, title, body } = await request.json();

  await webpush.sendNotification(
    subscription,
    JSON.stringify({ title, body, url: "/checkin" })
  );

  return Response.json({ success: true });
}
```

### User Flow

1. User completes onboarding → Reminder setup screen
2. User selects "Weekly reminder" → Request notification permission
3. If granted → Subscribe to push, store subscription locally
4. User can trigger test notification immediately
5. **Phase 2**: Add scheduled cron to send weekly at user's preferred time

### Fallback (if push denied)

- ICS calendar export as backup
- In-app nudge when app opened after 7+ days

### Storage

| Key                        | Contents                         |
| -------------------------- | -------------------------------- |
| `empwru:push_subscription` | Browser push subscription object |
| `empwru:push_enabled`      | Boolean, user preference         |
| `empwru:reminder_time`     | "morning" or "evening"           |

---

## Hosting (Phase 1)

| Option               | Free Tier   | Notes                               |
| -------------------- | ----------- | ----------------------------------- |
| **Vercel**           | ✅ Generous | Best for Next.js, automatic deploys |
| **Cloudflare Pages** | ✅ Generous | Fast, good for static               |
| **Netlify**          | ✅ Generous | Easy setup                          |

**Recommendation**: Vercel for Next.js, with static export.

---

## Offline-First Strategy

1. **App Shell** — Cache HTML, CSS, JS on install
2. **Data** — localStorage works offline by default
3. **Graceful degradation** — Show cached content, indicate offline state

---

## Phase 2 Tech Stack Additions

When user accounts are needed:

### User Accounts

- **Supabase Auth** (free tier) — Magic link email, OAuth
- **Clerk** — Alternative, more features

### Data Sync

- **Supabase** — PostgreSQL + real-time sync
- Migrate localStorage data to cloud on first login

### Web Push Notifications

- VAPID keys + Edge Functions
- Subscription storage in KV/DB

---

## Development Tools

| Tool              | Purpose                |
| ----------------- | ---------------------- |
| TypeScript        | Type safety            |
| ESLint + Prettier | Code quality           |
| Vitest            | Unit testing           |
| Lighthouse        | PWA/performance audits |

---

## Deployment Checklist (Phase 1)

- [ ] PWA manifest configured
- [ ] Service worker registered
- [ ] Icons (192px, 512px) created
- [ ] `noindex` meta tag added (private preview)
- [ ] Lighthouse PWA score > 90
- [ ] Offline behaviour tested
- [ ] iOS Safari tested (PWA quirks)
- [ ] Seed data loads correctly
- [ ] localStorage persistence verified
