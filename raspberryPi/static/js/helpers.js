'use strict';

export function $(sel, parent = document) { return parent.querySelector(sel); }
export function $all(sel, parent = document) { return Array.from(parent.querySelectorAll(sel)); }
export function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
