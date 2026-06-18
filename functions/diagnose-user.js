/**
 * diagnose-user.js
 *
 * Inspects a single user's Firebase Auth + Firestore state to explain why
 * they can't log in. Read-only by default. Optional fixes are opt-in flags.
 *
 * RUN IT FROM YOUR FUNCTIONS DIRECTORY (where serviceKey.json lives):
 *   cd C:\firebaseProjects\mystakefriends\functions   (or wherever serviceKey.json is)
 *   node diagnose-user.js rose@email.com
 *
 * Optional fixes (only run when you pass the flag):
 *   node diagnose-user.js rose@email.com --fix-setup
 *       -> sets needsPasswordSetup=false on her users doc
 *   node diagnose-user.js rose@email.com --set-password "TempPass123!"
 *       -> sets a known password so she can stop guessing (tell her the value)
 *   node diagnose-user.js rose@email.com --enable
 *       -> re-enables the account if it is disabled
 *
 * You can combine flags. Nothing is changed unless you pass a fix flag.
 */

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// ---- locate the service account key ----
const keyPath = path.resolve(process.cwd(), "serviceKey.json");
if (!fs.existsSync(keyPath)) {
  console.error(`\nCould not find serviceKey.json at:\n  ${keyPath}`);
  console.error(
    "Run this from the directory that contains serviceKey.json, " +
    "or edit keyPath in this script.\n"
  );
  process.exit(1);
}
const serviceAccount = require(keyPath);

admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const auth = admin.auth();
const db = admin.firestore();

// ---- parse args ----
const args = process.argv.slice(2);
const email = (args.find((a) => !a.startsWith("--")) || "").trim();
const doFixSetup = args.includes("--fix-setup");
const doEnable = args.includes("--enable");
const setPwIdx = args.indexOf("--set-password");
const newPassword = setPwIdx >= 0 ? args[setPwIdx + 1] : null;

if (!email) {
  console.error(
    "\nUsage: node diagnose-user.js <email> " +
    "[--fix-setup] [--set-password <pw>] [--enable]\n"
  );
  process.exit(1);
}
const lc = email.toLowerCase();
const bar = () => console.log("-".repeat(64));

