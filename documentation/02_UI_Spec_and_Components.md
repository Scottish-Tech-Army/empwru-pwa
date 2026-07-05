# 02 — UI Spec & Components (Native Mobile PWA)

## Design System: Duolingo-Inspired Mobile-First

### **Core Principles**

- **Single-purpose screens**: Each component serves one clear function
- **Large touch targets**: Minimum 44px, thumb-friendly
- **Immediate feedback**: Visual response to every interaction
- **Emotional design**: Friendly, encouraging, celebration-focused, must be time boxed but self paced.

### **Semantic Color Tokens**

Use these tokens from `globals.css` for consistent styling:

| Token                   | Usage                                       | Value             |
| ----------------------- | ------------------------------------------- | ----------------- |
| `--color-charcoal`      | Primary text (headings, body)               | #030303           |
| `--color-text-muted`    | Secondary text (labels, descriptions)       | charcoal @ 60%    |
| `--color-text-subtle`   | Very light text (hints, dates)              | charcoal @ 40%    |
| `--color-bg-subtle`     | Subtle backgrounds (icon circles, input bg) | #f9fafb           |
| `--color-warm-ivory`    | Separation backgrounds, category tags       | #efebee           |
| `--color-brand-primary` | CTAs, active states, accents                | #bc03b9 (Magenta) |

**Usage pattern**: `text-[var(--color-charcoal)]` or via Tailwind tokens `text-text-muted`, `bg-bg-subtle`.

## **Screen-Level Components**

### **OnboardingWelcome**

**Purpose**: First impression, value proposition

- Full-screen layout with large hero illustration (avatar)
- Single headline: "IT STARTS WITH YOU"
- One primary CTA: "Get started"
- **Size**: 100vh, no scroll
- **Animation**: Subtle entrance animation on load

### **OnboardingBaseline**

**Purpose**: Gauge starting point across impact measures to personalise support and track progress over time.

**Baseline Survey Structure** (5 sections, ~10 questions total):

1. **Current Situation** (Work/Study/Employment Status)

   - Which best describes where you're at right now? (Unemployed / In work / Self-employed / Studying / Other)
   - How satisfied are you with your current situation? (1-10 scale)

2. **Confidence & Self-Esteem**

   - How confident do you feel in yourself right now? (1-10 scale)
   - How would you rate your self-esteem? (1-10 scale)

3. **Aspirations for the Future**

   - How clear do you feel about what you want for your future? (1-10 scale)
   - How hopeful do you feel about your future? (1-10 scale)

4. **Skills, Learning & Progression**

   - Are you currently building your skills? (Yes/No)
   - How motivated are you to learn new skills right now? (1-10 scale)

5. **Wellbeing & Balance**
   - How would you rate your energy most days? (1-10 scale)
   - How would you rate your stress levels? (1-10 scale, inverted)
   - Do you feel you have a good balance? (Yes/No/Unsure)

**End-of-Programme Evaluation**: Same structure with comparative framing ("now compared to when you started") plus optional reflection free text.

### **OnboardingReminderSetup**

**Purpose**: Notification preferences

- Permission request for notifications
- **CTA**: "Start my first step" (implies immediate action)
- Reminder for notifications cadence

### **WeeklyCheckinScreen**

**Purpose**: Weekly mood/energy capture and progress reflection (primary engagement loop)

- Full-screen
- Large greeting text with time-based message
- Energy check: "How's your energy this week?"
- Three emoji buttons: 😴 (low), 😊 (good), 🚀 (high)
- Progress summary since last check-in
- **Touch targets**: 64px emoji buttons with generous spacing
- **Animation**: Gentle pulse on selected emoji
- **Note**: Goal setting flows begin after onboarding completion

### **TaskScreen - Milestones**

**Purpose**: Single micro-task completion

- Progress indicator at top (day X of streak)
- Large task icon (contextual to task type)
- Task title (1-2 sentences max)
- Single primary CTA: "I'm done! ✓"
- **Layout**: Centred content, bottom-heavy CTA
- **States**: Loading task, task active, task completed

### **CelebrationScreen**

**Purpose**: Immediate positive reinforcement

