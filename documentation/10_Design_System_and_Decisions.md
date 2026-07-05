# 10 — Design System & Decisions

## Principles

- Mobile‑first; single‑purpose screens; encouraging, supportive tone
- Clear hierarchy; generous spacing; large touch targets
- **Icons over emojis**: Use emojis sparingly; prefer icons for visual elements

## Colour Palette

The empwrU colour palette has been thoughtfully crafted to reflect the organisation's core purpose: creating space for women to reconnect, grow, and move confidently toward their aspirations. Each colour carries intentional meaning, working together to communicate warmth, trust, and empowerment.

This palette balances energy with calm, boldness with approachability - mirroring
the journey empwrU supports: building confidence at one's own pace while taking meaningful steps forward.

### Primary Colours

#### White (#FFFFFF)

White serves as the foundation of the U visual identity. It represents clarity, openness, and possibility - the blank canvas upon which each woman can begin to envision her future.

Usage:

- Primary background colour across all brand touchpoints
- Creates breathing room and visual calm
- Allows the brand's vibrant accent colours to take centre stage
- Embodies the spaciousness U creates for reflection and growth

Application notes: Use generously. White space is not empty space - it communicates confidence, sophistication, and the intentional pause that U offers women in their busy lives.

#### Charcoal (#030303)

This near-black charcoal is the primary text colour throughout the U brand. Softer than pure black, it provides excellent readability while maintaining the warm, approachable aesthetic of the brand.

Usage:

- Primary body text colour
- Headings and labels
- Any text that requires maximum legibility

