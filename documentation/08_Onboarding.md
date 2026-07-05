# 08 — Onboarding

## Design Philosophy: Immediate Value, Minimal Friction

The onboarding experience gets users to their first weekly check-in as quickly as possible. Each screen serves one purpose and advances automatically when possible.

## Success Metrics

- **Completion rate**: 85%+ complete all 4 screens
- **Time to first task**: <2 minutes from app open
- **Drop-off points**: Identify and optimise screens with high abandonment

## Screen 1: Welcome & Value Proposition

### Purpose

Communicate core value and motivate continuation in 5 seconds.

### Design Specifications

```tsx
// Full-screen gradient background
<div className="min-h-screen bg-brand-gradient flex flex-col">
  <div className="flex-1 flex items-center justify-center p-6">
    <div className="text-center space-y-8">
      {/* Hero illustration - animated on load */}
      <div className="w-32 h-32 mx-auto">
        <AnimatedIllustration name="career-growth" />
      </div>

      {/* Value proposition - single, clear headline */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-4">
          2 minutes daily →<br />
          career confidence
        </h1>
        <p className="text-white/80 text-lg">Step into your potential</p>
      </div>
    </div>
  </div>

  {/* Single CTA - bottom of screen */}
  <div className="p-6 pb-safe">
    <button className="btn-brand-white w-full py-4 text-lg font-semibold">
      Get started
    </button>
  </div>
</div>
```

### Content Strategy

- **Headline**: Benefit-focused, not feature-focused
- **Subtext**: Reinforces ease and achievability
- **Visual**: Shows career progression/growth
- **CTA**: Action-oriented, immediate

### Animation

- Subtle entrance animation on illustration
- No overwhelming motion that delays comprehension
- Respects reduced motion preferences

## Screen 2: Baseline Quiz

### Purpose

Gauge starting point to personalise support.

### Design Specifications

```tsx
<div className="min-h-screen bg-brand-surface p-6">
  <div className="max-w-sm mx-auto">
    {/* Progress indicator */}
    <div className="mb-8">
      <ProgressBar progress={25} />
      <p className="text-brand-ink/60 text-sm mt-2">Step 2 of 4</p>
    </div>

    {/* Questions */}
    <BaselineQuiz />

    {/* CTA */}
    <button className="btn-brand w-full py-4 text-lg font-semibold mt-8">
      Continue
    </button>
  </div>
</div>
```

### Baseline Survey Structure

The baseline captures starting point across 5 impact measure areas:

**1. Current Situation** (Work/Study/Employment Status)

- Which best describes where you're at right now? (Unemployed / In work / Self-employed / Studying / Other)
- How satisfied are you with your current situation? (1-10 scale)

**2. Confidence & Self-Esteem**

- How confident do you feel in yourself right now? (1-10 scale)
- How would you rate your self-esteem? (1-10 scale)

**3. Aspirations for the Future**

- How clear do you feel about what you want for your future? (1-10 scale)
- How hopeful do you feel about your future? (1-10 scale)

**4. Skills, Learning & Progression**

- Are you currently building your skills? (Yes/No)
- How motivated are you to learn new skills right now? (1-10 scale)

**5. Wellbeing & Balance**

- How would you rate your energy most days? (1-10 scale)
- How would you rate your stress levels? (1-10 scale, inverted: 1=very high, 10=very low)
- Do you feel you have a good balance? (Yes/No/Unsure)

### UI Implementation

- Present as swipeable cards (one section per card)
- 1-10 scales use large tap targets, not sliders
- Progress indicator shows section progress
- Optional skip on individual questions (store as null)

## Screen 3: Category Selection

### Purpose

Personalize experience with single choice that affects all future content.

### Design Specifications

