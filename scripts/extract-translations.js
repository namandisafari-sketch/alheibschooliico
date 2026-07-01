const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'translation_candidates.txt');
const TRANSLATIONS_FILE = path.join(SRC, 'contexts', 'translations.ts');

function readEnToArKeys() {
  const src = fs.readFileSync(TRANSLATIONS_FILE, 'utf8');
  const start = src.indexOf('export const enToAr');
  if (start === -1) return new Set();
  const objText = src.slice(start);
  const braceStart = objText.indexOf('{');
  const braceEnd = objText.indexOf('\n};', braceStart);
  const block = objText.slice(braceStart, braceEnd + 2);
  const re = /"([^"]+)"\s*:\s*"(?:[^"\\]|\\.)*"/g;
  const keys = new Set();
  let m;
  while ((m = re.exec(block))) {
    keys.add(m[1]);
  }
  return keys;
}

function walk(dir, cb) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, cb);
    else cb(p);
  }
}

function extractStringsFromFile(file) {
  const ext = path.extname(file);
  if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) return [];
  const text = fs.readFileSync(file, 'utf8');
  const re = /(['`\"])((?:(?!\1).){2,200}?)\1/g;
  const found = new Set();
  let m;
  while ((m = re.exec(text))) {
    const s = m[2].trim();
    if (s.length < 2) continue;
    if (/^\s*$/.test(s)) continue;
    if (/^\d+$/.test(s)) continue;
    if (/http:|https:|\.png|\.svg|\.jpg|\/\//i.test(s)) continue;
    if (/^[A-Za-z0-9_\-]+$/.test(s)) continue; // likely identifiers
    if (/\{\{?/.test(s)) continue; // template
    found.add(s);
  }
  return Array.from(found);
}

function main() {
  const keys = readEnToArKeys();
  const found = new Set();
  walk(SRC, (f) => {
    const arr = extractStringsFromFile(f);
    for (const s of arr) found.add(s);
  });
  const candidates = Array.from(found).filter((s) => !keys.has(s));
  candidates.sort((a,b)=>a.localeCompare(b));
  fs.writeFileSync(OUT, candidates.join('\n'));
  console.log('Wrote', candidates.length, 'candidates to', OUT);
}

main();
