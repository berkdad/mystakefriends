/**
 * Migration Script: Add mode and lastSnapshot fields to existing circles
 *
 * Run this script ONCE before deploying the frontend changes.
 * This ensures all existing circles have the new fields.
 *
 * Usage:
 * 1. Save this file as migration.js
 * 2. Run: node migration.js
 * 3. Verify completion message
 * 4. Check Firestore console to confirm fields added
 */

const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json'); // You'll need to download this from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateCircles() {
  console.log('🚀 Starting circle migration...\n');

  let totalCircles = 0;
  let updatedCircles = 0;
  let skippedCircles = 0;
  let errorCircles = 0;

  try {
    // Get all stakes
    const stakesSnapshot = await db.collection('stakes').get();
    console.log(`📊 Found ${stakesSnapshot.size} stake(s)\n`);

    for (const stakeDoc of stakesSnapshot.docs) {
      const stakeId = stakeDoc.id;
      const stakeName = stakeDoc.data().name || stakeId;
      console.log(`\n📍 Processing stake: ${stakeName} (${stakeId})`);

      // Get all wards in this stake
      const wardsSnapshot = await db.collection('stakes').doc(stakeId)
        .collection('wards').get();
      console.log(`   Found ${wardsSnapshot.size} ward(s)`);

      for (const wardDoc of wardsSnapshot.docs) {
        const wardId = wardDoc.id;
        const wardName = wardDoc.data().name || wardId;
        console.log(`\n   📍 Processing ward: ${wardName} (${wardId})`);

        // Get all circles in this ward
        const circlesSnapshot = await db.collection('stakes').doc(stakeId)
          .collection('wards').doc(wardId)
          .collection('circles').get();

        console.log(`      Found ${circlesSnapshot.size} circle(s)`);

        for (const circleDoc of circlesSnapshot.docs) {
          totalCircles++;
          const circleId = circleDoc.id;
          const circleData = circleDoc.data();
          const circleName = circleData.name || circleId;

          try {
            // Check if circle already has mode field
            if (circleData.mode) {
              console.log(`      ⏭️  Skipped: ${circleName} (already migrated)`);
              skippedCircles++;
              continue;
            }

            // Add mode and lastSnapshot fields
            await circleDoc.ref.update({
              mode: 'edit',  // Start all existing circles in edit mode
              lastSnapshot: null  // No previous snapshot
            });

            console.log(`      ✅ Updated: ${circleName}`);
            updatedCircles++;

          } catch (error) {
            console.error(`      ❌ Error updating ${circleName}:`, error.message);
            errorCircles++;
          }
        }
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total circles found:     ${totalCircles}`);
    console.log(`✅ Successfully updated: ${updatedCircles}`);
    console.log(`⏭️  Skipped (existing):  ${skippedCircles}`);
    console.log(`❌ Failed:               ${errorCircles}`);
    console.log('='.repeat(60));

    if (errorCircles > 0) {
      console.log('\n⚠️  Some circles failed to update. Please check the errors above.');
      console.log('You may need to manually update these circles in Firestore console.');
    } else if (updatedCircles > 0) {
      console.log('\n✨ Migration completed successfully!');
      console.log('You can now deploy the frontend and cloud functions.');
    } else {
      console.log('\n✨ All circles already migrated. No changes made.');
    }

  } catch (error) {
    console.error('\n❌ Fatal error during migration:', error);
    throw error;
  }
}

// Run the migration
migrateCircles()
  .then(() => {
    console.log('\n👋 Migration script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
