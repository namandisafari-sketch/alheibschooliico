#!/usr/bin/env node
// Phase 1: Extract clean UI-facing English text from TSX/TS source files.
// Runs extraction then aggressive filtering.

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const EXCLUDE_DIRS = new Set([
  'node_modules', 'dist', '.git', 'scripts', 'data',
  'styles', '__pycache__',
]);
const EXCLUDE_FILES = new Set([
  'vite-env.d.ts', 'auto-imports.d.ts',
]);

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

console.error('Scanning source files...');
const files = walk(SRC);
console.error('Found', files.length, 'files');

// Read existing dictionary to exclude already-translated strings
const matchFile = path.join(__dirname, '..', 'src', 'contexts', 'translations.ts');
const dictSrc = fs.readFileSync(matchFile, 'utf8');
const existingKeys = new Set();
const keyRe = /^\s*"([^"]+)"\s*:/gm;
let m;
while ((m = keyRe.exec(dictSrc))) existingKeys.add(m[1]);
console.error('Existing dictionary:', existingKeys.size, 'entries');

const seen = new Set();

function extractText(content) {
  const clean = content
    .replace(/\/\/.*/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/`[^`]*`/g, '') // remove template literals entirely
    .replace(/'[^']*'|"[^"]*"/g, (s) => { // normalize string literals
      // keep the content, remove quotes for matching
      return s.substring(1, s.length - 1);
    });

  // Find text between JSX tags: >text<
  const textRe = />([^<>{]+)</g;
  while ((m = textRe.exec(content))) {
    const raw = m[1].trim();
    if (!raw || raw.length < 2 || raw.length > 120) continue;
    addCandidate(raw);
  }

  // Find strings used in toast/notify/error/success messages
  const msgRe = /(?:toast|notify|message|error|success|warning|info)\(?\s*((["'`])[^"'`]+?\2)/g;
  while ((m = msgRe.exec(content))) {
    const raw = m[1].replace(/^["'`]|["'`]$/g, '').trim();
    if (!raw || raw.length < 2 || raw.length > 120) continue;
    addCandidate(raw);
  }

  // Find strings in status/error/placeholder/aria-label/alt attributes
  const attrRe = /(?:placeholder|title|aria-label|alt|label|description|helperText)\s*=\s*\{?\s*((["'`])[^"'`]+?\2)/g;
  while ((m = attrRe.exec(content))) {
    const raw = m[1].replace(/^["'`]|["'`]$/g, '').trim();
    if (!raw || raw.length < 2 || raw.length > 120) continue;
    addCandidate(raw);
  }
}

function addCandidate(raw) {
  // Filter aggressively
  const l = raw.replace(/\s+/g, ' ').trim();
  if (l.length < 2 || l.length > 120) return;
  if (seen.has(l)) return;
  seen.add(l);

  // Skip if already in dictionary
  if (existingKeys.has(l)) return;

  // Skip template syntax
  if (/\$\{/.test(l)) return;

  // Skip code constructs
  if (/^[`'"(\[\]{}=<>]/.test(l)) return;
  if (/^(const |let |var |import |export |function |return |if |else |switch |case |default|break|continue)/.test(l)) return;
  if (/[;{}()]=>/.test(l)) return;
  if (/\.(map|filter|reduce|find|forEach|includes|startsWith|endsWith|split|join|trim|replace|test|exec|match)\b/.test(l)) return;
  if (/\.(tsx?|jsx?|css|json|png|jpg|svg|ico|env|config)\b/i.test(l)) return;

  // Skip pure numeric/symbol lines
  if (/^[0-9\s\/\-.:,;@#%&*()+={}\[\]|\\^~\d]+$/.test(l)) return;

  // Skip CSS-like classes (lowercase with hyphens, no uppercase)
  if (/^[a-z][a-z0-9-]*[a-z0-9]$/.test(l) && !/[A-Z]/.test(l) && l.length < 40) return;
  if (/^[-0-9]/.test(l)) return;
  if (/^(rgba?|hsl|#)/.test(l)) return;

  // Skip HTML/JSX tags
  if (/^<\w+/.test(l)) return;
  if (/^[a-z]+\s*=/.test(l)) return;

  // Must have >=2 consecutive alpha chars
  if (!/[A-Za-z]{2,}/.test(l)) return;

  // Must be mostly text
  const alphaCount = (l.match(/[A-Za-z]/g) || []).length;
  const totalCount = l.replace(/\s/g, '').length;
  if (totalCount > 0 && alphaCount < totalCount * 0.4) return;

  // Skip specific non-UI words
  const skipWords = ['undefined','null','true','false','nan','infinity','typeof','instanceof','void','delete','new','this','that','then','catch','finally'];
  if (skipWords.includes(l.toLowerCase())) return;

  // Skip too many special chars
  const specialCount = (l.match(/[^A-Za-z0-9\s]/g) || []).length;
  if (specialCount > alphaCount * 1.5) return;

  // Skip lines with no uppercase (likely not a UI label)
  // But allow if it's a long sentence
  if (!/[A-Z]/.test(l) && l.length > 5 && /^[a-z]/.test(l)) return;

  // Skip known common non-UI patterns
  if (/^(https?:\/\/|www\.|mailto:)/i.test(l)) return;
  if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(l)) return;

  console.log(l);
}

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  extractText(content);
}