```tsx
<div className="min-h-screen bg-brand-surface p-6">
  <div className="max-w-sm mx-auto">
    {/* Progress indicator */}
    <div className="mb-8">
      <ProgressBar progress={50} />
      <p className="text-brand-ink/60 text-sm mt-2">Step 3 of 4</p>
    </div>

    {/* Question */}
    <div className="text-center mb-8">
      <h1 className="text-2xl font-bold text-brand-ink mb-2">
        Choose a goal category to start with
      </h1>
    </div>

    {/* Category options - auto-advance on selection */}
    <div className="space-y-4">
      <FocusCard
        icon="💚"
        title="Health & Wellbeing"
        description="Self-care, routines"
        value="Health"
        onSelect={handleFocusSelect}
      />
      <FocusCard
        icon="💼"
        title="Career/Work"
        description="Jobs, promotion, skills"
        value="Career"
        onSelect={handleFocusSelect}
      />
      <FocusCard
        icon="💷"
        title="Money/Wealth"
        description="Budget, income, stability"
        value="Money"
        onSelect={handleFocusSelect}
      />
      <FocusCard
        icon="📚"
        title="Skills, Education & Learning"
        description="Education, training, learning"
        value="Growth"
        onSelect={handleFocusSelect}
      />
      <FocusCard
        icon="👪"
        title="Family & Relationships"
        description="Connection, support"
        value="Family"
        onSelect={handleFocusSelect}
      />
    </div>
  </div>
</div>
```

### FocusCard Component

```tsx
interface FocusCardProps {
  icon: string;
  title: string;
  description: string;
  value: string;
  onSelect: (value: string) => void;
}

function FocusCard({ icon, title, description, value, onSelect }) {
  return (
    <button
      onClick={() => onSelect(value)}
      className="w-full p-6 bg-white rounded-2xl border-2 border-transparent hover:border-brand-teal-500 transition-all duration-200 text-left group"
    >
      <div className="flex items-start space-x-4">
        <div className="text-3xl">{icon}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-brand-ink mb-1">{title}</h3>
          <p className="text-brand-ink/70 text-sm">{description}</p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRightIcon className="w-5 h-5 text-brand-teal-500" />
        </div>
      </div>
    </button>
  );
}
```

### Interaction Design

- **Auto-advance**: No separate "Continue" button
- **Visual feedback**: Card highlights on selection
- **Accessibility**: Keyboard navigation, screen reader support
- **Touch targets**: 64px minimum height

### Content Strategy

- **Icons**: Immediately recognizable, emoji for universal understanding
- **Titles**: Clear, jargon-free language
- **Descriptions**: Brief, outcome-focused

## Screen 4: Reminder Setup

### Purpose

Establish habit timing and request notification permission.

### Design Specifications

```tsx
<div className="min-h-screen bg-brand-surface p-6">
  <div className="max-w-sm mx-auto">
    {/* Progress indicator */}
    <div className="mb-8">
      <ProgressBar progress={75} />
      <p className="text-brand-ink/60 text-sm mt-2">Step 4 of 4</p>
    </div>

    {/* Question */}
    <div className="text-center mb-8">
      <h1 className="text-2xl font-bold text-brand-ink mb-2">
        When should we check in?
      </h1>
      <p className="text-brand-ink/70">
        Choose the time that works best for your routine
      </p>
    </div>

    {/* Time options */}
    <div className="space-y-4 mb-8">
      <TimeOption
        time="8:00 AM"
        label="Morning"
        description="Start your day with intention"
        icon="🌅"
        selected={selectedTime === "morning"}
        onSelect={() => setSelectedTime("morning")}
      />
      <TimeOption
        time="6:00 PM"
        label="Evening"
        description="Reflect and prepare for tomorrow"
        icon="🌆"
        selected={selectedTime === "evening"}
        onSelect={() => setSelectedTime("evening")}
      />
    </div>

    {/* CTA - leads to first daily step */}
    <button
      onClick={handleComplete}
      disabled={!selectedTime}
      className="btn-brand w-full py-4 text-lg font-semibold disabled:opacity-50"
    >
      Start my first step
    </button>
  </div>
</div>
```

### TimeOption Component

