import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import 'dotenv/config';

const sup = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

const sql = fs.readFileSync('supabase/migrations/20260614000000_complete_curriculum_and_reasons.sql', 'utf8');

// Extract table name and values from INSERT ... VALUES ... ON CONFLICT
function extractInserts(sqlText) {
  const results = [];
  // Match each INSERT block
  const insertRegex = /INSERT\s+INTO\s+public\.(\w+)\s*\(([^)]+)\)\s*VALUES\s*([\s\S]*?)(?:ON\s+CONFLICT|;)/gi;
  let match;
  while ((match = insertRegex.exec(sqlText)) !== null) {
    const table = match[1];
    const cols = match[2].split(',').map(c => c.trim());
    const valuesBlock = match[3].trim();
    // Remove trailing semicolon or ON CONFLICT clause
    const cleaned = valuesBlock.replace(/\s*ON\s+CONFLICT.*$/is, '').trim();
    // Split into individual rows: each enclosed in (...)
    const rows = [];
    let depth = 0, start = 0;
    for (let i = 0; i < cleaned.length; i++) {
      if (cleaned[i] === '(' && depth === 0) { start = i + 1; depth = 1; }
      else if (cleaned[i] === '(') depth++;
      else if (cleaned[i] === ')') {
        depth--;
        if (depth === 0) {
          rows.push(cleaned.substring(start, i));
          // skip comma
          while (i + 1 < cleaned.length && (cleaned[i + 1] === ',' || cleaned[i + 1] === ' ' || cleaned[i + 1] === '\n' || cleaned[i + 1] === '\r')) i++;
        }
      }
    }
    results.push({ table, cols, rows });
  }
  return results;
}

function parseValue(val) {
  val = val.trim();
  if (val === 'NULL' || val === 'null') return null;
  if (val === 'true' || val === 'TRUE') return true;
  if (val === 'false' || val === 'FALSE') return false;
  if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
    return val.slice(1, -1).replace(/''/g, "'");
  }
  if (!isNaN(val) && val !== '') return Number(val);
  return val;
}

// Handle ARRAY[...] values
function parseArrayValue(val) {
  val = val.trim();
  const arrMatch = val.match(/^ARRAY\[(.*)\]$/s);
  if (arrMatch) {
    const inner = arrMatch[1];
    const items = [];
    let current = '', inStr = false;
    for (let i = 0; i < inner.length; i++) {
      const c = inner[i];
      if (inStr) {
        if (c === "'") { if (inner[i+1] === "'") { current += "'"; i++; } else { inStr = false; items.push(current); current = ''; } }
        else current += c;
      } else {
        if (c === "'") inStr = true;
        else if (c === ',' || c === ' ') { if (current) { items.push(current); current = ''; } }
        else current += c;
      }
    }
    if (current) items.push(current);
    return items;
  }
  return parseValue(val);
}

(async () => {
  try {
    const inserts = extractInserts(sql);
    let total = 0, fails = 0;
    
    for (const { table, cols, rows } of inserts) {
      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize).map(rowStr => {
          const vals = rowStr.split(',').map(v => v.trim());
          const obj = {};
          cols.forEach((col, idx) => {
            if (idx < vals.length) {
              if (vals[idx].trim().startsWith('ARRAY[')) {
                obj[col] = parseArrayValue(vals[idx]);
              } else {
                obj[col] = parseValue(vals[idx]);
              }
            }
          });
          return obj;
        });
        
        const { error } = await sup.from(table).insert(batch);
        if (error) {
          // Try upsert
          const { error: e2 } = await sup.from(table).upsert(batch, { onConflict: 'id', ignoreDuplicates: true });
          if (e2) {
            fails++;
            console.log(`Error ${table}:`, e2.message.substring(0, 120));
          } else total += batch.length;
        } else total += batch.length;
      }
      console.log(`Inserted ${rows.length} rows into ${table}`);
    }
    
    console.log(`\nDone: ${total} rows inserted, ${fails} failures`);
    
    // Verify
    for (const t of ['subjects', 'visitor_categories', 'visit_reasons']) {
      const { data, error } = await sup.from(t).select('*', { count: 'exact', head: true });
      console.log(`${t}: ${error ? error.message : (data?.length || 0)}`);
    }
    // Show subjects
    const { data: subs } = await sup.from('subjects').select('name, code').order('display_order');
    console.log('\nSubjects:', subs?.map(s => `${s.code}=${s.name}`).join(', '));
    const { data: cats } = await sup.from('visitor_categories').select('name').order('sort_order');
    console.log('Categories:', cats?.map(c => c.name).join(', '));
  } catch (e) {
    console.error('Fatal:', e.message);
    console.error(e.stack);
  }
  process.exit(0);
})();
