'use strict';
import { initTheme, toggleTheme } from './theme.js';
import { showSection, initNavigation } from './navigation.js';

document.addEventListener('DOMContentLoaded', () => {
  // motyw
  initTheme();
  document.querySelector('#themeToggle')?.addEventListener('click', toggleTheme);

  // nawigacja
  document.querySelectorAll('.menu a, .hero-actions a').forEach(a => {
    a.addEventListener('click', (e) => {
      const sec = a.dataset.section;
      if (sec) { e.preventDefault(); showSection(sec); }
    });
  });
  const first = (location.hash || '#start').slice(1);
  showSection(first);
  initNavigation();

  // footer IP
  const ipLabel = document.querySelector('#ipLabel');
  if (window.RPI_IP && ipLabel) ipLabel.textContent = window.RPI_IP;
});
