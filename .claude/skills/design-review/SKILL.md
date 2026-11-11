---
name: design-review
description: Use after building or changing any UI, page, or component, to check the design comes from the subject and does not look AI-generated. Run it together with accessibility-review.
---

# Design review

Run this on every UI change, alongside the `accessibility-review` skill. Fix problems as you go, then rerun until the review is clean.

## 1. AI tells to avoid (unless the owner asks for them)
- Warm cream/paper backgrounds (near `#F4F1EA` / `#FBF8F3`) with hairline rules and newspaper-style columns.
- Content chopped into identical cards with the same radius and soft grey shadow everywhere; gradient washes as decoration.
- Generic icon sets (Lucide etc.) and made-up logo marks.
- ALL-CAPS eyebrow labels above headings; unnecessary labels.
- Accenting one word in a headline with color/italic/bold.
- "→" appended to links and buttons; "A · B · C" middle-dot strings; "WORD — fragment" labels.
- Numbered markers (01/02/03) unless the content is truly a sequence.
- Fade-in-on-scroll sections and hover-lift on every card.
- Near-black `#111` instead of real black; monospace for small labels.

## 2. Principles
- Design choices come from the subject: learning differences, reading, attention, numbers, teachers, parents and classmates.
- Spend boldness in ONE memorable place; keep everything else quiet.
- Structure (borders, numbers, dividers) only when it carries meaning.
- Before finishing, remove one decorative thing.
- Copy: plain words, sentence case, links say exactly where they go.
- Keep all accessibility rules in `CLAUDE.md`.

## 3. How to run it
- Screenshot each changed page at desktop (1440px) and phone (390px) width and look at the screenshots, not just the code.
- Go through every item in section 1 and name where it appears, or confirm it does not.
- For each visible design choice (color, border, shape, layout), say which part of the subject it comes from. If the only reason is "it looks nice", remove it or replace it.
- Name the one memorable place on the page. If there are two, quiet one of them.
- Remove one decorative thing and say what it was.
- Check the copy: sentence case, no "click here", every link names its destination. Don't change facts, citations, simulation or reflection text while doing this; ask the owner instead.

## 4. Report
- List the tells found and fixed, the decorative thing removed, and anything that needs the owner's decision.
