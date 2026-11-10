# Project guide for Claude

## What this app is
An educational website that helps teachers, parents and classmates understand ADHD, dyslexia and dyscalculia through clear information and interactive simulations.
Write for adults and teens who don't have these conditions.
Accessibility is the product, not an extra. Every decision should make the site easier to use for every visitor, including people who have these conditions.

## Stack
- Frontend: plain static HTML pages + one shared `style.css` + vanilla JavaScript (no framework, no build step).
- Backend / database / auth: none. `server.py` is a tiny Flask app that only serves the static files for local dev. No database, no accounts, no data collection.
- Hosting: not configured in the repo (source lives at github.com/LorenzoUrrutia/different-minds). Any static host works.
- Key folders:
  - Root `*.html`: one file per page. Topic pages (`adhd.html`, `dyslexia.html`, `dyscalculia.html`), their subpages (`*-eval.html`, `adhd-*.html`, `dyslexia-spectrum.html`, `dyscalculia-symptoms.html`, `executive-function.html`), simulations (`simulations.html`, `sim-*.html`), and reflections (`reflection-*.html`).
  - `js/`: `site.js` (loaded on every page: injects the logo, smooth hash scrolling), `myth-fact.js` (the Myth/Fact quiz cards on the topic pages), `sim-safety.js` (warning, Esc pause menu, calmer mode shared by all simulations), `sim-*.js` (one per simulation), plus the ADHD sim's ambient audio file.
  - `tests/`: Playwright end-to-end + axe accessibility tests.
  - The header nav is copy-pasted into every page; update all pages when changing it.
  - Brand colors live in `style.css` as `--color-adhd`, `--color-dyslexia`, `--color-dyscalculia` and are tuned to pass AA with white text. Use the variables, not hard-coded hex.
  - New pages are picked up by the tests automatically (`tests/pages.js` lists every root `*.html`).

## Commands
- Install: `npm install && npx playwright install chromium` (Flask only needed for `server.py`: `pip install flask`)
- Run locally: `python3 server.py` → http://127.0.0.1:8000 (or `npx http-server -p 8000`, which is what the tests use)
- Test (everything): `npm test`
- Lint / format: none set up.

## How to work
- For any task bigger than a small edit, outline the plan first and wait for approval before changing code.
- After every code change, run the tests. If anything fails, find the root cause, fix it, and rerun. Repeat until all tests pass.
- Never call a task done unless tests pass. When finished, summarize what changed and what you tested.
- If a fix still fails after 3 tries, stop and explain what's wrong and what you've tried, instead of continuing to guess.
- Don't weaken, skip, or delete a test just to make it pass. If a test seems wrong, say so and ask.
- Commit after each working step with a clear message. Never commit secrets or API keys.
- Keep changes focused on the task. Don't refactor unrelated code without asking.

## Facts and sources
- Every factual claim on the site must come from `docs/facts.md` and show its source as a numbered citation.
- Never add a statistic or claim from memory.
- If a page needs a fact that isn't in `docs/facts.md`, stop and ask the owner.
- Never use anything listed under "Claims to avoid" in `docs/facts.md`.

## Accessibility rules (always apply)
- Everything works with a keyboard alone (Tab, Shift+Tab, Enter, Space, Esc), with a visible focus outline.
- Everything works with a screen reader: real buttons and links, labels on every input, alt text on images, headings in order.
- Text: readable, dyslexia-friendly font option, line height at least 1.5, short paragraphs, plain language, no justified text.
- Color contrast meets WCAG AA. Never use color as the only signal.
- Focus and attention: no autoplay, no flashing, no surprise pop-ups. Any timer can be paused or turned off.
- Math and numbers: offer a visual or step-by-step version, not just raw numbers.
- Respect the user's settings: reduced motion, text size, and zoom up to 200% without breaking the layout.
- Run the `accessibility-review` skill after building or changing any UI.

## Simulations (`sim-*.html`) are intentionally difficult
- The simulations are research-based. Don't change simulation behavior (content, intensity levels, distraction types, timing, how they look or feel), reflection text, or the book passages without the owner's approval. If a fix would change the standard version, stop and ask first.
- The difficulty is the point. Don't remove the distractions, scrambled text, timers or interruptions. Add safety *around* the simulation instead.
- Every simulation must:
  - show a short warning before it starts, saying what it will do (nothing moves or plays until the visitor presses Start);
  - be pausable and exitable at any time, including with the keyboard (Esc opens a pause menu with Resume / Restart / Exit);
  - never flash more than 3 times per second (seizure safety);
  - respect reduced-motion settings by offering a calmer version (pre-selected when the device asks for reduced motion);
  - include a screen-reader description of what the simulation shows.
- The shared safety layer lives in `js/sim-safety.js`; tests are in `tests/simulations.spec.js`.
- The "no flashing / no surprise pop-ups / timers" rules above apply to everything else on the site. Inside a running simulation, these five rules apply instead.

## Pending simulation work
At the start of any session where the owner hasn't scheduled these yet, remind them about this list. The approval rule above still applies to each item.
- Shared flow for every simulation: intro, baseline round, simulated round, results, reflection.
- ADHD: answer checking and a score.
- Dyslexia: a decoding mode, and honest relabeling of the moving-text mode.
- Dyscalculia: everyday tasks, and its own reflection page.
- Same intensity names on all three simulations: Mild / Moderate / Strong.
- Redesigned reflections.
- Voices section.
- Decide about the book passages.

## Visitor data
- Visitors may be minors. Collect only the data the app actually needs.
- Never log or expose personal info, and keep learning-disability details private by default.
