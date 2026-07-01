import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import 'dotenv/config';

const sup = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

function parseInsertValues(sql) {
  const colsMatch = sql.match(/INSERT\s+INTO\s+\w+\s*\(([^)]+)\)/i);
  if (!colsMatch) return [];
  const columns = colsMatch[1].split(',').map(c => c.trim().replace(/"/g, ''));
  
  const valuesPart = sql.substring(sql.toUpperCase().indexOf('VALUES') + 6);
  const rows = [];
  let depth = 0;
  let current = '';
  let inStr = false;
  let strChar = '';
  
  for (let i = 0; i < valuesPart.length; i++) {
    const ch = valuesPart[i];
    const next = valuesPart[i + 1];
    
    if (inStr) {
      if (ch === '\\\\' || (ch === strChar && next === strChar)) { current += ch; i++; current += valuesPart[i]; continue; }
      if (ch === strChar) { inStr = false; continue; }
      current += ch;
      continue;
    }
    if (ch === "'" || ch === '"') { inStr = true; strChar = ch; continue; }
    if (ch === '(' && depth === 0) { depth = 1; current = ''; continue; }
    if (ch === '(') { depth++; current += ch; continue; }
    if (ch === ')') {
      depth--;
      if (depth === 0) {
        const vals = current.split(',').map(v => {
          v = v.trim();
          if (v === 'NULL' || v === 'null') return null;
          if (v === 'true' || v === 'TRUE') return true;
          if (v === 'false' || v === 'FALSE') return false;
          if (!isNaN(v) && v !== '') return Number(v);
          if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) return v.slice(1, -1);
          return v;
        });
        const row = {};
        columns.forEach((col, idx) => { if (idx < vals.length) row[col] = vals[idx]; });
        rows.push(row);
        current = '';
        if (next === ',') i++;
        continue;
      }
      current += ch;
    } else {
      current += ch;
    }
  }
  return rows;
}

(async () => {
  try {
    const sql = fs.readFileSync('supabase/migrations/20260614000000_complete_curriculum_and_reasons.sql', 'utf8');
    
    const inserts = sql.match(/INSERT\s+INTO[^;]+;/gi);
    if (!inserts) { console.log('No INSERT statements found'); return; }
    
    let success = 0, fail = 0;
    for (const insertSql of inserts) {
      const table = insertSql.match(/INSERT\s+INTO\s+(\w+)/i)?.[1];
      if (!table) continue;
      
      const rows = parseInsertValues(insertSql);
      if (rows.length === 0) continue;
      
      const batchSize = table === 'visit_reasons' ? 200 : 50;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error } = await sup.from(table).upsert(batch, { onConflict: 'id', ignoreDuplicates: true });
        if (error) { fail++; console.log(`Error inserting into ${table}:`, error.message.substring(0, 120)); }
        else success += batch.length;
      }
    }
    console.log('Inserted/upserted:', success, 'rows, failed:', fail);
    
    if (success > 0) {
      const { data: subs } = await sup.from('subjects').select('name').order('display_order');
      console.log('Subjects:', subs?.length, subs?.map(s => s.name).join(', '));
      const { data: cats } = await sup.from('visitor_categories').select('name').order('sort_order');
      console.log('Categories:', cats?.length, cats?.map(c => c.name).join(', '));
      const { count: rc } = await sup.from('visit_reasons').select('*', { count: 'exact', head: true });
      console.log('Visit reasons:', rc);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
