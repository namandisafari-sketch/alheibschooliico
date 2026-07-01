#!/usr/bin/env node
// Translate candidates in small batches with improved prompt.
// Run one phase at a time: node scripts/translate_phase.cjs <phase_num> <start_idx> <count>

const fs = require('fs');
const path = require('path');

const PHASE = parseInt(process.argv[2]) || 1;
const START = parseInt(process.argv[3]) || 0;
const COUNT = parseInt(process.argv[4]) || 100;
const BATCH_SIZE = 20;
const DELAY_MS = 3000;

const OLLAMA = process.env.VITE_OLLAMA_URL || 'http://localhost:11434';
const MODEL = 'qwen2.5:3b';

// Load candidates
const allCandidates = fs.readFileSync(
  path.join(__dirname, 'filtered_candidates.txt'), 'utf8'
).split(/\n/).filter(Boolean);

const candidates = allCandidates.slice(START, START + COUNT);
console.error(`Phase ${PHASE}: ${candidates.length} candidates (index ${START}-${START+COUNT-1})`);

// Load existing translations.json if any (from previous phases)
const resultsPath = path.join(__dirname, 'phase_translations.json');
let allResults = {};
if (fs.existsSync(resultsPath)) {
  try { allResults = JSON.parse(fs.readFileSync(resultsPath, 'utf8')); } catch {}
}

// Load existing dictionary to skip
const dictSrc = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'contexts', 'translations.ts'), 'utf8'
);
const existingKeys = new Set();
const keyRe = /^\s*"([^"]+)"\s*:/gm;
let m;
while ((m = keyRe.exec(dictSrc))) existingKeys.add(m[1]);

const promptPrefix = `You are translating UI text for Alheib School management system (Uganda) from English to Arabic.

Context for specific terms:
- "Advance" = salary advance → سلفة
- "Review" → مراجعة
- "Fee" → رسم / رسوم دراسية
- "Dormitory" → عنبر / سكن داخلي
- "Attendance" → حضور
- "Discipline" → انضباط
- "Syllabus" → منهاج
- "Assignment" → تكليف
- "Expense" → مصروف
- "Budget" → ميزانية
- "Inventory" → مخزون
- "Procurement" → مشتريات
- "Payroll" → كشوفات الرواتب
- "Leave" → إجازة
- "Compliance" → امتثال
- "Performance" → أداء
- "Assessment" → تقييم
- "Curriculum" → منهج دراسي

Rules:
- Output natural Modern Standard Arabic, concise for UI.
- Keep brand names as-is: Alheib, MoES, UNEB, UMSC, IPLE, UACE, NSSF, PAYE, TIN, NIN, LIN, EMIS
- Keep currency UGX as-is.
- Preserve all numbers, punctuation, and placeholders (%s, {var}).
- Do NOT translate code or identifiers.
- Return ONLY a valid JSON array of translated strings, same order as input.`;

async function translateBatch(items) {
  const prompt = promptPrefix + '\n\nInput JSON: ' + JSON.stringify(items) + '\n\nOutput JSON:';
  const res = await fetch(`${OLLAMA}/api/generate`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      options: { temperature: 0.1 }
    }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}`);
  const data = await res.json();
  const raw = data.response || '';
  const jsonMatch = raw.match(/\[[\s\S]*?\]/);
  if (!jsonMatch) throw new Error('No JSON in response');
  return JSON.parse(jsonMatch[0]);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  let totalBatches = Math.ceil(candidates.length / BATCH_SIZE);
  let translated = 0;
  let phaseResults = {};

  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    process.stderr.write(`  Batch ${batchNum}/${totalBatches}... `);

    // Skip items already translated or in dictionary
    const toTranslate = batch.filter(s => !allResults[s] && !existingKeys.has(s));
    if (toTranslate.length === 0) {
      process.stderr.write(`all skipped\n`);
      translated += batch.length;
      continue;
    }

    try {
      const translations = await translateBatch(toTranslate);
      if (Array.isArray(translations)) {
        for (let j = 0; j < toTranslate.length && j < translations.length; j++) {
          const src = toTranslate[j];
          const tgt = translations[j];
          if (tgt && tgt.trim() && tgt !== src) {
            // Sanity: skip if result still has lots of English
            const arabicRatio = (tgt.match(/[\u0600-\u06FF]/g) || []).length / tgt.length;
            if (arabicRatio >= 0.3) {
              phaseResults[src] = tgt.trim();
              allResults[src] = tgt.trim();
            }
          }
        }
      }
      process.stderr.write(`${toTranslate.length} done\n`);
    } catch (err) {
      process.stderr.write(`FAIL: ${err.message.slice(0,60)}\n`);
      // Individual fallback
      for (const item of toTranslate) {
        try {
          const res = await translateBatch([item]);
          if (res && res[0] && res[0] !== item) {
            const arabicRatio = (res[0].match(/[\u0600-\u06FF]/g) || []).length / res[0].length;
            if (arabicRatio >= 0.3) {
              phaseResults[item] = res[0].trim();
              allResults[item] = res[0].trim();
            }
          }
        } catch {}
        await sleep(500);
      }
    }

    translated += batch.length;

    // Save after each batch
    fs.writeFileSync(resultsPath, JSON.stringify(allResults, null, 2), 'utf8');

    if (i + BATCH_SIZE < candidates.length) {
      await sleep(DELAY_MS);
    }
  }

  // Write phase-specific output
  const phasePath = path.join(__dirname, `phase_${PHASE}_results.json`);
  fs.writeFileSync(phasePath, JSON.stringify(phaseResults, null, 2), 'utf8');
  console.error(`Phase ${PHASE} complete: ${Object.keys(phaseResults)} new translations`);
  console.error(`Total accumulated: ${Object.keys(allResults.length)}`);
})().catch(e => { console.error('Fatal:', e); process.exit(1); });