- Full-screen celebration with animation
- Large success icon/illustration
- Streak counter prominent: "🔥 5-day streak!"
- Encouraging message: "You're building momentum!"
- Tomorrow preview: "Tomorrow: Review your bullet points"
- **CTA**: "See you tomorrow →"
- **Animation**: Confetti, scale animations, staggered text reveals

### **GoalReflectionScreen (Reflection First)**

**Purpose**: Capture the “why” and value of the goal

- Prompts: Why it matters; what changes; how it will feel
- Example answers; low-friction inputs; save as part of goal
- What is about this goal that is special to you? use to remind the user about why they want to achieve this goal
- Guide the user the SMART goal setting

### **GoalVisualsScreen - vision board - photos, text, memes, quotes**

**Purpose**: Optional vision prompts

- Choose 1–3 visuals/prompts from curated set; upload later

### **GoalWhyReminders**

**Purpose**: Surface the goal’s motivation contextually

- Inline component on goal page; shows snippets from reflection

### **HabitTrackerScreen**

**Purpose**: Lightweight streaks and routine support (post-onboarding feature)

- Daily checkboxes; simple routine templates (morning/evening) (wellbeing/productivity habits)
- Encouraging micro-feedback; respects zero pressure tone
- **Note**: Accessed from Dashboard after onboarding; not part of initial onboarding flow

### **ResourcesSurface**

**Purpose**: Contextual resources within flows

- Shows relevant free templates/guides; defers advanced/paid docs to later

## **Reusable Components**

### **ProgressBar**

**Usage**: Daily task screen, onboarding

- Props: `progress: number` (0-100), `showLabel?: boolean`
- **Visual**: Brand gradient fill, rounded ends
- **Size**: Full width, 8px height
- **Animation**: Smooth fill animation on progress change

### **EmojiButton**

**Usage**: Daily check-in, weekly reflection

- Props: `emoji: string`, `label?: string`, `selected?: boolean`
- **Size**: 64px touch target, 32px emoji
- **States**: Default, pressed, selected
- **Animation**: Scale on press, gentle glow when selected

### **PrimaryCTA**

**Usage**: All screens for main action

- Props: `children`, `onClick`, `loading?`, `disabled?`
- **Style**: [Brand gradient background, white text, rounded]
- **Size**: Full width on mobile, 56px height
- **States**: Default, pressed, loading, disabled
- **Animation**: Scale on press, loading spinner

### **StreakCounter**

**Usage**: Celebration screen, weekly milestones

- Props: `count: number`, `size?: 'small' | 'large'`
- **Visual**: Fire emoji + number, optional background
- **Animation**: Bounce in on count increase
- **Accessibility**: Announces streak length

### **TaskCard**

**Usage**: Daily task screen

- Props: `title`, `description?`, `icon?`, `estimatedTime?`
- **Layout**: Icon + text + time badge
- **Size**: Full width, auto height, generous padding
- **Visual**: White background, subtle shadow, rounded corners

### **ToastMessage**

**Usage**: Success feedback, offline indicators

- Props: `message`, `type: 'success' | 'info' | 'warning'`
- **Behaviour**: Auto-dismiss after 3 seconds
- **Position**: Top of screen, slides down
- **Animation**: Slide in/out, fade

### **ReminderExport**

**Usage**: Offer calendar export

- Props: `time`, `title`, `description`
- **Behaviour**: Generates ICS file; deep links to calendar apps when possible

### **VisionPromptCard**

**Usage**: Goal visuals selection

- Props: `image`, `label`, `selected?`
- **Layout**: Grid cards; multi-select

### **WhySnippet**

**Usage**: Remind user of goal’s motivation

- Props: `snippets: string[]`
- **Behaviour**: Rotates snippets; user can pin a favourite

### **HabitCheckbox**

**Usage**: Habit tracker

- Props: `label`, `checked`, `onToggle`
- **Behaviour**: Confetti on streak milestones; subtle otherwise

## **Micro-Interactions**

### **Button Press Feedback**

- **Scale**: 0.95 transform on press
- **Duration**: 100ms ease-out
- **Visual**: Subtle shadow reduction

### **Screen Transitions**

