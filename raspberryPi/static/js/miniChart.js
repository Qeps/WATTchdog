'use strict';
import { cssVar } from './helpers.js';

export class MiniChart {
  constructor(canvas, { yMin = 0, yMax = 2000, maxPoints = 120 } = {}) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.maxPoints = maxPoints;
    this.yMin = yMin; this.yMax = yMax;
    this.data = [];
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement || canvas);
    this.resize();
  }
  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.c.getBoundingClientRect();
    this.c.width = Math.max(10, rect.width * dpr);
    this.c.height = Math.max(10, rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw();
  }
  push(val) {
    this.data.push({ t: Date.now(), y: val });
    if (this.data.length > this.maxPoints) this.data.shift();
    this.draw();
  }
  draw() {
    const ctx = this.ctx;
    const { width: w, height: h } = this.c.getBoundingClientRect();
    ctx.clearRect(0, 0, w, h);

    const grid = cssVar('--muted') || '#9aa';
    const line = cssVar('--accent') || '#22c55e';
    const text = cssVar('--muted') || '#9aa';

    const L = 38, R = 10, T = 10, B = 18;
    const iw = w - L - R, ih = h - T - B;

    ctx.save();
    ctx.translate(L, T);

    // grid
    ctx.strokeStyle = grid; ctx.globalAlpha = 0.25; ctx.lineWidth = 1;
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
      const y = ih - (ih / ticks) * i;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(iw, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // y labels
    ctx.fillStyle = text; ctx.font = '12px system-ui, Arial'; ctx.textAlign = 'right';
    for (let i = 0; i <= ticks; i++) {
      const v = this.yMin + (this.yMax - this.yMin) / ticks * i;
      const y = ih - (ih / ticks) * i;
      ctx.fillText(Math.round(v), -8, y + 4);
    }

    // line
    if (this.data.length > 1) {
      const tMin = this.data[0].t;
      const tMax = this.data[this.data.length - 1].t;
      const span = Math.max(1, tMax - tMin);
      ctx.strokeStyle = line; ctx.lineWidth = 2; ctx.beginPath();
      this.data.forEach((p, i) => {
        const x = ((p.t - tMin) / span) * iw;
        const y = ih - ((p.y - this.yMin) / (this.yMax - this.yMin)) * ih;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
    ctx.restore();
  }
}
