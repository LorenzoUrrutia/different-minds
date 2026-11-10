// Shared safety layer for the simulations (sim-*.html).
//
// The simulations are research-based and intentionally difficult. This file
// does NOT change what they simulate. It only adds safety *around* them:
//   - a warning card before anything moves or plays
//   - Esc opens a pause menu (Resume / Restart / Exit) at any time
//   - a "calmer version" option, pre-selected when the device asks for reduced motion
//   - simple modal handling (focus in, focus back, background made inert)
//
// Each page calls SimSafety.init({...}) with small adapters for its simulation.
(function () {
  const reducedMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const SimSafety = {
    calm: false,       // true when the student chose the calmer version
    started: false,
    reducedMotion,
    init,
    openModal,
    closeModal,
  };
  window.SimSafety = SimSafety;

  // ---- Modal stack: focus in, background inert, focus back on close ----
  const modalStack = [];

  function setBackgroundInert() {
    const top = modalStack[modalStack.length - 1];
    Array.from(document.body.children).forEach((el) => {
      if (el.tagName === 'SCRIPT') return;
      el.inert = !!top && el !== top.el;
    });
  }

  function openModal(el, focusTarget) {
    if (modalStack.some((m) => m.el === el)) return;
    modalStack.push({ el, returnTo: document.activeElement });
    setBackgroundInert();
    const target = focusTarget || el.querySelector('button, [href], select, [tabindex]');
    if (target) target.focus();
  }

  function closeModal(el) {
    const index = modalStack.findIndex((m) => m.el === el);
    if (index === -1) return;
    const [entry] = modalStack.splice(index, 1);
    setBackgroundInert();
    const top = modalStack[modalStack.length - 1];
    const back = entry.returnTo;
    if (back && back.isConnected && back !== document.body && (!top || top.el.contains(back))) {
      back.focus();
    } else if (top) {
      const t = top.el.querySelector('button, [href], select, [tabindex]');
      if (t) t.focus();
    }
  }

  function isOpen(el) {
    return modalStack.some((m) => m.el === el);
  }

  // ---- Markup ----
  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function buildWarning(opts) {
    const calmFirst = reducedMotion;
    const points = opts.warningPoints.map((p) => `<li>${p}</li>`).join('');
    const standardBtn = '<button type="button" class="sim-safety-btn" data-start="standard">Start</button>';
    const calmBtn = '<button type="button" class="sim-safety-btn" data-start="calm">Start calmer version</button>';
    const node = el(`
      <div id="simWarning" class="sim-safety-overlay" role="dialog" aria-modal="true"
           aria-labelledby="simWarningTitle" aria-describedby="simWarningBody">
        <div class="sim-safety-card">
          <h2 id="simWarningTitle">Before you start: ${opts.name} simulation</h2>
          <div id="simWarningBody">
            <p>This simulation is meant to feel hard. It will:</p>
            <ul>${points}</ul>
            <p>Press <kbd>Esc</kbd> at any time to pause or leave.</p>
            <p>The calmer version keeps the same tasks with less movement.${
              calmFirst ? ' Your device is set to reduce motion, so we suggest it.' : ''
            }</p>
          </div>
          <div class="sim-safety-actions">
            ${calmFirst ? calmBtn + standardBtn : standardBtn + calmBtn}
            <a class="sim-safety-btn sim-safety-btn--quiet" href="simulations.html">Go back</a>
          </div>
        </div>
      </div>`);
    node.querySelector('.sim-safety-btn').classList.add('sim-safety-btn--primary');
    return node;
  }

  function buildPauseMenu() {
    return el(`
      <div id="simPauseMenu" class="sim-safety-overlay" role="dialog" aria-modal="true"
           aria-labelledby="simPauseTitle" aria-describedby="simPauseBody" hidden>
        <div class="sim-safety-card">
          <h2 id="simPauseTitle">Simulation paused</h2>
          <p id="simPauseBody">Take a break. Nothing will change until you resume.</p>
          <div class="sim-safety-actions">
            <button type="button" class="sim-safety-btn sim-safety-btn--primary" data-action="resume">Resume</button>
            <button type="button" class="sim-safety-btn" data-action="restart">Restart from the beginning</button>
            <a class="sim-safety-btn sim-safety-btn--quiet" href="simulations.html">Exit simulation</a>
          </div>
        </div>
      </div>`);
  }

  // ---- Init ----
  function init(opts) {
    const warning = buildWarning(opts);
    const pauseMenu = buildPauseMenu();
    document.body.appendChild(warning);
    document.body.appendChild(pauseMenu);
    let pausedByMenu = false;

    function start(calm) {
      SimSafety.calm = calm;
      SimSafety.started = true;
      document.body.classList.toggle('sim-calm', calm);
      closeModal(warning);
      warning.remove();
      opts.start(calm);
    }

    warning.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-start]');
      if (btn) start(btn.dataset.start === 'calm');
    });

    function openPauseMenu() {
      pausedByMenu = !opts.isPaused();
      if (pausedByMenu) opts.pause();
      pauseMenu.hidden = false;
      openModal(pauseMenu);
    }

    function resumeFromMenu() {
      pauseMenu.hidden = true;
      closeModal(pauseMenu);
      if (pausedByMenu) opts.resume();
      pausedByMenu = false;
    }

    pauseMenu.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      if (btn.dataset.action === 'resume') resumeFromMenu();
      if (btn.dataset.action === 'restart') window.location.reload();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if (!SimSafety.started) return; // warning card: nothing is running yet
      e.preventDefault();
      if (isOpen(pauseMenu)) {
        resumeFromMenu();
      } else if (opts.onEscape && opts.onEscape()) {
        // the simulation handled it (e.g. closed its own pop-up)
      } else {
        openPauseMenu();
      }
    });

    openModal(warning, warning.querySelector('.sim-safety-btn--primary'));
  }
})();