Application notes: Use Charcoal for all primary text content. Its slight warmth compared to pure black (#000000) creates a more inviting reading experience that aligns with U's supportive tone.

#### Magenta (#BC03B9)

This vibrant, warm magenta is the energetic heart of the U palette. It speaks to confidence, action, and the courage to step forward. Neither harsh nor timid, it strikes a balance between strength and warmth - much like the journey U facilitates.

Usage:

- Primary buttons and calls-to-action
- Key backgrounds for hero sections and feature areas
- Graphic shapes and brand elements
- High-visibility communications

Application notes: As the primary action colour, Magenta should draw the eye to what matters most. Use it decisively - for moments that invite engagement, encourage next steps, or celebrate progress.

### Secondary Colours

#### Deep Violet (#4A0F7E)

Deep Violet grounds the palette with depth and gravitas. It represents the foundational work of building confidence, the quiet strength that comes from self-belief, and the trusted space U provides.

Usage:

- Secondary backgrounds, particularly for immersive sections
- Supporting graphic elements
- Text on light backgrounds (where high contrast is needed)
- Creates visual hierarchy when paired with Magenta

Application notes: Use Deep Violet to add richness and establish credibility. It works particularly well for statistics, or areas where the audience should feel held and supported. Reserve it for moments that require gravitas rather than energy.

#### Warm Ivory (#EFEBEE)

This subtle off-white provides a softer alternative when pure white feels too stark. It adds warmth and approachability while maintaining the sense of space and calm central to the brand.

Usage:

- Alternate background sections to create visual rhythm
- Areas requiring a gentler, more intimate feel
- Softening transitions between content blocks

Application notes: Deploy sparingly and purposefully. Warm Ivory should feel like a gentle exhale - use it to break up longer pages or to signal a shift in tone without introducing visual competition. It should never dominate but rather support the content it surrounds.

### Accent Colours

#### Signature Gradient

- Direction: 135° (top‑left → bottom‑right)
- Stops:
  - Deep Violet: `#4A0F7E`
  - Magenta: `#BC03B9`
  - Orange: `#F27321`
- Example CSS:

```
background: linear-gradient(135deg, #4A0F7E 100%, #BC03B9 45%, #F27321 0%);
```

- Tailwind (plugin or arbitrary values):

```
bg-[linear-gradient(135deg,_#4A0F7E_100%,_#BC03B9_45%,_#F27321_0%)]
```

With a nod to the original buildU spectrum, while warming it for U - The gradient is the defining mark of the U identity, flowing seamlessly from grounded Deep Violet to Magenta to energetic Pumpkin. It symbolises transformation - the journey from where a woman is to where she aspires to be.

Usage:

- The U logo mark
- Highlight elements and accent details
- Decorative borders and dividers
- Moments of celebration or emphasis

Application notes: The gradient should feel dynamic and purposeful, never decorative for decoration's sake. It represents momentum and progress. Use it to draw attention to significant moments: key messages, achievements, or invitations to take the next step.

## Component Treatments

### Cards

- **Background**: White with subtle shadow (`shadow-sm`)
- **Border radius**: `rounded-2xl` (16px)
- **Padding**: `p-6` (24px)
- **Hover**: Slight lift (`hover:shadow-md`, `hover:-translate-y-0.5`)
- **Interactive cards**: Add `cursor-pointer` and focus ring

### Buttons (Primary)

- **Background**: Magenta (`#BC03B9`)
- **Text**: White, semi-bold
- **Shape**: Pill (`rounded-full`)
- **Padding**: `px-6 py-3` (comfortable touch target)
- **Hover**: Scale 1.02, slight brightness increase
- **Active**: Scale 0.98
- **Disabled**: 50% opacity, no pointer events

### Buttons (Secondary)

- **Background**: Transparent
- **Border**: 2px Magenta
- **Text**: Magenta
- **Hover**: Light Magenta background fill

### Progress Chips

- **Background**: Warm Ivory (`#EFEBEE`)
- **Text**: Deep Violet (`#4A0F7E`), semi-bold
- **Shape**: Pill (`rounded-full`)
- **Padding**: `px-4 py-1`
- **Icon**: Optional leading emoji or icon

### Stats Bubbles

- **Background**: White with glass effect (`backdrop-blur-sm`)
- **Border**: 1px light border
- **Shape**: `rounded-xl`
- **Number**: Large, bold, Deep Violet
- **Label**: Small, muted text below

### Input Fields

- **Background**: White
- **Border**: 2px light grey, focus → Magenta
- **Border radius**: `rounded-xl`
- **Padding**: `px-4 py-3`
- **Focus**: Ring outline in Magenta

---

## Accessibility Notes

### Colour Contrast

- Text on White: Deep Violet (`#4A0F7E`) — **12.5:1** ✅
- Text on Magenta: White — **4.8:1** ✅ (AA for large text)
- Text on gradient: White with text-shadow for safety

### Touch Targets

- Minimum: 44px × 44px
- Recommended: 48px × 48px for primary actions

### Focus States

- Visible focus ring on all interactive elements
- `focus:ring-2 focus:ring-offset-2 focus:ring-brand-magenta`

### Motion

- Respect `prefers-reduced-motion`
- Disable animations when preference is set

### Screen Readers

- Semantic HTML throughout
- ARIA labels where visuals convey meaning
- Announce state changes with `aria-live`

---

## Background Image Usage

- Prevent banding on large screens with subtle noise layer (`background-image: url('/noise.png')`) at `opacity: 0.08`
- Keep content within a max‑width container to preserve readability

---

## Example Layout Snippet

```tsx
// Full-screen with gradient header
<div className="min-h-screen bg-warm-ivory">
  {/* Gradient header */}
  <header className="bg-brand-gradient px-6 py-4">
    <h1 className="text-white text-xl font-bold">empwrU</h1>
  </header>

  {/* Main content */}
  <main className="max-w-md mx-auto px-4 py-6 space-y-6">
    {/* Card example */}
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-deep-violet font-semibold mb-2">Your Goal</h2>
      <p className="text-deep-violet/70">Build interview confidence</p>
    </div>

    {/* Primary button */}
    <button className="w-full bg-magenta text-white font-semibold py-4 rounded-full hover:scale-102 transition-transform">
      Continue
    </button>
  </main>
</div>
```

---

## CSS Custom Properties

```css
:root {
  --color-white: #ffffff;
  --color-charcoal: #030303;
  --color-magenta: #bc03b9;
  --color-deep-violet: #4a0f7e;
  --color-warm-ivory: #efebee;
  --color-pumpkin: #f27321;

  --gradient-brand: linear-gradient(
    135deg,
    #4a0f7e 0%,
    #bc03b9 45%,
    #f27321 100%
  );

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 9999px;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```
