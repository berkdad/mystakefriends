/**
 * find-member.js
 *
 * Searches every ward in every stake for members whose name matches a search
 * term (partial, case-insensitive), and shows their ward, contact info, and
 * which circle they're in (and whether that circle is live or edit).
 *
 * Run from the functions directory that holds serviceKey.json:
 *   node find-member.js "Berenice Tooley"
 *   node find-member.js tooley
 *
 * If nothing prints, that name isn't in any ward's member list, which means it
 * was never imported and needs to be added manually (or re-imported).
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

const term = (process.argv.slice(2).join(" ") || "").toLowerCase().trim();
if (!term) {
  console.error('\nUsage: node find-member.js "name or partial name"\n');
  process.exit(1);
}

(async () => {
  console.log(`\nSearching all wards for members matching: "${term}"\n`);
  let matches = 0;

  const stakes = await db.collection("stakes").get();
  for (const stake of stakes.docs) {
    const wards = await stake.ref.collection("wards").get();
    for (const ward of wards.docs) {
      const wardName = ward.data().name || ward.id;

      const members = await ward.ref.collection("members").get();
      const circles = await ward.ref.collection("circles").get();

      // Build memberId -> [circle name + mode] for quick lookup.
      const circleByMember = {};
      for (const c of circles.docs) {
        const cd = c.data();
        for (const mid of (cd.memberIds || [])) {
          (circleByMember[mid] = circleByMember[mid] || []).push(
            `${cd.name || "Unnamed"} (${cd.mode || "edit"})`
          );
        }
      }

      for (const m of members.docs) {
        const d = m.data();
        const name = (d.fullName || d.displayName || "").toLowerCase();
        if (!name.includes(term)) continue;

        matches++;
        const circlesIn = circleByMember[m.id];
        console.log("-".repeat(56));
        console.log(`name:   ${d.fullName || d.displayName || "(no name)"}`);
        console.log(`ward:   ${wardName}`);
        console.log(`email:  ${d.email || "(none)"}`);
        console.log(`phone:  ${d.phone || "(none)"}`);
        console.log(`dob:    ${d.dob || "(none)"}`);
        console.log(`circle: ${circlesIn ? circlesIn.join(", ") : "(not in a circle)"}`);
        console.log(`docId:  ${m.id}`);
      }
    }
  }

  console.log("\n" + "=".repeat(56));
  if (matches === 0) {
    console.log("No members matched. That name is not in any ward roster,");
    console.log("so it needs to be added manually (or the roster re-imported).");
  } else {
    console.log(`Found ${matches} matching member(s).`);
  }
  console.log("");
  process.exit(0);
})().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