- **Type**: Slide left/right for linear flow
- **Duration**: 300ms ease-in-out
- **Behaviour**: New screen slides in from right, current slides left

### **Success Animations**

- **Checkmark**: Draw animation for completion
- **Confetti**: Particle system for major milestones
- **Scale bounce**: For streak counters and achievements

### **Loading States**

- **Skeleton screens**: For content loading
- **Spinner**: For action processing
- **Progress indicators**: For multi-step processes

#### **Branded Loading Screen Pattern**

For full-page loading/processing states, use the branded spinner pattern:

```tsx
import { RefreshCw } from "lucide-react";

<div className="min-h-dvh flex items-center justify-center bg-brand-surface">
  <div className="text-center">
    <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
      <RefreshCw className="w-8 h-8 text-brand-primary animate-spin" />
    </div>
    <h1 className="text-xl text-gray-900 mb-2">{title}</h1>
    <p className="text-gray-500">{subtitle}</p>
  </div>
</div>;
```

Use contextual icons where appropriate (e.g., `Loader2` for general loading, `RefreshCw` for reset/sync).

## **Layout Patterns**

### **Full-Screen Template**

```tsx
<div className="min-h-screen flex flex-col">
  <div className="flex-1 flex items-center justify-center p-6">
    {/* Main content centred */}
  </div>
  <div className="p-6 pb-safe">{/* Bottom CTA in thumb reach */}</div>
</div>
```

### **Card-Based Template**

```tsx
<div className="min-h-screen bg-brand-surface p-4">
  <div className="max-w-sm mx-auto space-y-4">
    {/* Cards with consistent spacing */}
  </div>
</div>
```

## **Responsive Behaviour**

### **Mobile-First (320px+)**

- Single column layout
- Full-width CTAs
- Large touch targets
- Bottom-heavy important actions

### **Tablet (768px+)**

- Constrain max-width to 480px
- Centre content horizontally
- Maintain mobile interaction patterns

### **Desktop (1024px+)**

- Same as tablet (no desktop-specific features)
- Keyboard navigation support
- Hover states for non-touch users

## **Accessibility Standards**

### **WCAG AA Compliance**

- **Colour contrast**: 4.5:1 minimum for all text
- **Touch targets**: 44px minimum
- **Focus indicators**: Visible keyboard focus
- **Screen reader**: Semantic markup, ARIA labels

### **Inclusive Design**

- **Reduced motion**: Respect user preferences
- **High contrast**: Support system-level settings
- **Font scaling**: Support user font size preferences
- **Simple language**: Clear, jargon-free copy

## **Design Guardrails: Responding to User Pain Points**

> **Note**: All copy and tone guidance should align with `13_Brand_Voice.md`.

- Demotivated
  - UI: Emphasise micro‑wins with immediate visual feedback; keep streak/progress visible where motivating but not guilt-inducing
  - Copy: Encouraging, supportive tone; celebrate effort, not just outcomes
- Feeling stuck
  - UI: Always show a single “next best action”; provide worked examples and “show me” alternatives
  - Empty states: Replace blanks with templates/examples and contextual hints
- Not sure how to move forward
  - UI: Single‑purpose screens; step‑by‑step flows with sensible defaults
  - Components: Templates before blank inputs; preview of “what good looks like”
- Lack of time
  - UI: Design for 2–5 minute tasks; minimise inputs; bottom‑heavy primary CTAs
  - System: Autosave/resume everywhere; offline‑first behaviour; low‑data assets

## **Performance Targets**

### **Loading Performance**

- **First paint**: <1s on 3G
- **Interactive**: <2s on 3G
- **Bundle size**: <500KB initial, <100KB per route

### **Animation Performance**

- **60fps**: All animations maintain smooth framerate
- **GPU acceleration**: Use transform/opacity for animations
- **Reduced motion**: Fallback to instant state changes

## **Component Library Structure**

```
/components
  /screens      # Full-screen components
  /ui          # Reusable UI components
  /animations  # Animation utilities
  /layouts     # Layout templates
  /icons       # Icon components

```

This specification prioritises user habit formation through delightful, friction-free interactions that feel native to mobile devices.
