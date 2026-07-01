#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read .env
const envPath = path.join(__dirname, '..', '.env');
const env = {};
fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const m = line.match(/^\s*([^#=]+)=(.+)/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
});

const url = env.SUPABASE_URL || 'http://localhost:8000';
const key = env.SUPABASE_SERVICE_KEY;
if (!url || !key) { console.error('Missing Supabase env vars'); process.exit(1); }

const supabase = createClient(url, key);

const SHEET_CATEGORY_MAP = {
  'قرطاسية': 'Stationery',
  'ادوات النظافة': 'Cleaning',
  'المطبخ': 'Kitchen',
  'ادوات كهربائية': 'Electronics',
  'مستلزمات الرياضة': 'Sports',
  'طلاء': 'Paint',
  'سباكة': 'Plumbing',
  'طعام': 'Food',
  'اسكراب': 'Scrub',
  'اخري': 'Other',
};

const UNIT_COLS = new Set(['pcs', 'box', 'doz', 'cartoon', 'ream', 'kg', 'set', 'pairs',
  'jerrycan', 'can (tin)', 'bucket', '50kg', '25kg', '20l',
  '10kg', '5kg', '1kg', '500g', '3l', '10g', '5l', 'l']);

// Find latest جرد المخزن file
const files = fs.readdirSync('/home/iico/Downloads')
  .filter(f => f.includes('جرد المخزن') && f.endsWith('.xlsx'))
  .sort()
  .reverse();
if (!files.length) { console.error('No inventory file found'); process.exit(1); }
const filepath = `/home/iico/Downloads/${files[0]}`;
console.log('Reading:', filepath);

// Fetch existing item names to avoid duplicates
const { data: existingItems } = await supabase.from('inventory_items').select('name');
const existingNames = new Set((existingItems || []).map(i => i.name.toLowerCase().trim()));

const wb = XLSX.readFile(filepath);
let total = 0;

for (const sheetName of wb.SheetNames) {
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  if (rows.length < 2) continue;

  const categoryName = SHEET_CATEGORY_MAP[sheetName] || sheetName;
  const headers = (rows[0] || []).map(h => String(h || '').trim().toLowerCase());

  const items = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const itemName = row[1];
    if (!itemName || String(itemName).trim() === '') continue;

    const trimmedName = String(itemName).trim();
    if (existingNames.has(trimmedName.toLowerCase())) continue;

    let quantity = 0;
    let unit = 'pcs';
    for (let i = 0; i < headers.length; i++) {
      if (headers[i] && UNIT_COLS.has(headers[i]) && row[i] != null && Number(row[i]) > 0) {
        quantity = Number(row[i]);
        unit = headers[i];
        break;
      }
    }
    if (quantity === 0) {
      for (let i = 2; i < row.length; i++) {
        if (row[i] != null && Number(row[i]) > 0) {
          quantity = Number(row[i]);
          unit = headers[i] && UNIT_COLS.has(headers[i]) ? headers[i] : 'pcs';
          break;
        }
      }
    }
    if (quantity <= 0) continue;

    items.push({
      name: trimmedName,
      category: categoryName,
      unit,
      quantity: 0,
      min_threshold: Math.max(1, Math.floor(quantity / 10)),
    });
    existingNames.add(trimmedName.toLowerCase());
  }

  if (items.length === 0) continue;
  console.log(`${sheetName} (${categoryName}): ${items.length} items`);

  // Insert in batches
  for (let i = 0; i < items.length; i += 100) {
    const batch = items.slice(i, i + 100);
    const { data, error } = await supabase.from('inventory_items').insert(batch).select();
    if (error) {
      // Fallback: insert one by one
      for (const item of batch) {
        const { error: e } = await supabase.from('inventory_items').insert(item);
        if (!e) total++;
      }
    } else if (data?.length) {
      total += data.length;
    }
  }
}

console.log(`\nDone: ${total} items imported`);
