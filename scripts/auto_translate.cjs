#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const fetch = global.fetch || require('node-fetch');

const OLLAMA = process.env.VITE_OLLAMA_URL || 'http://localhost:11434';
const MODEL = 'qwen2.5:3b';

function readCandidates() {
  const text = fs.readFileSync(path.join(__dirname, '..', 'translation_candidates.txt'), 'utf8');
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  // Filter candidates: skip CSS-like, paths, code snippets
  const good = [];
  for (const l of lines) {
    if (l.length > 120) continue;
    if (/^\.|^\.\.|^\//.test(l)) continue;
    if (/\\\w/.test(l)) continue;
    if (/\(.*\)|\{|\}|: =|=>|\.js|\.ts/.test(l)) continue;
    if (/^[\-\.,;#\$]/.test(l)) continue;
    if (!/[A-Za-z\u0600-\u06FF]/.test(l)) continue;
    good.push(l);
  }
  // unique preserve order
  return [...new Set(good)];
}

function readExistingKeys() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'contexts', 'translations.ts'), 'utf8');
  const re = /^\s*"([^"]+)"\s*:/gm;
  const keys = new Set();
  let m;
  while ((m = re.exec(src))) keys.add(m[1]);
  return {keys, src};
}

async function translateBatch(items) {
  if (items.length === 0) return [];
  const inputJson = JSON.stringify(items);
  const prompt = `You are an expert Arabic translator optimizing short UI text for a web application.\nRules (VERY IMPORTANT):\n- Produce fluent, natural Modern Standard Arabic suitable for user interfaces — prefer meaning and readability over literal word-for-word translation.\n- Keep translations concise and UI-friendly (short phrases when the English is short).\n- Preserve numbers, punctuation and placeholders exactly (e.g. '%s', '{count}', '{{name}}'). Do NOT translate them.\n- Do NOT translate or alter code identifiers, file names, or CSS classes. If unsure, leave as-is.\n- Transliterate brand or proper names only when necessary; otherwise keep the original brand text.\n- Do NOT include any extra text, explanations, or markup — return ONLY a valid JSON array of translated strings in the SAME ORDER as the input.\n- If the English string is ambiguous, choose the most natural Arabic phrasing that fits a UI context (labels, buttons, short descriptions).\n\nInput JSON array: ${inputJson}\n\nOutput JSON array:`;

  const res = await fetch(`${OLLAMA}/api/generate`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({model: MODEL, prompt, stream: false}),
    // no timeout here; rely on default
  });
  if (!res.ok) throw new Error('Ollama API error ' + res.status);
  const data = await res.json();
  const raw = data.response || '';
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No JSON array in response');
  const translations = JSON.parse(jsonMatch[0]);
  return translations;
}

(async () => {
  try {
    const candidates = readCandidates();
    const {keys: existing, src} = readExistingKeys();
    const toTranslate = [];
    for (const c of candidates) {
      if (existing.has(c)) continue;
      toTranslate.push(c);
      if (toTranslate.length >= 500) break;
    }
    console.log('Candidates to translate:', toTranslate.length);
    if (toTranslate.length === 0) {
      console.log('No new candidates to translate');
      process.exit(0);
    }
    const translations = await translateBatch(toTranslate);
    if (!Array.isArray(translations) || translations.length !== toTranslate.length) {
      console.warn('Translations length mismatch; writing partial results');
    }
    const result = {};
    for (let i = 0; i < toTranslate.length; i++) {
      const k = toTranslate[i];
      const v = translations[i] || '';
      if (v) result[k] = v;
    }
    const outPath = path.join(__dirname, '..', 'scripts', 'auto_translations.json');
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
    console.log('Wrote', Object.keys(result).length, 'translations to', outPath);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