```tsx
function TimeOption({ time, label, description, icon, selected, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
        selected
          ? "border-brand-teal-500 bg-brand-teal-500/5"
          : "border-gray-200 bg-white hover:border-brand-teal-500/50"
      }`}
    >
      <div className="flex items-center space-x-4">
        <div className="text-3xl">{icon}</div>
        <div className="flex-1">
          <div className="flex items-baseline space-x-2 mb-1">
            <span className="font-semibold text-brand-ink">{time}</span>
            <span className="text-brand-ink/70 text-sm">{label}</span>
          </div>
          <p className="text-brand-ink/70 text-sm">{description}</p>
        </div>
        {selected && <CheckIcon className="w-6 h-6 text-brand-teal-500" />}
      </div>
    </button>
  );
}
```

### Notification Permission Strategy

```tsx
async function handleComplete() {
  // Request permission after user commitment
  if ("Notification" in window) {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      // Schedule daily notification
      scheduleNotification(selectedTime);
    }
    // Continue regardless of permission - don't block onboarding
  }

  // Save preferences and advance to first daily step
  await saveUserPreferences({
    focusArea: selectedFocus,
    reminderTime: selectedTime,
    onboardingCompleted: true,
  });

  // Track onboarding completion and first check-in conversion target
  trackEvent("onboarding_completed", {
    step: 4,
    category: selectedFocus,
    reminderTime: selectedTime,
  });

  // Navigate to first weekly check-in
  router.push("/checkin");
}
```

## Onboarding Completion Flow

### Immediate Transition to Weekly Loop

After screen 4 completion:

1. Save user preferences locally
2. Generate first goal-setting prompt based on focus area
3. Navigate directly to `/checkin` (first weekly check-in)
4. Mark onboarding as completed in user state

### First Experience

- Simplified first check-in (no streak counter yet)
- Easier first task (confidence building)
- Special celebration for completing onboarding
- Next week preview to build anticipation

## Error States & Edge Cases

### Network Issues

- All onboarding data stored locally first
- Sync preferences when connection restored
- Never block progression on network issues

### Interrupted Onboarding

- Save progress after each screen
- Resume from last completed screen
- Clear "back" navigation once committed

### Permission Denied

- Continue without notifications
- Offer to re-enable in settings later
- Don't make notifications feel mandatory

## A/B Testing Opportunities

### Value Proposition Testing

- Test different headlines: "2 minutes daily" vs "Build career confidence"
- Test illustration styles: abstract vs literal
- Measure completion rates and first-task completion

### Focus Area Options

- Test 3 vs 4 focus areas
- Test different focus area names/descriptions
- Monitor distribution and subsequent engagement

### Timing Options

- Test specific times vs general periods
- Test 2 vs 3 time options
- Measure notification engagement rates

## Analytics & Optimization

### Key Metrics

- **Screen completion rates**: % completing each screen
- **Time spent**: Per screen and total onboarding
- **Drop-off points**: Where users abandon onboarding
- **First task completion**: % completing first goal setup after onboarding

### Optimization Triggers

- <75% completion rate on any screen → immediate investigation
- > 90 seconds average on any screen → simplify content
- <60% first task completion → adjust onboarding-to-task transition

/welcome    → Screen 1
/signUp     → Screen 2
/signIn     → Screen 3
/baseline   → Screen 4
/focus      → Screen 5
/reminder   → Screen 6
/checkin    → First weekly check-in

### State Management

```tsx
interface OnboardingState {
  currentStep: 1 | 2 | 3 | 4;
  category?: "Health" | "Career" | "Money" | "Growth" | "Family";
  reminderTime?: "morning" | "evening";
  baseline?: {
    confidence?: number;
    jobRole?: string;
    incomeBand?: string;
    learningEngagement?: "low" | "medium" | "high";
    selfCare?: "low" | "medium" | "high";
  };
  completed: boolean;
}
```

### Analytics Events (Onboarding)

```ts
trackEvent("onboarding_started");
trackEvent("onboarding_baseline_completed", { itemsAnswered: 4 });
trackEvent("onboarding_category_selected", { category: "Career" });
trackEvent("onboarding_reminder_set", { reminderTime: "morning" });
trackEvent("onboarding_completed", {
  step: 4,
  category: "Career",
  reminderTime: "morning",
});
```

### Progressive Enhancement

- Works without JavaScript (forms with server fallback)
- Animations optional (respects reduced motion)
- Works offline (all content pre-cached)

This onboarding design prioritizes getting users to their first successful daily habit completion as quickly as possible, establishing the core loop that drives long-term engagement.
