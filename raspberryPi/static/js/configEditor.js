'use strict';
import { $, $all } from './helpers.js';
import { getDevices } from './devices.js';

// Return only actually filled recipient names (no placeholders)
function recipientNames(root) {
  return [1, 2, 3]
    .map(i => ($(`.recipients .r-name[data-index="${i}"]`, root)?.value || '').trim())
    .filter(n => n.length > 0);
}

// Build <select> with only filled names; empty default option when none
function buildRecipientSelect(root, selected) {
  const sel = document.createElement('select');
  sel.className = 'recipient';

  const names = recipientNames(root);

  // Always start with an empty option so dropdown can be blank
  const empty = document.createElement('option');
  empty.value = '';
  empty.textContent = '';
  sel.appendChild(empty);

  names.forEach(name => {
    const o = document.createElement('option');
    o.value = name;
    o.textContent = name;
    sel.appendChild(o);
  });

  // If previously selected name no longer exists → reset to empty
  sel.value = (selected && names.includes(selected)) ? selected : '';

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
    triggerOptions.forEach(t => {
      const o = document.createElement('option'); o.value = t; o.textContent = t; trig.appendChild(o);
    });

    const ckSms = document.createElement('label'); ckSms.className = 'ck sms'; ckSms.innerHTML = `<input type="checkbox"> SMS`;
    const ckEmail = document.createElement('label'); ckEmail.className = 'ck email'; ckEmail.innerHTML = `<input type="checkbox"> Email`;

    row.append(idx, recWrap, trig, ckSms, ckEmail);
    box.appendChild(row);
  }

  // Ensure dropdowns reflect currently typed recipient names
  refreshRecipientOptions(root);
}

function refreshRecipientOptions(root) {
  const names = recipientNames(root);
  $all('select.recipient', root).forEach(sel => {
    const current = sel.value;
    sel.innerHTML = '';

    // Rebuild: empty option first
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = '';
    sel.appendChild(empty);

    names.forEach(name => {
      const o = document.createElement('option');
      o.value = name;
      o.textContent = name;
      sel.appendChild(o);
    });

    // Keep current selection only if still valid; otherwise go empty
    sel.value = names.includes(current) ? current : '';
  });
}

// Build config payload from a single device group — recipients & events (new shape)
function buildPayloadForGroup(group, serial) {
  // Recipients (up to 3) — exact shape required by STM32
  const recipients = [1, 2, 3].map(i => {
    const name  = $(`.recipients .r-name[data-index="${i}"]`, group)?.value?.trim() || '';
    const email = $(`.recipients .r-email[data-index="${i}"]`, group)?.value?.trim() || '';
    const phone = $(`.recipients .r-phone[data-index="${i}"]`, group)?.value?.trim() || '';
    if (!name && !email && !phone) return null;
    return { name, email, number: phone };
  }).filter(Boolean);

  // Events — exact shape: { recipientName, triggerMode, sms, email }
  const events = [];
  $all('.events-editor .events-row', group).forEach((row) => {
    const recipientName = $('select.recipient', row)?.value || '';
    const triggerMode   = $('select.trigger', row)?.value || 'manual';
    const sms           = $('.ck.sms input', row)?.checked || false;
    const email         = $('.ck.email input', row)?.checked || false;

    // If nothing selected, skip this row
    if (!recipientName && !sms && !email) return;

    events.push({ recipientName, triggerMode, sms, email });
  });

  return { serial, recipients, events };
}

export async function buildConfigGroups() {
  const host = $('#configList');
  if (!host) return;
  host.innerHTML = '';

  const devices = await getDevices();

  devices.forEach(dev => {
    const group = document.createElement('div');
    group.className = 'config-group';

    group.innerHTML = `
      <div class="device-bar">
        <div class="device-id">
          <span class="badge">WATTCHdog</span> <strong>#${dev.id}</strong>
          ${dev.online ? '' : '<span class="muted small" style="margin-left:.5rem;">offline</span>'}
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

    // ✅ Was: refreshRecipientOptions(root) — 'root' is undefined here
    refreshRecipientOptions(group);

    // Keep recipient selectors in sync with typed names
    $all('.recipients .r-name', group).forEach(inp => {
      inp.addEventListener('input', () => refreshRecipientOptions(group));
    });

    // Send configuration → POST /api/config
    $('.send-config-btn', group)?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      const original = btn.textContent;
      btn.textContent = 'Sending…';

      try {
        const payload = buildPayloadForGroup(group, dev.id);
        const res = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try {
            const err = await res.json();
            if (err && err.error) msg = err.error;
          } catch (_) {}
          throw new Error(msg);
        }

        await res.json(); // optional: ignore body details
        btn.textContent = 'Sent';
        setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 1000);
      } catch (err) {
        console.error(err);
        btn.textContent = 'Error';
        setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 1200);
      }
    });
  });
}
