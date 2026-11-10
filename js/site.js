// Minimal site JS: logo injection and smooth anchor scrolling
document.addEventListener('DOMContentLoaded', () => {
  const topbarContainers = document.querySelectorAll('header.topbar .container');
  topbarContainers.forEach((container) => {
    if (container.querySelector('.site-logo')) return;
    const logo = document.createElement('div');
    logo.className = 'site-logo';
    logo.innerHTML = '<span class="site-logo-badge"><span>Different</span><span>Minds</span></span>';
    container.prepend(logo);
  });

  // Delegate clicks on same-page hash links
  document.body.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', href);
    }
  });
});