(async () => {
  console.log(`\nDiagnosing login state for: ${email}`);
  bar();

  // 1) PRIMARY AUTH ACCOUNT
  let authUser = null;
  try {
    authUser = await auth.getUserByEmail(email);
  } catch (e) {
    if (e.code === "auth/user-not-found" && lc !== email) {
      try {
        authUser = await auth.getUserByEmail(lc);
      } catch (_) {
        // handled below
      }
    }
  }

  if (!authUser) {
    console.log("AUTH: no Firebase Auth account exists for this email.");
    console.log("  -> Login will always fail. She likely needs an invite,");
    console.log("     or the account is under a different email spelling.");
  } else {
    const providers =
      authUser.providerData.map((p) => p.providerId).join(", ") || "(none)";
    const hasPassword =
      authUser.providerData.some((p) => p.providerId === "password");
    console.log("AUTH ACCOUNT FOUND");
    console.log("  uid:               ", authUser.uid);
    console.log("  email:             ", authUser.email);
    console.log("  emailVerified:     ", authUser.emailVerified);
    console.log(
      "  disabled:          ",
      authUser.disabled,
      authUser.disabled ? '  <-- BLOCKED. This shows as "error" on login.' : ""
    );
    console.log("  sign-in providers: ", providers);
    console.log(
      "  has password login:",
      hasPassword,
      hasPassword ? "" : "  <-- NO password set; email/password login fails."
    );
    console.log("  created:           ", authUser.metadata.creationTime);
    console.log("  last sign-in:      ", authUser.metadata.lastSignInTime);
    console.log("  last token refresh:", authUser.metadata.lastRefreshTime);
  }
  bar();

  // 2) DUPLICATE AUTH ACCOUNTS (same email, any letter case)
  console.log("Scanning all auth accounts for duplicates of this email...");
  const dupes = [];
  let pageToken;
  do {
    const res = await auth.listUsers(1000, pageToken);
    for (const u of res.users) {
      if ((u.email || "").toLowerCase() === lc) dupes.push(u);
    }
    pageToken = res.pageToken;
  } while (pageToken);
  console.log(`  matching auth accounts: ${dupes.length}`);
  for (const u of dupes) {
    const provs = u.providerData.map((p) => p.providerId).join("/") || "none";
    console.log(
      `    - uid=${u.uid}  email=${u.email}  ` +
      `disabled=${u.disabled}  providers=${provs}`
    );
  }
  if (dupes.length > 1) {
    console.log('  -> MULTIPLE auth accounts. Common cause of login "error".');
  }
  bar();

  // 3) FIRESTORE users DOC(S)  (keyed by auth uid in this app)
  console.log("Firestore users docs for this email...");
  const userDocs = {};
  for (const q of [email, lc]) {
    const snap = await db.collection("users").where("email", "==", q).get();
    snap.forEach((d) => (userDocs[d.id] = d.data()));
  }
  if (authUser) {
    const byUid = await db.collection("users").doc(authUser.uid).get();
    if (byUid.exists) userDocs[byUid.id] = byUid.data();
  }
  const userIds = Object.keys(userDocs);
  if (userIds.length === 0) {
    console.log("  NO users doc found.");
    console.log('  -> App cannot load her profile after sign-in -> "error".');
  } else {
    for (const id of userIds) {
      const u = userDocs[id];
      console.log(`  users/${id}`);
      console.log("     email:             ", u.email);
      console.log("     role:              ", u.role);
      console.log("     stakeId:           ", u.stakeId);
      console.log("     wardId:            ", u.wardId);
      console.log(
        "     needsPasswordSetup:",
        u.needsPasswordSetup,
        u.needsPasswordSetup === true ?
          "  <-- TRUE. App may block login until password is set on website." :
          ""
      );
      if (authUser && id !== authUser.uid) {
        console.log(
          `     NOTE: doc id != auth uid (${authUser.uid}) -> linkage mismatch`
        );
      }
    }
    if (userIds.length > 1) {
      console.log("  -> MULTIPLE users docs. Strong candidate for the error.");
    }
  }
  bar();

  // 4) MEMBER RECORDS ACROSS WARDS
  console.log("Member records across all wards for this email...");
  try {
    const seen = new Set();
    for (const q of [email, lc]) {
      const ms = await db
        .collectionGroup("members")
        .where("email", "==", q)
        .get();
      ms.forEach((d) => {
        if (seen.has(d.ref.path)) return;
        seen.add(d.ref.path);
        const m = d.data();
        const name =
          m.displayName || m.preferredName || m.fullName || "(no name)";
        console.log(`  ${d.ref.path}`);
        console.log(`     name: ${name}`);
      });
    }
    if (seen.size === 0) console.log("  no member records found.");
    if (seen.size > 1) {
      console.log("  -> MULTIPLE member records (possibly different wards).");
    }
  } catch (e) {
    console.log("  member lookup failed:", e.message);
    const url = (e.message || "").match(/https:\/\/\S+/);
    if (url) console.log("  (create the suggested index here:)", url[0]);
  }
  bar();

  // ---- OPTIONAL FIXES (only when a flag is passed) ----
  let didFix = false;
  if (authUser && doEnable && authUser.disabled) {
    await auth.updateUser(authUser.uid, {disabled: false});
    console.log("FIX: re-enabled the auth account.");
    didFix = true;
  }
  if (authUser && newPassword) {
    await auth.updateUser(authUser.uid, {password: newPassword});
    console.log(
      `FIX: password for ${authUser.email} set to the value you passed. ` +
      "Tell her exactly that value, and have her change it after logging in."
    );
    didFix = true;
  }
  if (authUser && doFixSetup) {
    await db
      .collection("users")
      .doc(authUser.uid)
      .set({needsPasswordSetup: false}, {merge: true});
    console.log(`FIX: set needsPasswordSetup=false on users/${authUser.uid}.`);
    didFix = true;
  }
  if (!didFix) {
    console.log("(No changes made. Re-run with a fix flag if you want one.)");
  }

  console.log("\nDone.\n");
  process.exit(0);
})().catch((e) => {
  console.error("\nFatal error:", e);
  process.exit(1);
});
