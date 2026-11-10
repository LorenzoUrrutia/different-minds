---
name: accessibility-review
description: Use after building or changing any UI, page, or component, to check it works for students with dyslexia, ADHD, and dyscalculia and meets WCAG AA.
---

# Accessibility review

Run this after any UI change. Fix problems as you go, then rerun until the review is clean.

## 1. Automated checks
- Run the axe accessibility tests (through Playwright). If they aren't set up yet, add them first.
- Fix every reported issue. Rerun until there are zero.

## 2. Keyboard
- Go through the changed feature using only the keyboard.
- Every control can be reached and used, the tab order makes sense, focus is always visible, and Esc closes dialogs.
- Focus never gets trapped and never jumps somewhere unexpected.

## 3. Screen reader
- Buttons and links have clear names (no "click here").
- Inputs have labels, images have alt text (or are marked decorative), headings go in order.
- Changes that appear without a page reload (errors, results) are announced.

## 4. Dyslexia
- Text is in short chunks, in plain language, left-aligned, with line height at least 1.5.
- The dyslexia-friendly font and text-size settings still work on this screen.
- Instructions can be read aloud if the app supports text-to-speech.

## 5. ADHD and focus
- One main task per screen, with a clear next step.
- No autoplay, flashing, or surprise pop-ups. Timers can be paused or turned off.
- Progress is visible and saved, so a student can stop and come back.

## 6. Dyscalculia
- Numbers come with a visual (bar, blocks, number line) or a step-by-step option.
- Avoid dense tables of numbers. Don't put a timer on math.

## 7. Layout
- Works at 200% zoom and on a small Chromebook screen without anything breaking or overlapping.
- Respects reduced-motion settings. Contrast meets WCAG AA.

## 8. Report
- Rerun the full test suite.
- Summarize: what you checked, what you fixed, and anything you couldn't fix that needs a human decision.
