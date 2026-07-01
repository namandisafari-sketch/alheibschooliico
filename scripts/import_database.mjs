import XLSX from 'xlsx';
import https from 'https';

const API = 'https://supabase.alheibschool.org';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

function rpc(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'supabase.alheibschool.org',
      path, method,
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': data ? Buffer.byteLength(data) : 0,
      },
    };
    const req = https.request(opts, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function sql(query) {
  return rpc('POST', '/pg/query', { query });
}

function rest(path, body) {
  return rpc('POST', path, body);
}

// Read Excel
const wb = XLSX.readFile('/home/iico/Downloads/DATA BASE.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const ref = ws['!ref'];
const range = XLSX.utils.decode_range(ref);

function cell(r, c) {
  const addr = XLSX.utils.encode_cell({ r, c });
  const v = ws[addr];
  return v ? String(v.v).trim() : '';
}

// Class name mapping: P.1 => Primary 1 (P1), etc.
const classMap = {
  'P.1': 'Primary 1 (P1)',
  'P.2': 'Primary 2 (P2)',
  'P.3': 'Primary 3 (P3)',
  'P.4': 'Primary 4 (P4)',
  'P.5': 'Primary 5 (P5)',
  'P.6': 'Primary 6 (P6)',
  'P.7': 'Primary 7 (P7)',
};

function esc(v) {
  if (v === null || v === undefined) return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
}

async function main() {
  // Step 1: Add missing columns
  console.log('=== Step 1: Add missing columns ===');
  const addCols = [
    'ALTER TABLE IF EXISTS public.learners ADD COLUMN IF NOT EXISTS sponsorship_type TEXT',
    'ALTER TABLE IF EXISTS public.learners ADD COLUMN IF NOT EXISTS dormitory TEXT',
    'ALTER TABLE IF EXISTS public.learners ADD COLUMN IF NOT EXISTS area TEXT',
    'ALTER TABLE IF EXISTS public.learners ADD COLUMN IF NOT EXISTS nira_document_type TEXT',
    'ALTER TABLE IF EXISTS public.learners ADD COLUMN IF NOT EXISTS guardian_name TEXT',
  ];
  for (const q of addCols) {
    const r = await sql(q);
    console.log(`  ${r.status} - ${q.substring(0, 60)}...`);
  }

  // Step 2: Fetch class IDs
  console.log('\n=== Step 2: Fetch class IDs ===');
  const classResult = await sql('SELECT id, name FROM public.classes');
  const classIdByName = {};
  if (classResult.status === 200 && Array.isArray(classResult.data)) {
    for (const c of classResult.data) {
      classIdByName[c.name] = c.id;
    }
  }
  console.log('  Classes loaded:', Object.keys(classIdByName).length);

  // Step 3: Import students
  console.log('\n=== Step 3: Import students ===');
  let imported = 0, errors = 0, skipped = 0;

  for (let r = 2; r <= range.e.r; r++) {
    const studentNo = cell(r, 1);
    const arabicName = cell(r, 3) || cell(r, 4) || cell(r, 2);
    const studentName = cell(r, 5);
    const className = cell(r, 6);
    const gender = cell(r, 7);
    const sponsorshipNo = cell(r, 8);
    const sponsorshipType = cell(r, 9);
    const sponsorshipAgency = cell(r, 10);
    const fatherName = cell(r, 11);
    const motherName = cell(r, 12);
    const guardian = cell(r, 13);
    const relationship = cell(r, 14);
    const contact = cell(r, 15);
    const dormitory = cell(r, 16);
    const niraDoc = cell(r, 17);
    const area = cell(r, 18);
    const district = cell(r, 19);

    if (!studentName) { skipped++; continue; }

    const mappedClass = classMap[className];
    const classId = mappedClass ? classIdByName[mappedClass] : null;
    const genderVal = gender.toUpperCase() === 'M' ? 'male' : 'female';

    let phone = contact.replace(/[\s\-\(\)]/g, '');
    if (phone && !phone.startsWith('256') && !phone.startsWith('0')) {
      phone = '256' + phone;
    }

    const insertSql = `
      INSERT INTO public.learners (
        admission_number, full_name, arabic_name, gender, class_id,
        sponsorship_number, sponsorship_type, sponsorship_agency,
        father_name, mother_name, guardian_name, guardian_relationship,
        parent_phone, dormitory, area, nira_document_type,
        home_district, pupil_status, status
      ) VALUES (
        ${esc(studentNo || null)},
        ${esc(studentName)},
        ${esc(arabicName || null)},
        ${esc(genderVal)},
        ${classId ? esc(classId) : 'NULL'},
        ${esc(sponsorshipNo || null)},
        ${esc(sponsorshipType || null)},
        ${esc(sponsorshipAgency || null)},
        ${esc(fatherName || null)},
        ${esc(motherName || null)},
        ${esc(guardian || null)},
        ${esc(relationship || null)},
        ${esc(phone || null)},
        ${esc(dormitory || null)},
        ${esc(area || null)},
        ${esc(niraDoc || null)},
        ${esc(district || null)},
        ${esc('orphan')},
        ${esc('active')}
      )
      ON CONFLICT (admission_number) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        arabic_name = EXCLUDED.arabic_name,
        gender = EXCLUDED.gender,
        class_id = EXCLUDED.class_id,
        sponsorship_number = EXCLUDED.sponsorship_number,
        sponsorship_type = EXCLUDED.sponsorship_type,
        sponsorship_agency = EXCLUDED.sponsorship_agency,
        father_name = EXCLUDED.father_name,
        mother_name = EXCLUDED.mother_name,
        guardian_name = EXCLUDED.guardian_name,
        guardian_relationship = EXCLUDED.guardian_relationship,
        parent_phone = EXCLUDED.parent_phone,
        dormitory = EXCLUDED.dormitory,
        area = EXCLUDED.area,
        nira_document_type = EXCLUDED.nira_document_type,
        home_district = EXCLUDED.home_district
    `;

    const result = await sql(insertSql);
    if (result.status === 200 || result.status === 201) {
      imported++;
    } else {
      errors++;
      if (errors <= 5) {
        console.log(`  ERROR row ${r} (${studentName}):`, result.status, JSON.stringify(result.data).slice(0, 250));
      }
    }

    if (r % 50 === 0) console.log(`  ${r - 1} rows processed...`);
  }

  console.log(`\n=== Results ===`);
  console.log(`  Imported/Updated: ${imported}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Skipped (no name): ${skipped}`);
  console.log(`  Total: ${range.e.r - 1}`);
}

main().catch(console.error);
