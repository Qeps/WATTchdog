'use strict';

/**
 * Fetch devices from backend.
 * Returns [{ name, id, online, last_seen }]
 */
export async function getDevices() {
  const res = await fetch('/api/devices', { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const arr = await res.json();
  return (Array.isArray(arr) ? arr : []).map(d => ({
    name: d.name || 'WATTCHdog',
    id: d.serial || d.id || 'unknown',
    online: !!d.online,
    last_seen: d.last_seen ?? null
  }));
}
