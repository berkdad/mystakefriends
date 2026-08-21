// Web system-messages service — mirrors lib/services/system_message_service.dart
//
// Persistent in-app banner messages authored by stake/ward leadership and shown
// to members when they open the app dashboard. Stored at:
//   stakes/{stakeId}/systemMessages/{id}
//
// wardId null => stake-wide (everyone in the stake). wardId set => that ward only.

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

// Duration presets offered when posting a message. A null duration means
// "until I turn it off" (no expiry). Mirrors the app's MessageDurationOption.
export const MESSAGE_DURATION_OPTIONS = [
  { label: '1 day', ms: 1 * 24 * 60 * 60 * 1000 },
  { label: '3 days', ms: 3 * 24 * 60 * 60 * 1000 },
  { label: '1 week', ms: 7 * 24 * 60 * 60 * 1000 },
  { label: '2 weeks', ms: 14 * 24 * 60 * 60 * 1000 },
  { label: '1 month', ms: 30 * 24 * 60 * 60 * 1000 },
  { label: 'Until I turn it off', ms: null },
];

function messagesCol(db, stakeId) {
  return collection(db, 'stakes', stakeId, 'systemMessages');
}

// Creates a banner message. durationMs null => no expiry.
export async function createMessage(db, {
  stakeId,
  message,
  createdBy,
  createdByName,
  durationMs,
  wardId = null,
  wardName = null,
}) {
  const expiresAt = durationMs
    ? Timestamp.fromMillis(Date.now() + durationMs)
    : null;
  return addDoc(messagesCol(db, stakeId), {
    message: message.trim(),
    createdBy,
    createdByName,
    createdAt: serverTimestamp(),
    expiresAt,
    active: true,
    wardId: wardId || null,
    wardName: wardName || null,
  });
}

// Returns all messages, newest first. Each: { id, message, active, wardId, ... }.
export async function listMessages(db, stakeId) {
  const snap = await getDocs(query(messagesCol(db, stakeId), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function setActive(db, stakeId, messageId, active) {
  return updateDoc(doc(db, 'stakes', stakeId, 'systemMessages', messageId), { active });
}

export async function deleteMessage(db, stakeId, messageId) {
  return deleteDoc(doc(db, 'stakes', stakeId, 'systemMessages', messageId));
}

// True when a message is active and not past its expiry.
export function isLive(m) {
  if (!m.active) return false;
  if (!m.expiresAt) return true;
  const expMs = m.expiresAt.toMillis ? m.expiresAt.toMillis() : 0;
  return expMs === 0 || expMs > Date.now();
}
