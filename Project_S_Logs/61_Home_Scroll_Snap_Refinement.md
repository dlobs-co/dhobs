# 61 — Home Scroll Snap Refinement

**Date:** April 18, 2026
**Author:** Basil Suhail
**Related Issue:** #272
**PR:** TBD
**Status:** Ready for review

---

## Context

The dashboard home page now includes an embedded vertical journey:

- Home
- Metrics
- Backups

That flow needed to feel like three separate full-screen pages while still preserving native inner scrolling inside the embedded Metrics and Backups views. The original implementation could skip past Metrics under wheel momentum, leak scroll gestures across section boundaries, and show a loading takeover that made the Metrics embed feel unstable.

## What Changed

### 1. Stronger Section Snap Control

- Reworked the home page wheel handling to treat Home, Metrics, and Backups as discrete snap sections.
- Added boundary-aware transitions so inner scroll regions consume scroll normally until their top or bottom edge is reached.
- Tightened section handoff so a fresh wheel gesture is required before moving from one full-page section to the next, reducing accidental skips caused by aggressive mouse-wheel momentum.

### 2. Embedded Metrics / Backups Scroll Handoff

- Passed the embedded scroll containers for Metrics and Backups back up to the home controller.
- Prevented the home page from programmatically driving the inner panels, which was causing visible “self-scrolling” glitches.
- Preserved the standalone dock-opened app pages as independent non-embedded experiences.

### 3. Metrics Loading UX

- Removed the full-screen “Loading metrics...” takeover from the embedded Metrics experience.
- Kept the page shell mounted with inline loading states and cached metrics/history when available so the transition feels stable while data refreshes.

### 4. Embedded Scroll Cue

- Added a `Scroll for backups` indicator to the embedded Metrics section.
- Scoped that cue to the home scroll flow only, so the standalone Metrics page opened from the dock does not show it.

## Files Changed

| File | Change |
|------|--------|
| `Dashboard/Dashboard1/app/page.tsx` | Reworked home snap behavior, section transition gating, and embedded scroll orchestration. |
| `Dashboard/Dashboard1/components/dashboard/metrics-section.tsx` | Added embedded scroll cue support and replaced the blocking loading takeover with inline loading behavior. |
| `Dashboard/Dashboard1/components/dashboard/backup-section.tsx` | Exposed the embedded backups scroll container to the home page controller. |

## Result

- Home, Metrics, and Backups now behave like distinct pages in the home flow.
- Metrics no longer gets skipped as easily during mouse-wheel scrolling.
- Embedded Metrics and Backups continue to scroll internally without breaking the page snap model.
- The dock-opened standalone app pages remain clean and separate from the embedded home experience.
