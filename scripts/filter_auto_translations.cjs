#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const inPath = path.join(__dirname, 'auto_translations.json');
const outPath = path.join(__dirname, 'filtered_auto_translations.json');
const raw = fs.readFileSync(inPath,'utf8');
const obj = JSON.parse(raw);
const arRe = /[\u0600-\u06FF]/;
const filtered = {};
for (const [k,v] of Object.entries(obj)){
  if (typeof v !== 'string') continue;
  if (arRe.test(v)) {
    filtered[k]=v;
  }
}
fs.writeFileSync(outPath, JSON.stringify(filtered, null, 2), 'utf8');
console.log('Filtered', Object.keys(filtered).length, 'entries to', outPath);
