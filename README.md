# empwrU

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

A progressive web app for personal empowerment and goal tracking. Designed to help users set meaningful goals, track progress through small milestones, and build momentum with weekly check-ins.

## Features

- **Onboarding Flow** — Baseline quiz to capture starting point, focus area selection, and reminder setup
- **Goal Management** — Create SMART goals with milestones, target dates, and progress tracking
- **Weekly Check-ins** — Energy level tracking, milestone updates, and reflections
- **Progress Dashboard** — Momentum streaks, goal statistics, and baseline comparisons
- **Daily Inspiration** — Motivational quotes to keep you going

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **UI**: React 19 with Tailwind CSS 4
- **Icons**: Lucide React
- **Storage**: localStorage (client-side persistence)
- **PWA**: Installable on mobile devices

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── checkin/         # Weekly check-in wizard
│   ├── goals/           # Goal list, creation, and detail views
│   ├── onboarding/      # Welcome, baseline, and reminder setup
│   └── progress/        # Progress dashboard
├── components/
│   ├── layouts/         # Layout components
│   └── ui/              # Reusable UI components
└── lib/
    └── storage.ts       # localStorage persistence layer
```

## Deployment

This app is configured for **Vercel** (recommended for Next.js):

1. Push to GitHub: `git push -u origin develop`
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click "Add New Project" → Import your repo
4. Click "Deploy"

Your app will be live at `https://your-project.vercel.app`.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Scottish-Tech-Army/bulildu)

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
