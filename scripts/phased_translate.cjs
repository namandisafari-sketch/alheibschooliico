#!/usr/bin/env node
// Phase 2-3: Filter candidates aggressively, translate in small batches with delays.
// Usage: node scripts/phased_translate.cjs [batch_size] [delay_ms]

const fs = require('fs');
const path = require('path');

const BATCH_SIZE = parseInt(process.argv[2]) || 30;
const DELAY_MS = parseInt(process.argv[3]) || 3000;

const OLLAMA = process.env.VITE_OLLAMA_URL || 'http://localhost:11434';
const MODEL = 'qwen2.5:3b';

// Read existing dictionary
const dictPath = path.join(__dirname, '..', 'src', 'contexts', 'translations.ts');
const dictSrc = fs.readFileSync(dictPath, 'utf8');
const existingKeys = new Set();
const keyRe = /^\s*"([^"]+)"\s*:/gm;
let m;
while ((m = keyRe.exec(dictSrc))) existingKeys.add(m[1]);

console.error('Existing dictionary:', existingKeys.size, 'entries');

// Read candidates
const candidatesRaw = fs.readFileSync(
  path.join(__dirname, 'clean_candidates.txt'), 'utf8'
).split(/\r?\n/).map(l => l.trim()).filter(Boolean);

console.error('Raw candidates:', candidatesRaw.length);

// Aggressive filter
function isUILabel(s) {
  if (s.length < 3 || s.length > 120) return false;
  if (existingKeys.has(s)) return false;
  // Skip code patterns
  if (/[;{}()]=>/.test(s)) return false;
  if (/^[a-z]+\s*=/.test(s)) return false;
  if (/\.(map|filter|reduce|forEach|length|toString|toFixed|join|split|trim|replace|test|exec|match)\b/.test(s)) return false;
  if (/import\s|export\s|return\s|const\s|let\s|var\s|function\s|if\s|else\s|switch\s|case\s/.test(s)) return false;
  if (/^['"`(\[\]<>]/.test(s)) return false;
  if (/>\s*<\/|<[a-z]/.test(s)) return false;
  if (/^\d/.test(s)) return false;
  if (/^[a-z][a-z0-9-]*$/.test(s) && !/[A-Z]/.test(s)) return false;
  if (/^https?:\/\//.test(s)) return false;
  // Must have meaningful text
  const alpha = (s.match(/[A-Za-z]/g) || []).length;
  const total = s.replace(/\s/g, '').length;
  if (total > 0 && alpha / total < 0.5) return false;
  // Skip lines that are just code punctuation
  if (/^[,.:;!?\-–—(){}[\]<>]+$/.test(s)) return false;
  // Skip variable names (camelCase or snake_case without spaces)
  if (!/\s/.test(s) && /^[a-z]/.test(s) && /^[a-zA-Z0-9_]+$/.test(s)) return false;
  return true;
}

const filtered = [...new Set(candidatesRaw.filter(isUILabel))];
console.error('Filtered candidates:', filtered.length);

if (filtered.length === 0) {
  console.error('No candidates to translate');
  process.exit(0);
}

async function translateBatch(items) {
  const inputJson = JSON.stringify(items);
  const prompt = `You are an expert Arabic translator for a school management system UI.
Translate each English phrase to natural Modern Standard Arabic.
Rules:
- Produce fluent, natural Arabic suitable for user interface labels.
- Keep translations concise and UI-friendly.
- Preserve numbers, punctuation and placeholders (e.g. %s, {count}) exactly.
- Do NOT translate brand names like "Alheib", "MoES".
- Return ONLY a valid JSON array of translated strings in the SAME ORDER as input.
- No extra text, no explanations.

Input: ${inputJson}
Output:`;

  const res = await fetch(`${OLLAMA}/api/generate`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({model: MODEL, prompt, stream: false}),
  });
  if (!res.ok) throw new Error('Ollama error ' + res.status);
  const data = await res.json();
  const raw = data.response || '';
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No JSON array in response:\n' + raw.slice(0, 500));
  return JSON.parse(jsonMatch[0]);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  const results = {};
  let totalBatches = Math.ceil(filtered.length / BATCH_SIZE);
  let translated = 0;

  for (let i = 0; i < filtered.length; i += BATCH_SIZE) {
    const batch = filtered.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    console.error(`\nBatch ${batchNum}/${totalBatches} (${batch.length} items)...`);

    try {
      const translations = await translateBatch(batch);
      if (Array.isArray(translations)) {
        for (let j = 0; j < batch.length && j < translations.length; j++) {
          const src = batch[j];
          const tgt = translations[j];
          // Only add if translation is different from source
          if (tgt && tgt.trim() && tgt.trim() !== src && !/[a-zA-Z]{3,}/.test(tgt)) {
            results[src] = tgt.trim();
          }
        }
      }
      translated += batch.length;
      console.error(`  Translated ${translated}/${filtered.length}`);
    } catch (err) {
      console.error(`  Batch ${batchNum} failed:`, err.message);
      // Still try to translate individual items if batch fails
      for (const item of batch) {
        try {
          const singleResult = await translateBatch([item]);
          if (singleResult && singleResult[0] && singleResult[0].trim() && singleResult[0] !== item && !/[a-zA-Z]{3,}/.test(singleResult[0])) {
            results[item] = singleResult[0].trim();
          }
        } catch (e2) {
          // skip
        }
        await sleep(500);
      }
    }

    // Save progress after each batch
    const entries = Object.entries(results);
    const output = entries.map(([k, v]) => `  "${escapeStr(k)}": "${escapeStr(v)}",`).join('\n');
    fs.writeFileSync(
      path.join(__dirname, 'phase_translations.json'),
      JSON.stringify(results, null, 2),
      'utf8'
    );
    fs.writeFileSync(
      path.join(__dirname, 'phase_translations.txt'),
      output,
      'utf8'
    );

    if (i + BATCH_SIZE < filtered.length) {
      console.error(`  Waiting ${DELAY_MS}ms before next batch...`);
      await sleep(DELAY_MS);
    }
  }

  console.error('\nDone!');
  console.error('Total new translations:', Object.keys(results).length);
  console.error('Results saved to scripts/phase_translations.json');
  console.error('Code snippet saved to scripts/phase_translations.txt');
})().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

function escapeStr(s) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}
