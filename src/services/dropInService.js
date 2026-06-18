// Web drop-in service — mirrors lib/services/drop_in_service.dart
//
// Uses the same Cloud Functions (dropIntoCircle / leaveCircleDropIn) and the
// same scope rules: wardAdmin -> their ward's circles; stakeAdmin/superAdmin
// -> all circles in the stake.
//
// getFunctions() uses the default region (us-central1), matching the rest of
// the web app's httpsCallable usage. If your functions move regions, pass the
// region to getFunctions(app, 'region') here and everywhere else in the app.

import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';

export function roleCanDropIn(role) {
  return role === 'stakeAdmin' || role === 'wardAdmin' || role === 'superAdmin';
}

// Resolves effective drop-in scope, combining role with the stakeAdmins /
// wardAdmins email lists. Returns 'stake', 'ward', or 'none'.
export async function resolveScope(db, { role, stakeId, wardId, email }) {
  if (role === 'superAdmin' || role === 'stakeAdmin') return 'stake';

  const lower = (email || '').toLowerCase().trim();
  if (lower) {
    try {
      const stakeDoc = await getDoc(doc(db, 'stakes', stakeId));
      const stakeAdmins = stakeDoc.data()?.stakeAdmins || [];
      if (stakeAdmins.some((e) => (e || '').toLowerCase().trim() === lower)) {
        return 'stake';
      }
    } catch (e) {
      /* ignore */
    }
  }

  if (role === 'wardAdmin') return 'ward';

  if (lower && wardId) {
    try {
      const wardDoc = await getDoc(doc(db, 'stakes', stakeId, 'wards', wardId));
      const wardAdmins = wardDoc.data()?.wardAdmins || [];
      if (wardAdmins.some((e) => (e || '').toLowerCase().trim() === lower)) {
        return 'ward';
      }
    } catch (e) {
      /* ignore */
    }
  }

  return 'none';
}

// Like getCirclesInScope, but resolves ward name, captain name, and member
// names for each circle. Members are read once per ward and reused across
// that ward's circles. Each returned item:
//   { ...circle, wardName, captainName, memberNames: [] }
export async function getCirclesInScopeDetailed(db, { scope, stakeId, wardId }) {
  const result = [];

  async function processWard(wardId, wardName) {
    // id -> displayName (preferredName || fullName)
    const membersSnap = await getDocs(
      collection(db, 'stakes', stakeId, 'wards', wardId, 'members')
    );
    const nameById = {};
    membersSnap.docs.forEach((m) => {
      const d = m.data();
      nameById[m.id] = d.preferredName || d.fullName || 'Member';
    });

    const circlesSnap = await getDocs(
      collection(db, 'stakes', stakeId, 'wards', wardId, 'circles')
    );
    circlesSnap.docs.forEach((cd) => {
      const c = { id: cd.id, wardId, stakeId, ...cd.data() };
      const captainName = c.captainId ? nameById[c.captainId] || null : null;
      const memberNames = (c.memberIds || [])
        .map((id) => nameById[id])
        .filter(Boolean)
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
      result.push({ ...c, wardName, captainName, memberNames });
    });
  }

  if (scope === 'ward') {
    if (!wardId) return [];
    const wardDoc = await getDoc(doc(db, 'stakes', stakeId, 'wards', wardId));
    const wardName = wardDoc.data()?.name || 'Ward';
    await processWard(wardId, wardName);
    return result;
  }

  if (scope !== 'stake') return [];

  const wardsSnap = await getDocs(collection(db, 'stakes', stakeId, 'wards'));
  for (const ward of wardsSnap.docs) {
    const wardName = ward.data()?.name || 'Ward';
    await processWard(ward.id, wardName);
  }
  return result;
}

// Returns [{ id, wardId, stakeId, name, memberIds, visitingAdmins, ... }]
// for a resolved scope ('stake' | 'ward').
export async function getCirclesInScope(db, { scope, stakeId, wardId }) {
  if (scope === 'ward') {
    if (!wardId) return [];
    const snap = await getDocs(
      collection(db, 'stakes', stakeId, 'wards', wardId, 'circles')
    );
    return snap.docs.map((d) => ({
      id: d.id,
      wardId,
      stakeId,
      ...d.data(),
    }));
  }

  if (scope !== 'stake') return [];

  // stake scope: every ward in the stake.
  const wardsSnap = await getDocs(collection(db, 'stakes', stakeId, 'wards'));
  const circles = [];
  for (const ward of wardsSnap.docs) {
    const circlesSnap = await getDocs(
      collection(db, 'stakes', stakeId, 'wards', ward.id, 'circles')
    );
    circlesSnap.docs.forEach((d) => {
      circles.push({ id: d.id, wardId: ward.id, stakeId, ...d.data() });
    });
  }
  return circles;
}

export async function getActiveDropIn(db, uid) {
  const userDoc = await getDoc(doc(db, 'users', uid));
  const active = userDoc.data()?.activeDropIn;
  if (active && active.circleId) return active;
  return null;
}

export async function dropIntoCircle(circle) {
  const functions = getFunctions();
  const fn = httpsCallable(functions, 'dropIntoCircle');
  return fn({
    stakeId: circle.stakeId,
    wardId: circle.wardId,
    circleId: circle.id,
  });
}

export async function leaveCircleDropIn(circle) {
  const functions = getFunctions();
  const fn = httpsCallable(functions, 'leaveCircleDropIn');
  return fn(
    circle
      ? { stakeId: circle.stakeId, wardId: circle.wardId, circleId: circle.id }
      : {}
  );
}

// Members of a circle, for participation views.
export async function getCircleMembers(db, circle) {
  if (!circle.memberIds || circle.memberIds.length === 0) return [];
  const snap = await getDocs(
    collection(db, 'stakes', circle.stakeId, 'wards', circle.wardId, 'members')
  );
  return snap.docs
    .filter((d) => circle.memberIds.includes(d.id))
    .map((d) => ({ id: d.id, ...d.data() }));
}

// "5 members, 1 visitor" label.
export function circleCountLabel(memberCount, visitorCount) {
  const base = `${memberCount} member${memberCount === 1 ? '' : 's'}`;
  if (visitorCount > 0) {
    return `${base}, ${visitorCount} visitor${visitorCount === 1 ? '' : 's'}`;
  }
  return base;
}
