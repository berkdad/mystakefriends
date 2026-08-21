// One-off: stamp gender on all existing member docs and users docs.
// All existing members are female, EXCEPT the old "Silver Mesa Elders" ward
// (Las Vegas Aliante Stake ntsi0SjXK9MEkfoMdr3p / ward YRw8OwVRVBf3hKz43wBO) which is male.
// Idempotent: only sets gender where the field is missing.
// Usage: node backfill-gender.js [--live]   (default is dry run)

const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

const MALE_WARD_ID = 'YRw8OwVRVBf3hKz43wBO'; // old Silver Mesa Elders
const LIVE = process.argv.includes('--live');

(async () => {
  const writer = db.bulkWriter();
  const counts = { membersFemale: 0, membersMale: 0, membersSkipped: 0, usersFemale: 0, usersSkipped: 0 };

  const stakes = await db.collection('stakes').get();
  for (const stake of stakes.docs) {
    const wards = await stake.ref.collection('wards').get();
    for (const ward of wards.docs) {
      const gender = ward.id === MALE_WARD_ID ? 'male' : 'female';
      const members = await ward.ref.collection('members').get();
      for (const m of members.docs) {
        if (m.data().gender) { counts.membersSkipped++; continue; }
        if (gender === 'male') counts.membersMale++; else counts.membersFemale++;
        if (LIVE) writer.update(m.ref, { gender, updatedAt: new Date().toISOString() });
      }
    }
  }

  const users = await db.collection('users').get();
  for (const u of users.docs) {
    if (u.data().gender) { counts.usersSkipped++; continue; }
    counts.usersFemale++;
    if (LIVE) writer.update(u.ref, { gender: 'female', updatedAt: new Date().toISOString() });
  }

  if (LIVE) await writer.close();
  console.log(LIVE ? 'LIVE RUN complete:' : 'DRY RUN (no writes):', JSON.stringify(counts, null, 2));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
