'use strict';

/* ===== Helpers ===== */
function $(sel, parent=document){ return parent.querySelector(sel); }
function $all(sel, parent=document){ return Array.from(parent.querySelectorAll(sel)); }

/* ===== Live devices (mock for now) ===== */
const LIVE_DEVICES = [
  { name: 'WATCHdog', id: '111111' },
  { name: 'WATCHdog', id: '111112' },
];

/* ===== Theme (Dark/Light) ===== */
function applyTheme(t){
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
  const btn = $('#themeToggle');
  if(btn) btn.textContent = (t === 'light') ? 'Dark theme' : 'Light theme';
  // przerysuj wykresy po zmianie motywu
  liveCharts.forEach(({chart}) => chart.draw());
}
function initTheme(){
  const saved = localStorage.getItem('theme');
  const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches;
  applyTheme(saved || (prefersLight ? 'light' : 'dark'));
}

/* ===== Live View: tiny canvas chart ===== */
function cssVar(name){
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

class MiniChart {
  constructor(canvas, {yMin=0, yMax=2000, maxPoints=120}={}){
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.maxPoints = maxPoints;
    this.yMin = yMin; this.yMax = yMax;
    this.data = [];
    this.resizeObserver = new ResizeObserver(()=> this.resize());
    this.resizeObserver.observe(canvas.parentElement || canvas);
    this.resize();
  }
  resize(){
    const dpr = window.devicePixelRatio || 1;
    const rect = this.c.getBoundingClientRect();
    this.c.width = Math.max(10, rect.width*dpr);
    this.c.height = Math.max(10, rect.height*dpr);
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
    this.draw();
  }
  push(val){
    this.data.push({t: Date.now(), y: val});
    if(this.data.length > this.maxPoints) this.data.shift();
    this.draw();
  }
  draw(){
    const ctx = this.ctx;
    const {width:w, height:h} = this.c.getBoundingClientRect();
    ctx.clearRect(0,0,w,h);

    const grid = cssVar('--muted') || '#9aa';
    const line = cssVar('--accent') || '#22c55e';
    const text = cssVar('--muted') || '#9aa';

    const L=38, R=10, T=10, B=18;
    const iw = w - L - R, ih = h - T - B;

    ctx.save();
    ctx.translate(L,T);

    // grid
    ctx.strokeStyle = grid; ctx.globalAlpha = 0.25; ctx.lineWidth = 1;
    const ticks = 4;
    for(let i=0;i<=ticks;i++){
      const y = ih - (ih/ticks)*i;
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(iw,y); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // y labels
    ctx.fillStyle = text; ctx.font = '12px system-ui, Arial'; ctx.textAlign = 'right';
    for(let i=0;i<=ticks;i++){
      const v = this.yMin + (this.yMax-this.yMin)/ticks*i;
      const y = ih - (ih/ticks)*i;
      ctx.fillText(Math.round(v), -8, y+4);
    }

    // line
    if(this.data.length>1){
      const tMin = this.data[0].t;
      const tMax = this.data[this.data.length-1].t;
      const span = Math.max(1, tMax - tMin);
      ctx.strokeStyle = line; ctx.lineWidth = 2; ctx.beginPath();
      this.data.forEach((p,i)=>{
        const x = ((p.t - tMin) / span) * iw;
        const y = ih - ((p.y - this.yMin) / (this.yMax - this.yMin)) * ih;
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      });
      ctx.stroke();
    }
    ctx.restore();
  }
}

// mock data generator
function makePowerSimulator(){
  let v = 350 + Math.random()*50;
  return () => {
    v += (Math.random()-0.5) * 30;
    if(Math.random()<0.03) v += (Math.random()<0.5?-1:1) * (150 + Math.random()*250);
    v = Math.max(0, Math.min(1800, v));
    return v;
  };
}

let liveTimers = [];
let liveCharts = [];

function buildLiveCards(){
  const host = $('#liveList');
  if(!host) return;
  host.innerHTML = '';
  liveCharts = [];
  LIVE_DEVICES.forEach(dev=>{
    const card = document.createElement('div');
    card.className = 'card live-card';
    card.innerHTML = `
      <div class="device-bar">
        <div class="device-id">
          <span class="badge">WATCHdog</span> <strong>#${dev.id}</strong>
        </div>
      </div>
      <div class="chart-head"><h3>Active power</h3></div>
      <div class="chart-wrap"><canvas id="pow-${dev.id}"></canvas></div>
    `;
    host.appendChild(card);

    const canvas = card.querySelector('canvas');
    const chart = new MiniChart(canvas, {yMin:0, yMax:2000, maxPoints:120});
    liveCharts.push({dev, chart});
  });
}
function startLiveView(){
  stopLiveView();
  liveTimers = liveCharts.map(({chart})=>{
    const sim = makePowerSimulator();
    for(let i=0;i<20;i++) chart.push(sim());    // seed
    return setInterval(()=> chart.push(sim()), 500);
  });
}
function stopLiveView(){
  liveTimers.forEach(t=> clearInterval(t));
  liveTimers = [];
}

/* ===== Config: Events editor (per device/root) ===== */
function recipientNames(root){
  const get = i => ($(`.recipients .r-name[data-index="${i}"]`, root)?.value || '').trim();
  return [get(1)||'Recipient 1', get(2)||'Recipient 2', get(3)||'Recipient 3'];
}
function buildRecipientSelect(root, selected){
  const sel = document.createElement('select');
  sel.className = 'recipient';
  recipientNames(root).forEach(name=>{
    const o = document.createElement('option'); o.value = name; o.textContent = name;
    sel.appendChild(o);
  });
  if(selected) sel.value = selected;
  return sel;
}
function renderEventsEditor(root){
  const box = $('.events-editor', root);
  if(!box) return;
  box.innerHTML = '';

  const triggerOptions = ['manual', 'threshold', 'time-window', 'power-spike', 'custom'];
  for(let i=1; i<=9; i++){
    const row = document.createElement('div'); row.className = 'events-row';
    const idx = document.createElement('div'); idx.className = 'idx'; idx.textContent = String(i).padStart(2,'0');

    const recWrap = document.createElement('div');
    recWrap.appendChild(buildRecipientSelect(root));

    const trig = document.createElement('select'); trig.className = 'trigger';
    triggerOptions.forEach(t=>{ const o=document.createElement('option'); o.value=t; o.textContent=t; trig.appendChild(o); });

    const ckSms = document.createElement('label'); ckSms.className = 'ck sms'; ckSms.innerHTML = `<input type="checkbox"> SMS`;
    const ckEmail = document.createElement('label'); ckEmail.className = 'ck email'; ckEmail.innerHTML = `<input type="checkbox"> Email`;

    row.append(idx, recWrap, trig, ckSms, ckEmail);
    box.appendChild(row);
  }
}
function refreshRecipientOptions(root){
  const names = recipientNames(root);
  $all('select.recipient', root).forEach(sel=>{
    const current = sel.value;
    sel.innerHTML = '';
    names.forEach(name=>{ const o=document.createElement('option'); o.value=name; o.textContent=name; sel.appendChild(o); });
    if(names.includes(current)) sel.value = current;
  });
}

function buildConfigGroups(){
  const host = $('#configList');
  if(!host) return;
  host.innerHTML = '';

  LIVE_DEVICES.forEach(dev=>{
    const group = document.createElement('div');
    group.className = 'config-group';

    group.innerHTML = `
      <div class="device-bar">
        <div class="device-id">
          <span class="badge">WATCHdog</span> <strong>#${dev.id}</strong>
        </div>
        <button class="btn primary send-config-btn" data-device="${dev.id}">Send configuration</button>
      </div>

      <div class="grid two">
        <div class="card">
          <h3>Recipients (max 3)</h3>
          <form class="mini-grid recipients" data-device="${dev.id}">
            <label>Name 1 <input class="r-name" data-index="1" type="text" placeholder="e.g., John"></label>
            <label>Email 1 <input class="r-email" data-index="1" type="email" placeholder="john@example.com"></label>
            <label>Phone 1 <input class="r-phone" data-index="1" type="text" placeholder="+48 600 000 000"></label>

            <label>Name 2 <input class="r-name" data-index="2" type="text" placeholder="e.g., Anna"></label>
            <label>Email 2 <input class="r-email" data-index="2" type="email" placeholder="anna@example.com"></label>
            <label>Phone 2 <input class="r-phone" data-index="2" type="text" placeholder="+48 700 000 000"></label>

            <label>Name 3 <input class="r-name" data-index="3" type="text" placeholder="e.g., Mark"></label>
            <label>Email 3 <input class="r-email" data-index="3" type="email" placeholder="mark@example.com"></label>
            <label>Phone 3 <input class="r-phone" data-index="3" type="text" placeholder="+48 800 000 000"></label>
          </form>
        </div>

        <div class="card">
          <h3>Events (max 9)</h3>
          <p class="muted small">Each event: choose recipient and trigger mode, then pick notification channels.</p>
          <div class="events-header">
            <div>#</div><div>Recipient</div><div>Trigger mode</div><div>SMS</div><div>Email</div>
          </div>
          <div class="events-editor"></div>
        </div>
      </div>
    `;

    host.appendChild(group);

    // render rows for this device
    renderEventsEditor(group);

    // keep selects in sync with recipient names
    $all('.recipients .r-name', group).forEach(inp=>{
      inp.addEventListener('input', ()=> refreshRecipientOptions(group));
    });

    // send config button (per-device)
    $('.send-config-btn', group)?.addEventListener('click', (e)=>{
      const btn = e.currentTarget;
      btn.textContent = 'Sending… (placeholder)';
      setTimeout(()=> btn.textContent = 'Send configuration', 900);
      // TODO: build payload & POST /api/config
    });
  });
}

/* ===== Navigation (single source of truth) ===== */
function showSection(name){
  $all('.menu a').forEach(a => a.classList.toggle('active', a.dataset.section===name));
  $all('.section').forEach(s => s.classList.toggle('visible', s.id === `section-${name}`));
  history.replaceState(null, "", `#${name}`);

  if(name === 'live'){
    buildLiveCards();
    startLiveView();
  } else {
    stopLiveView();
  }

  if(name === 'config'){
    buildConfigGroups();
  }
}
window.addEventListener('hashchange', ()=>{
  const sec = (location.hash || '#start').slice(1);
  showSection(sec);
});

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded', () => {
  // theme
  initTheme();
  $('#themeToggle')?.addEventListener('click', ()=>{
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(cur === 'light' ? 'dark' : 'light');
  });

  // nav
  $all('.menu a, .hero-actions a').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const sec = a.dataset.section;
      if(sec){ e.preventDefault(); showSection(sec); }
    });
  });
  const first = (location.hash || '#start').slice(1);
  showSection(first);

  // footer IP
  const ipLabel = $('#ipLabel');
  if(window.RPI_IP && ipLabel) ipLabel.textContent = window.RPI_IP;
});
