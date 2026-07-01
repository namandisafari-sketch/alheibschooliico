#!/usr/bin/env node
// Filters extracted candidates to only clean UI-facing English text.
// Reads from stdin, writes clean list to stdout.

const fs = require('fs');

const raw = fs.readFileSync('/dev/stdin', 'utf8');
const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

const clean = [];

for (const l of lines) {
  // Must be 2-120 chars
  if (l.length < 2 || l.length > 120) continue;

  // Skip template literals with ${}
  if (/\$\{/.test(l)) continue;

  // Skip lines starting with common code constructs
  if (/^[`'"(\[\]{}=<>]/.test(l)) continue;
  if (/^const |^let |^var |^import |^export |^function |^return |^if |^else /.test(l)) continue;
  if (/^\.\w+/.test(l)) continue;

  // Skip lines containing code syntax
  if (/[;{}()]=>/.test(l)) continue;
  if (/\.(map|filter|reduce|find|forEach|includes|startsWith|endsWith|split|join|trim)\b/.test(l)) continue;
  if (/\.(tsx?|jsx?|css|json)\b/.test(l)) continue;

  // Skip purely numeric/date/symbol lines
  if (/^[0-9\s\/\-.:,;@#%&*()+={}\[\]|\\^~\d]+$/.test(l)) continue;

  // Skip lines that are clearly CSS/className values
  if (/^[a-z][a-z0-9-]+[a-z0-9]$/.test(l) && !/[A-Z]/.test(l) && l.length < 40) continue;
  if (/^[-0-9]/.test(l)) continue;
  if (/^(rgba?|hsl|#)[(]/.test(l)) continue;

  // Skip HTML tags / JSX attributes
  if (/^<\w+/.test(l)) continue;
  if (/^[a-z]+\s*=\s*['"[]/.test(l)) continue;

  // Must contain at least 2 consecutive alphabetic chars
  if (!/[A-Za-z]{2,}/.test(l)) continue;

  // Must be mostly text (not mostly symbols/numbers)
  const alphaCount = (l.match(/[A-Za-z]/g) || []).length;
  const totalCount = l.replace(/\s/g, '').length;
  if (alphaCount < totalCount * 0.4) continue;

  // Skip common non-UI false positives
  const skipWords = [
    'undefined', 'null', 'true', 'false', 'NaN', 'Infinity',
    'typeof', 'instanceof', 'void', 'delete', 'new', 'this',
  ];
  if (skipWords.includes(l.toLowerCase())) continue;

  // Skip lines with too many special chars relative to text
  const specialCount = (l.match(/[^A-Za-z0-9\s]/g) || []).length;
  if (specialCount > alphaCount * 1.5) continue;

  clean.push(l);
}

for (const s of clean) {
  console.log(s);
}
console.error('Filtered to', clean.length, 'candidates');
