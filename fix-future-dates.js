const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json'); // You'll need to download this from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixFutureDates() {
  const currentYear = new Date().getFullYear();
  let updatedCount = 0;

  try {
    // Get all stakes
    const stakesSnapshot = await db.collection('stakes').get();

    for (const stakeDoc of stakesSnapshot.docs) {
      const stakeId = stakeDoc.id;
      console.log(`Processing stake: ${stakeId}`);

      // Get all wards in this stake
      const wardsSnapshot = await db
        .collection('stakes')
        .doc(stakeId)
        .collection('wards')
        .get();

      for (const wardDoc of wardsSnapshot.docs) {
        const wardId = wardDoc.id;
        console.log(`  Processing ward: ${wardId}`);

        // Get all members in this ward
        const membersSnapshot = await db
          .collection('stakes')
          .doc(stakeId)
          .collection('wards')
          .doc(wardId)
          .collection('members')
          .get();

        for (const memberDoc of membersSnapshot.docs) {
          const memberData = memberDoc.data();
          const dob = memberData.dob;

          if (dob && dob.includes('/')) {
            const [month, day, year] = dob.split('/');
            const birthYear = parseInt(year);

            // If birth year is in the future, subtract 100 years
            if (birthYear > currentYear) {
              const correctedYear = birthYear - 100;
              const newDob = `${month}/${day}/${correctedYear}`;

              console.log(`    Fixing ${memberData.fullName}: ${dob} → ${newDob}`);

              await db
                .collection('stakes')
                .doc(stakeId)
                .collection('wards')
                .doc(wardId)
                .collection('members')
                .doc(memberDoc.id)
                .update({
                  dob: newDob,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });

              updatedCount++;
            }
          }
        }
      }
    }

    console.log(`\nCompleted! Updated ${updatedCount} member(s).`);
  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

fixFutureDates();