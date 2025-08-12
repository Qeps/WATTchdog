'use strict';
import { $, $all } from './helpers.js';
import { buildLiveCards, startLiveView, stopLiveView } from './liveView.js';
import { buildConfigGroups } from './configEditor.js';

export function showSection(name) {
  $all('.menu a').forEach(a => a.classList.toggle('active', a.dataset.section === name));
  $all('.section').forEach(s => s.classList.toggle('visible', s.id === `section-${name}`));
  history.replaceState(null, "", `#${name}`);

  if (name === 'live') {
    buildLiveCards();
    startLiveView();
  } else {
    stopLiveView();
  }

  if (name === 'config') {
    buildConfigGroups();
  }
}

export function initNavigation() {
  window.addEventListener('hashchange', () => {
    const sec = (location.hash || '#start').slice(1);
    showSection(sec);
  });
}
