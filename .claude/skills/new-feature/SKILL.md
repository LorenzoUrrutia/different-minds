---
name: new-feature
description: Use when building a new feature or making a significant change to the app. Covers planning, building, the test-and-fix loop, accessibility review, and committing.
---

# Building a new feature

## 1. Understand
- Restate the feature in one or two sentences: who it's for (which students) and what it lets them do.
- If anything important is unclear, ask before planning.

## 2. Plan (wait for approval)
- List the files you'll create or change and why.
- List the tests you'll add, including at least one that walks through the feature like a student would.
- Note any accessibility risks specific to this feature.
- Stop and wait for approval before writing code.

## 3. Build in small steps
- Make one small, working change at a time.
- After each step, run the tests. If anything fails, find the root cause, fix it, and rerun. Repeat until it passes.
- If the same problem fails 3 times, stop and explain what's happening instead of guessing.
- Never weaken or skip a test to make it pass.
- Commit after each working step.

## 4. Review
- Run the `accessibility-review` skill on everything you changed.
- Reread your own changes as a reviewer would: leftover debug code, unclear names, missing error handling, anything that exposes student data.

## 5. Finish
- Run the full test suite one last time. It must pass.
- Summarize for the user: what the feature does, the files changed, the tests added, and anything to try manually (for example, "try it with a screen reader").
