'use strict';
import { liveCharts } from './liveView.js';

export function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
  const btn = document.querySelector('#themeToggle');
  if (btn) btn.textContent = (t === 'light') ? 'Dark theme' : 'Light theme';
  // przerysuj wykresy po zmianie motywu
  liveCharts.forEach(({ chart }) => chart.draw());
}

export function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches;
  applyTheme(saved || (prefersLight ? 'light' : 'dark'));
}

export function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(cur === 'light' ? 'dark' : 'light');
}
