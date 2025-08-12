'use strict';
import { $, $all } from './helpers.js';
import { LIVE_DEVICES } from './devices.js';

function recipientNames(root) {
  const get = i => ( ($(`.recipients .r-name[data-index="${i}"]`, root)?.value) || '' ).trim();
  return [get(1) || 'Recipient 1', get(2) || 'Recipient 2', get(3) || 'Recipient 3'];
}
function buildRecipientSelect(root, selected) {
  const sel = document.createElement('select');
  sel.className = 'recipient';
  recipientNames(root).forEach(name => {
    const o = document.createElement('option'); o.value = name; o.textContent = name;
    sel.appendChild(o);
  });
  if (selected) sel.value = selected;
  return sel;
}
function renderEventsEditor(root) {
  const box = $('.events-editor', root);
  if (!box) return;
  box.innerHTML = '';

  const triggerOptions = ['manual', 'threshold', 'time-window', 'power-spike', 'custom'];
  for (let i = 1; i <= 9; i++) {
    const row = document.createElement('div'); row.className = 'events-row';
    const idx = document.createElement('div'); idx.className = 'idx'; idx.textContent = String(i).padStart(2, '0');

    const recWrap = document.createElement('div');
    recWrap.appendChild(buildRecipientSelect(root));

    const trig = document.createElement('select'); trig.className = 'trigger';
    triggerOptions.forEach(t => { const o = document.createElement('option'); o.value = t; o.textContent = t; trig.appendChild(o); });

    const ckSms = document.createElement('label'); ckSms.className = 'ck sms'; ckSms.innerHTML = `<input type="checkbox"> SMS`;
    const ckEmail = document.createElement('label'); ckEmail.className = 'ck email'; ckEmail.innerHTML = `<input type="checkbox"> Email`;

    row.append(idx, recWrap, trig, ckSms, ckEmail);
    box.appendChild(row);
  }
}
function refreshRecipientOptions(root) {
  const names = recipientNames(root);
  $all('select.recipient', root).forEach(sel => {
    const current = sel.value;
    sel.innerHTML = '';
    names.forEach(name => { const o = document.createElement('option'); o.value = name; o.textContent = name; sel.appendChild(o); });
    if (names.includes(current)) sel.value = current;
  });
}

export function buildConfigGroups() {
  const host = $('#configList');
  if (!host) return;
  host.innerHTML = '';

  LIVE_DEVICES.forEach(dev => {
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

    renderEventsEditor(group);

    $all('.recipients .r-name', group).forEach(inp => {
      inp.addEventListener('input', () => refreshRecipientOptions(group));
    });

    $('.send-config-btn', group)?.addEventListener('click', (e) => {
      const btn = e.currentTarget;
      btn.textContent = 'Sending… (placeholder)';
      setTimeout(() => btn.textContent = 'Send configuration', 900);
      // TODO: build payload & POST /api/config
    });
  });
}
