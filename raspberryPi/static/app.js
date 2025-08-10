'use strict';

/* ===== Helpers ===== */
function $(sel, parent=document){ return parent.querySelector(sel); }
function $all(sel, parent=document){ return Array.from(parent.querySelectorAll(sel)); }

/* ===== Theme (Dark/Light) ===== */
function applyTheme(t){
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
  const btn = document.getElementById('themeToggle');
  if(btn) btn.textContent = (t === 'light') ? 'Dark theme' : 'Light theme';
}
function initTheme(){
  const saved = localStorage.getItem('theme');
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  applyTheme(saved || (prefersLight ? 'light' : 'dark'));
}

/* ===== Navigation ===== */
let pollTimer = null;
const POLL_INTERVAL_MS = 2000;

function startLivePolling(){
  if(!pollTimer){
    pollTimer = setInterval(loadMessages, POLL_INTERVAL_MS);
  }
}
function stopLivePolling(){
  if(pollTimer){
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function showSection(name){
  // highlight menu
  $all('.menu a').forEach(a => a.classList.toggle('active', a.dataset.section===name));
  // show section
  $all('.section').forEach(s => s.classList.toggle('visible', s.id === `section-${name}`));
  // update url
  history.replaceState(null, "", `#${name}`);

  // live polling
  if(name === 'live'){
    loadMessages();
    startLivePolling();
  } else {
    stopLivePolling();
  }
}

/* Keep in sync if user changes hash manually (back/forward) */
window.addEventListener('hashchange', ()=>{
  const sec = (location.hash || '#start').slice(1);
  showSection(sec);
});

/* ===== Live View ===== */
async function loadMessages(){
  try{
    const res = await fetch('/api/messages', {cache:'no-store'});
    if(!res.ok) return;
    const data = await res.json();
    const box = $('#messages');
    if(!box) return;
    box.innerHTML = '';
    (data.messages || []).slice().reverse().forEach(txt => {
      const div = document.createElement('div');
      div.className = 'item';
      div.textContent = txt;
      box.appendChild(div);
    });
  }catch{ /* silent */ }
}

async function sendMessage(txt){
  const res = await fetch('/api/send', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({text: txt})
  });
  return res.ok;
}

/* ===== Config: Events editor ===== */
function recipientNames(){
  const n1 = ($('#r_name_1')?.value || '').trim();
  const n2 = ($('#r_name_2')?.value || '').trim();
  const n3 = ($('#r_name_3')?.value || '').trim();
  return [n1||'Recipient 1', n2||'Recipient 2', n3||'Recipient 3'];
}

function buildRecipientSelect(selected){
  const sel = document.createElement('select');
  sel.className = 'recipient';
  recipientNames().forEach(name=>{
    const o = document.createElement('option');
    o.value = name; o.textContent = name;
    sel.appendChild(o);
  });
  if(selected) sel.value = selected;
  return sel;
}

function renderEventsEditor(){
  const box = $('#eventsEditor');
  if(!box) return;
  box.innerHTML = '';

  const triggerOptions = ['manual', 'threshold', 'time-window', 'power-spike', 'custom'];

  for(let i=1; i<=9; i++){
    const row = document.createElement('div');
    row.className = 'events-row';

    const idx = document.createElement('div');
    idx.className = 'idx';
    idx.textContent = String(i).padStart(2,'0');

    const recWrap = document.createElement('div');
    recWrap.appendChild(buildRecipientSelect());

    const trig = document.createElement('select');
    trig.className = 'trigger';
    triggerOptions.forEach(t=>{
      const o = document.createElement('option');
      o.value = t; o.textContent = t;
      trig.appendChild(o);
    });

    const ckSms = document.createElement('label');
    ckSms.className = 'ck sms';
    ckSms.innerHTML = `<input type="checkbox"> SMS`;

    const ckEmail = document.createElement('label');
    ckEmail.className = 'ck email';
    ckEmail.innerHTML = `<input type="checkbox"> Email`;

    row.append(idx, recWrap, trig, ckSms, ckEmail);
    box.appendChild(row);
  }
}

function refreshRecipientOptions(){
  const names = recipientNames();
  $all('#eventsEditor select.recipient').forEach(sel=>{
    const current = sel.value;
    sel.innerHTML = '';
    names.forEach(name=>{
      const o = document.createElement('option');
      o.value = name; o.textContent = name;
      sel.appendChild(o);
    });
    // try to keep previous choice
    if(names.includes(current)) sel.value = current;
  });
}

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded', () => {
  // theme
  initTheme();
  const themeBtn = $('#themeToggle');
  if(themeBtn){
    themeBtn.addEventListener('click', ()=>{
      const cur = document.documentElement.getAttribute('data-theme') || 'dark';
      applyTheme(cur === 'light' ? 'dark' : 'light');
    });
  }

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

  // live view form
  const form = $('#sendForm');
  const input = $('#msgInput');
  const status = $('#sendStatus');
  if(form){
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const txt = (input.value || '').trim();
      if(!txt){ status.textContent = 'Empty…'; return; }
      status.textContent = 'Sending…';
      const ok = await sendMessage(txt);
      status.textContent = ok ? 'OK' : 'Error';
      if(ok){ input.value=''; loadMessages(); }
      setTimeout(()=> status.textContent='', 800);
    });
    // polling only if on Live tab initially
    if(first === 'live'){ startLivePolling(); }
  }

  // config: events
  renderEventsEditor();

  // update recipient options when names change
  ['#r_name_1','#r_name_2','#r_name_3'].forEach(sel=>{
    const el = $(sel);
    if(el) el.addEventListener('input', refreshRecipientOptions);
  });

  // "Send configuration" placeholder
  const sendBtn = $('#sendConfigBtn');
  if(sendBtn){
    sendBtn.addEventListener('click', ()=>{
      sendBtn.textContent = 'Sending… (placeholder)';
      setTimeout(()=> sendBtn.textContent = 'Send configuration', 900);
    });
  }
});
