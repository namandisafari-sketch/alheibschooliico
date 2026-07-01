import XLSX from 'xlsx';
import http from 'http';

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

function rpc(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost',
      port: 8000,
      path, method,
      rejectUnauthorized: false,
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': data ? Buffer.byteLength(data) : 0,
      },
    };
    const req = http.request(opts, (res) => {
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

const wb = XLSX.readFile('/home/iico/Downloads/DATA BASE.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const ref = ws['!ref'];
const range = XLSX.utils.decode_range(ref);

function cell(r, c) {
  const addr = XLSX.utils.encode_cell({ r, c });
  const v = ws[addr];
  return v ? String(v.v).trim() : '';
}

function esc(v) {
  if (!v) return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
}

const classMap = {
  'P.1': 'Primary 1 (P1)', 'P.2': 'Primary 2 (P2)', 'P.3': 'Primary 3 (P3)',
  'P.4': 'Primary 4 (P4)', 'P.5': 'Primary 5 (P5)', 'P.6': 'Primary 6 (P6)',
  'P.7': 'Primary 7 (P7)',
};

async function main() {
  // Fetch class IDs
  const cls = await sql('SELECT id, name FROM public.classes');
  const cid = {};
  if (cls.status === 200 && Array.isArray(cls.data)) {
    for (const c of cls.data) cid[c.name] = `'${c.id}'`;
  }

  // Build all values in one VALUES clause
  const values = [];
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

    if (!studentName) continue;

    const mappedClass = classMap[className];
    const classId = mappedClass ? cid[mappedClass] : 'NULL';
    const genderVal = gender.toUpperCase() === 'M' ? 'male' : 'female';
    let phone = contact.replace(/[\s\-\(\)]/g, '');
    if (phone && !phone.startsWith('256') && !phone.startsWith('0')) phone = '256' + phone;

    values.push(`(${esc(studentNo || null)},${esc(studentName)},${esc(arabicName || null)},${esc(genderVal)},${classId},${esc(sponsorshipNo || null)},${esc(sponsorshipType || null)},${esc(sponsorshipAgency || null)},${esc(fatherName || null)},${esc(motherName || null)},${esc(guardian || null)},${esc(relationship || null)},${esc(phone || null)},${esc(dormitory || null)},${esc(area || null)},${esc(niraDoc || null)},${esc(district || null)},${esc('active')})`);
  }

  console.log(`Total values to insert: ${values.length}`);

  // Split into batches of 25 to avoid overly large SQL
  const batchSize = 25;
  let imported = 0;
  for (let i = 0; i < values.length; i += batchSize) {
    const batch = values.slice(i, i + batchSize);
    const insertSql = `
      INSERT INTO public.learners
        (admission_number, full_name, arabic_name, gender, class_id,
         sponsorship_number, sponsorship_type, sponsorship_agency,
         father_name, mother_name, guardian_name, guardian_relationship,
         parent_phone, dormitory, area, nira_document_type,
         home_district, status)
      VALUES ${batch.join(',\n')}
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
      imported += batch.length;
    } else {
      console.log(`Batch ${i / batchSize} error:`, result.status, JSON.stringify(result.data).slice(0, 300));
    }
    console.log(`  Batch ${i / batchSize + 1}: ${imported}/${values.length}`);
  }

  console.log(`\nDone. Total imported: ${imported}`);
}

main().catch(console.error);
