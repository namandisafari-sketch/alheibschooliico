#!/usr/bin/env node
// Final candidate preparation — aggressively filter, dedupe, exclude existing keys.

const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(
  path.join(__dirname, 'clean_candidates.txt'), 'utf8'
).split(/\n/);

// Skip stderr lines at the top
const contentStart = raw.findIndex(l =>
  l.startsWith('Something went wrong') || l.startsWith('Alheb AI') || l.startsWith("ErrorBoundary")
);
const lines = contentStart >= 0 ? raw.slice(contentStart) : raw;

// Read existing dictionary
const dictSrc = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'contexts', 'translations.ts'), 'utf8'
);
const existingKeys = new Set();
const keyRe = /^\s*"([^"]+)"\s*:/gm;
let m;
while ((m = keyRe.exec(dictSrc))) existingKeys.add(m[1]);

const seen = new Set();

function keep(s) {
  if (!s || s.length < 3 || s.length > 120) return false;
  if (seen.has(s)) return false;
  if (existingKeys.has(s)) return false;
  seen.add(s);

  // --- CODE PATTERNS ---
  if (/[;{}\]](\s*$|.{0,3}$)/.test(s)) return false; // ends with ; { } ]
  if (/\(|\)/.test(s)) return false; // contains parens
  if (/=>/.test(s)) return false;
  if (/^['"`]/.test(s)) return false;
  if (/\.(map|filter|reduce|forEach|length|toString|toFixed|join|split|trim|replace|test|exec|match|substring|slice|indexOf|includes|startsWith|endsWith)\b/i.test(s)) return false;
  if (/\b(import|export|return|const|let|var|function|if|else|switch|case|break|continue|typeof|instanceof|void|delete|async|await)\b/i.test(s)) return false;
  if (/>\s*<\/|<[a-z][a-z0-9]*(\s|>)/.test(s)) return false;
  if (/^\s*=/.test(s)) return false;

  // --- CSS / CODE IDENTIFIERS ---
  if (/^[a-z][a-z0-9-]*$/.test(s) && !/[A-Z]/.test(s) && !/\s/.test(s)) return false;
  if (/^[a-z][a-zA-Z0-9]*$/.test(s) && !/\s/.test(s) && s.length < 30) return false;

  // --- NON-TEXT ---
  if (/^[0-9\s\/\-.:,;@#%&*()+={}\[\]|\\^~`\u2000-\u206F\uFE00-\uFE0F]+$/.test(s)) return false;
  if (/^https?:\/\//.test(s)) return false;

  // --- ALPHA RATIO ---
  const alpha = (s.match(/[A-Za-z\u00C0-\u024F]/g) || []).length;
  const total = s.replace(/\s/g, '').length;
  if (total > 0 && alpha / total < 0.55) return false;

  // --- SPECIFIC FALSE POSITIVES ---
  const lower = s.toLowerCase();
  if (['ugx', 'nssf', 'paye', 'tin', 'vat', 'emis', 'ple', 'iple',
      'uneb', 'umesc', 'moes', 'uace', 'nira', 'lin', 'nin',
      'cpr', 'qr', 'csv', 'pdf', 'id', 'pwd', 'hq',
     ].includes(lower)) return false;
  if (/^&/.test(s)) return false;
  if (/^[a-z]+\s*=/.test(s)) return false;

  // Allow if it's a proper UI string
  // Must have at least 2 words OR starts with uppercase
  if (/\s/.test(s) && s.split(/\s+/).length >= 2) return true;
  if (/^[A-Z]/.test(s) && s.length >= 4) return true;

  return false;
}

const filtered = lines.filter(keep);
const unique = [...new Set(filtered)];

fs.writeFileSync(
  path.join(__dirname, 'filtered_candidates.txt'),
  unique.join('\n'),
  'utf8'
);
console.log(unique.length);
