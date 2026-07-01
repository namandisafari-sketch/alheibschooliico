#!/usr/bin/env node
// Phase 1: Extract clean UI-facing English text from TSX/TS source files.
// Skips CSS classes, code identifiers, JSX attrs, and already-translated keys.

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const EXCLUDE_DIRS = new Set([
  'node_modules', 'dist', '.git', 'scripts', 'data',
  'styles', '__pycache__',
]);
const EXCLUDE_FILES = new Set([
  'translations.ts', 'LanguageContext.tsx',
  'vite-env.d.ts', 'auto-imports.d.ts',
]);

// Collect all .tsx / .ts files
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    if (EXCLUDE_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walk(full));
    else if (/\.(tsx|ts)$/.test(e.name) && !EXCLUDE_FILES.has(e.name)) files.push(full);
  }
  return files;
}

const files = walk(SRC);
console.error('Scanning', files.length, 'files...');

// Read existing dictionary keys so we skip them
const dictSrc = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'contexts', 'translations.ts'),
  'utf8'
);
const existingKeys = new Set();
const keyRe = /^\s*"([^"]+)"\s*:/gm;
let m;
while ((m = keyRe.exec(dictSrc))) existingKeys.add(m[1]);

console.error('Existing dictionary entries:', existingKeys.size);

// Patterns to extract UI-facing strings
// 1. Text content between JSX tags (anything that looks like human text)
// 2. Strings passed to t() or tr() as string literals
// 3. Strings used in toast/notification messages

const seen = new Set();
const candidates = new Set();

function extractText(content, filePath) {
  // Remove template literals with ${} expressions (keep the string parts)
  // Remove comments
  content = content.replace(/\/\/.*/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ');

  // Extract strings from JSX text nodes: >text< between tags
  // Match >SOME TEXT< where SOME TEXT doesn't contain angle brackets
  const textNodeRe = />([^<>{]+)</g;
  while ((m = textNodeRe.exec(content))) {
    const raw = m[1].trim();
    if (!raw || raw.length < 2 || raw.length > 120) continue;
    // Skip pure whitespace, CSS, code, numbers, dates, URLs
    if (/^[0-9\s\/\-.:,;@#%&*()+={}\[\]|\\^~`]+$/.test(raw)) continue;
    if (/^(https?:\/\/|www\.)/i.test(raw)) continue;
    if (/^[a-z_-]+$/.test(raw) && !/[A-Z]/.test(raw)) continue; // likely CSS/code
    if (/^(var|const|let|function|import|export|return|if|else|for|while|async|await)$/.test(raw)) continue;
    if (existingKeys.has(raw)) continue;
    // Must contain at least one alphabetic char
    if (!/[A-Za-z]{2,}/.test(raw)) continue;
    const key = raw.replace(/\s+/g, ' ').trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      candidates.add(key);
    }
  }

  // Extract string literals passed to t() or tr()
  const callRe = /[.=]?\b(?:t|tr)\s*\(\s*(["'`])([^"'`]+?)\1/g;
  while ((m = callRe.exec(content))) {
    const raw = m[2].trim();
    if (!raw || raw.length < 2 || raw.length > 120) continue;
    if (existingKeys.has(raw)) continue;
    if (!/[A-Za-z]{2,}/.test(raw)) continue;
    const key = raw.replace(/\s+/g, ' ').trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      candidates.add(key);
    }
  }

  // Extract string literals from toast/notify/error messages
  const msgRe = /(?:toast|notify|message|error|success|warning|info)\(?\s*(["'`])([^"'`]{3,}?)\1/g;
  while ((m = msgRe.exec(content))) {
    const raw = m[2].trim();
    if (!raw || raw.length > 120) continue;
    if (existingKeys.has(raw)) continue;
    if (!/[A-Za-z]{2,}/.test(raw)) continue;
    const key = raw.replace(/\s+/g, ' ').trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      candidates.add(key);
    }
  }
}

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  extractText(content, file);
}

const sorted = [...candidates].sort();
console.error('Found', sorted.length, 'new candidate strings');

// Output as a clean list
for (const s of sorted) {
  console.log(s);
}
