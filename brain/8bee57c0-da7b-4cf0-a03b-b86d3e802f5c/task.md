# Refine Goal Detail Layout & Terminology

Implement a multi-row bento grid layout for the Goal Detail page and standardize terminology from "milestone" to "step" globally.

- [x] Standardize Terminology (Milestones → Steps)
  - [x] Update `storage.ts` (Renamed interface, properties, and functions)
  - [x] Update `[id]/page.tsx`
  - [x] Update `new/page.tsx`
  - [x] Update `checkin/page.tsx`
  - [x] Update `GoalProgressCard.tsx`
  - [x] Update `page.tsx` (Home/Stats)
  - [x] Update `progress/page.tsx`
- [x] Implement Goal Detail Bento Grid (`[id]/page.tsx`)
  - [x] Row 1: Goal Info (2/3) + Progress (1/3)
  - [x] Row 2: Category (25%) + Readiness (50%) + Success Criteria (25%)
  - [x] Row 3: Action Steps List (Full Width)
  - [x] Add inline editing for steps
  - [x] Add step deletion & creation
- [x] Code Cleanup & Quality
  - [x] Resolve React 19 `useEffect` lint errors
  - [x] Standardize container widths (`max-w-5xl`)
  - [x] Correct import paths (layouts vs ui)
  - [x] Final terminology sweep
- [x] Verification & Documentation
  - [x] Create Walkthrough
  - [x] Final review of UI polish
