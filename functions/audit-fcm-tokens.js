/**
 * audit-fcm-tokens.js
 *
 * Finds users whose device(s) have more than one live FCM token, which makes
 * sendEachForMulticast deliver the same push more than once to that device
 * (the usual cause of "double notifications" on one platform/device).
 *
 * RUN FROM the functions directory that holds serviceKey.json:
 *   node audit-fcm-tokens.js                 // scan everyone, report only
 *   node audit-fcm-tokens.js rose@email.com  // focus one person
 *   node audit-fcm-tokens.js --dedupe        // keep newest token per platform
 *                                            // per user, delete the older ones
 *   node audit-fcm-tokens.js rose@email.com --dedupe
 *
 * Token docs live at: fcmTokens/{uid}/tokens/{token}
 * with fields: token, platform ('ios'|'android'), createdAt, lastUsed.
 */

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const keyPath = path.resolve(process.cwd(), "serviceKey.json");
if (!fs.existsSync(keyPath)) {
  console.error(`\nNo serviceKey.json at ${keyPath}. Run from your functions dir.\n`);
  process.exit(1);
}
admin.initializeApp({credential: admin.credential.cert(require(keyPath))});
const db = admin.firestore();

const args = process.argv.slice(2);
const focusEmail = (args.find((a) => !a.startsWith("--")) || "").trim();
const doDedupe = args.includes("--dedupe");

function ts(v) {
  try {
    return v && v.toDate ? v.toDate().toISOString() : "(none)";
  } catch (_) {
    return "(none)";
  }
}

(async () => {
  // Resolve a single uid if an email was given.
  let focusUid = null;
  if (focusEmail) {
    try {
      const u = await admin.auth().getUserByEmail(focusEmail);
      focusUid = u.uid;
      console.log(`\nFocusing on ${focusEmail} (uid ${focusUid})`);
    } catch (_) {
      console.error(`Could not find an auth user for ${focusEmail}`);
      process.exit(1);
    }
  }

  // Collect token docs grouped by uid.
  const byUid = {};
  if (focusUid) {
    const snap = await db
      .collection("fcmTokens").doc(focusUid)
      .collection("tokens").get();
    byUid[focusUid] = snap.docs;
  } else {
    const all = await db.collectionGroup("tokens").get();
    for (const d of all.docs) {
      const uid = d.ref.parent.parent ? d.ref.parent.parent.id : "(unknown)";
      (byUid[uid] = byUid[uid] || []).push(d);
    }
  }

  const uids = Object.keys(byUid);
  console.log(`\nUsers with tokens: ${uids.length}`);

  let flaggedUsers = 0;
  let deletedTotal = 0;

  for (const uid of uids) {
    const docs = byUid[uid];
    // Group by platform.
    const byPlat = {};
    for (const d of docs) {
      const p = (d.data().platform || "unknown").toLowerCase();
      (byPlat[p] = byPlat[p] || []).push(d);
    }

    const platforms = Object.keys(byPlat);
    const hasDupPlatform = platforms.some((p) => byPlat[p].length > 1);

    // Only print users that are interesting (focus mode prints always).
    if (!hasDupPlatform && !focusUid) continue;

    flaggedUsers++;
    let email = uid;
    try {
      const ud = await db.collection("users").doc(uid).get();
      if (ud.exists && ud.data().email) email = ud.data().email;
    } catch (_) { /* ignore */ }

    console.log("\n" + "-".repeat(60));
    console.log(`user: ${email}  (uid ${uid})  total tokens: ${docs.length}`);
    for (const p of platforms) {
      const list = byPlat[p];
      const flag = list.length > 1 ?
        "  <-- DUPLICATE: this device gets every push x" + list.length : "";
      console.log(`  ${p}: ${list.length}${flag}`);
      for (const d of list) {
        const da = d.data();
        console.log(
          `     token ${d.id.substring(0, 16)}...  ` +
          `created ${ts(da.createdAt)}  lastUsed ${ts(da.lastUsed)}`
        );
      }
    }

    if (doDedupe) {
      for (const p of platforms) {
        const list = byPlat[p];
        if (list.length <= 1) continue;
        // Keep the newest by createdAt; delete the rest.
        list.sort((a, b) => {
          const ax = a.data().createdAt?.toMillis?.() || 0;
          const bx = b.data().createdAt?.toMillis?.() || 0;
          return bx - ax;
        });
        const keep = list[0];
        const remove = list.slice(1);
        console.log(`  dedupe ${p}: keeping ${keep.id.substring(0, 16)}..., ` +
          `deleting ${remove.length}`);
        for (const d of remove) {
          await d.ref.delete();
          deletedTotal++;
        }
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  if (flaggedUsers === 0 && !focusUid) {
    console.log("No users have more than one token of the same platform.");
    console.log("Duplicate tokens are NOT the cause. Tell me and we look at");
    console.log("the message payload / handlers next.");
  } else {
    console.log(`Flagged users: ${flaggedUsers}`);
    if (doDedupe) {
      console.log(`Deleted ${deletedTotal} duplicate token(s).`);
    } else {
      console.log("Re-run with --dedupe to remove the older duplicates.");
    }
  }
  console.log("");
  process.exit(0);
})().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
