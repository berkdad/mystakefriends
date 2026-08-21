// One-off: import EldersRoster.xlsx into the LV Aliante Elders stake (GdatIPXa5ABcTsd7oyEJ).
// Splits the LCR export by ward section header rows, maps fields exactly like
// UploadRosterModal in src/App.jsx, stamps gender:'male' on every member.
// Idempotent: matches existing members by email, then by fullName+dob, and updates instead of duplicating.
// Usage: node import-elders-roster.js [--live]   (default is dry run)

const admin = require('firebase-admin');
const XLSX = require('xlsx');
admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

const STAKE_ID = 'GdatIPXa5ABcTsd7oyEJ';
const WARD_MAP = {
  'Alta Loma Ward (Spanish)': 'B6Mh6kYwu9GCeyJjr3g3', // Alta Loma
  'Bella Vista Ward': 'FaQx9vey458WHw4qPVx4',
  'Discovery Park Ward': '2rskZgFhB1bd5YBUp5gS',
  'Eldorado Highlands Ward': 'w7bDzGYliSRUtzWxqh8s',
  'North Star YSA Ward': 'ohOL9yOYuXu66NPxCV3l', // NorthStar
  'San Destin Ward': 'ex4ybdruhDBOix8Rk8JG',
  'Seastrand Park Ward': '9VcuPF3MNbTryWPfEy0q',
  'Silver Mesa Ward': 'kdX6b6ef7cw022vzmTh4',
};
const LIVE = process.argv.includes('--live');

// Same output format as convertExcelDate in src/App.jsx: MM/DD/YYYY
function excelSerialToDate(value) {
  if (typeof value === 'number' && value > 1 && value < 73050) {
    const excelEpoch = new Date(1899, 11, 30);
    const d = new Date(excelEpoch.getTime() + value * 86400000);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
  }
  return value ? String(value).trim() : '';
}

function rowToMember(header, row) {
  const get = (name) => {
    const i = header.indexOf(name);
    return i === -1 ? '' : row[i];
  };
  const member = { gender: 'male' };
  const fullName = String(get('Preferred Name') || '').trim();
  if (!fullName) return null;
  member.fullName = fullName;
  const email = String(get('Individual E-mail') || '').trim();
  if (email) member.email = email;
  const phone = String(get('Individual Phone') || '').trim();
  if (phone) member.phone = phone;
  const address = String(get('Address - Street 1') || '').trim();
  if (address) member.address = address;
  const dob = excelSerialToDate(get('Birth Date (1 Jan 1990)'));
  if (dob) member.dob = dob;
  if (get('Is Married') === 'Yes') member.maritalStatus = 'married';
  else if (get('Is Divorced') === 'Yes') member.maritalStatus = 'divorced';
  else if (get('Is Widowed') === 'Yes') member.maritalStatus = 'widowed';
  else if (get('Is Single') === 'Yes') member.maritalStatus = 'single';
  if (get('Has Children') === 'Yes') member.numChildren = '1';
  return member;
}

(async () => {
  const wb = XLSX.readFile('EldersRoster.xlsx');
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });

  // Split into sections keyed by ward header rows
  const sections = {}; // wardName -> { header: [...], rows: [...] }
  let current = null;
  for (const r of rows) {
    const a = (r[0] || '').toString().trim();
    const restEmpty = r.slice(1).every((c) => c === '' || c === null);
    if (a && restEmpty) {
      if (!a.startsWith('Count:')) { current = a; sections[current] = { header: null, rows: [] }; }
      continue;
    }
    if (!current) continue;
    if (a === 'Preferred Name') { sections[current].header = r.map((h) => String(h).trim()); continue; }
    if (a) sections[current].rows.push(r);
  }

  const writer = db.bulkWriter();
  const report = {};
  let unmapped = [];

  for (const [wardName, section] of Object.entries(sections)) {
    const wardId = WARD_MAP[wardName];
    if (!wardId) { unmapped.push(wardName); continue; }
    const wardRef = db.collection('stakes').doc(STAKE_ID).collection('wards').doc(wardId);

    const existing = await wardRef.collection('members').get();
    const byEmail = {}, byNameDob = {};
    existing.docs.forEach((d) => {
      const m = d.data();
      if (m.email) byEmail[m.email.toLowerCase()] = d.id;
      if (m.fullName && m.dob) byNameDob[`${m.fullName.toLowerCase()}_${m.dob}`] = d.id;
    });

    let created = 0, updated = 0, skipped = 0;
    for (const row of section.rows) {
      const member = rowToMember(section.header, row);
      if (!member) { skipped++; continue; }
      const existingId =
        (member.email && byEmail[member.email.toLowerCase()]) ||
        (member.dob && byNameDob[`${member.fullName.toLowerCase()}_${member.dob}`]) ||
        null;
      const now = new Date().toISOString();
      if (existingId) {
        updated++;
        if (LIVE) writer.update(wardRef.collection('members').doc(existingId), { ...member, updatedAt: now });
      } else {
        created++;
        if (LIVE) writer.set(wardRef.collection('members').doc(), { ...member, hasLoggedIn: false, createdAt: now, updatedAt: now });
      }
    }
    report[wardName] = { wardId, created, updated, skipped };
  }

  if (LIVE) await writer.close();
  console.log(LIVE ? 'LIVE RUN complete:' : 'DRY RUN (no writes):');
  console.log(JSON.stringify(report, null, 2));
  if (unmapped.length) console.log('UNMAPPED ward sections (not imported):', unmapped);
  const totals = Object.values(report).reduce((a, r) => ({ created: a.created + r.created, updated: a.updated + r.updated, skipped: a.skipped + r.skipped }), { created: 0, updated: 0, skipped: 0 });
  console.log('TOTALS:', JSON.stringify(totals));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
