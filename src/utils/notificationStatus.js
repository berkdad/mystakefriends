import { collection, query, where, getDocs } from 'firebase/firestore';
import { tr, trf } from '../i18n/translations';

// The mobile app (v1.1.33+) writes one entry per device to
// users/{uid}.notificationDevices.{deviceId}:
//   { status: 'on' | 'off' | 'not_asked', platform, checkedAt, offSince }
// A member counts as reachable if ANY recently-seen device has them on.

const STALE_DAYS = 90;

const toDate = (ts) => (ts && typeof ts.toDate === 'function' ? ts.toDate() : null);
const fmt = (d) => (d ? `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}` : '');

/**
 * Summarize a users doc into a single status for display.
 * code: 'on' | 'off' | 'not_asked' | 'no_report'
 */
export function summarizeNotifications(userDoc) {
  const raw = userDoc?.notificationDevices || {};
  const cutoff = Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000;
  const devices = Object.values(raw)
    .map((d) => ({ ...d, checked: toDate(d.checkedAt), off: toDate(d.offSince) }))
    .filter((d) => !d.checked || d.checked.getTime() >= cutoff);

  if (devices.length === 0) return { code: 'no_report', devices: [] };

  let code = 'not_asked';
  if (devices.some((d) => d.status === 'on')) code = 'on';
  else if (devices.some((d) => d.status === 'off')) code = 'off';

  const offSince = devices
    .filter((d) => d.status === 'off' && d.off)
    .map((d) => d.off)
    .sort((a, b) => a - b)[0] || null;

  return { code, devices, offSince };
}

/** Tooltip text with one line per device. */
export function describeNotifications(summary) {
  if (summary.code === 'no_report') {
    return tr('No notification report yet. It appears after the member opens app version 1.1.33 or newer.');
  }
  return summary.devices
    .map((d) => {
      const device = d.platform === 'ios' ? tr('iPhone/iPad') : tr('Android');
      let state = d.status === 'on' ? tr('on') : d.status === 'off' ? tr('off') : tr('never asked');
      if (d.status === 'off' && d.off) state += ' ' + trf('since {0}', [fmt(d.off)]);
      return `${device}: ${state}` + (d.checked ? ` (${trf('checked {0}', [fmt(d.checked)])})` : '');
    })
    .join('\n');
}

/**
 * Load the stake's users docs once and attach a `notif` summary to each
 * member, matched by email (case-insensitive). Returns a new array.
 */
export async function attachNotificationStatus(db, stakeId, members) {
  try {
    const snap = await getDocs(query(collection(db, 'users'), where('stakeId', '==', stakeId)));
    const byEmail = {};
    snap.docs.forEach((d) => {
      const email = (d.data().email || '').toLowerCase().trim();
      if (email) byEmail[email] = d.data();
    });
    return members.map((m) => {
      const email = (m.email || '').toLowerCase().trim();
      return { ...m, notif: summarizeNotifications(email ? byEmail[email] : null) };
    });
  } catch (error) {
    console.error('Could not load notification status:', error);
    return members;
  }
}

export { fmt as formatNotifDate };
