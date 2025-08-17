'use strict';
import { $ } from './helpers.js';
import { MiniChart } from './miniChart.js';
import { getDevices } from './devices.js';

let liveTimers = [];
export let liveCharts = [];

function makePowerSimulator() {
  let v = 350 + Math.random() * 50;
  return () => {
    v += (Math.random() - 0.5) * 30;
    if (Math.random() < 0.03) v += (Math.random() < 0.5 ? -1 : 1) * (150 + Math.random() * 250);
    v = Math.max(0, Math.min(1800, v));
    return v;
  };
}

export async function buildLiveCards() {
  const host = $('#liveList');
  if (!host) return;
  host.innerHTML = '';
  liveCharts = [];

  const devices = await getDevices();

  devices.forEach(dev => {
    const card = document.createElement('div');
    card.className = 'card live-card';
    card.innerHTML = `
      <div class="device-bar">
        <div class="device-id">
          <span class="badge">WATTCHdog</span> <strong>#${dev.id}</strong>
          ${dev.online ? '' : '<span class="muted small" style="margin-left:.5rem;">offline</span>'}
        </div>
      </div>
      <div class="chart-head"><h3>Active power</h3></div>
      <div class="chart-wrap"><canvas id="pow-${dev.id}"></canvas></div>
    `;
    host.appendChild(card);

    const canvas = card.querySelector('canvas');
    const chart = new MiniChart(canvas, { yMin: 0, yMax: 2000, maxPoints: 120 });
    liveCharts.push({ dev, chart });
  });
}

export function startLiveView() {
  stopLiveView();
  liveTimers = liveCharts.map(({ chart }) => {
    const sim = makePowerSimulator();
    for (let i = 0; i < 20; i++) chart.push(sim()); // seed
    return setInterval(() => chart.push(sim()), 500);
  });
}

export function stopLiveView() {
  liveTimers.forEach(t => clearInterval(t));
  liveTimers = [];
}
