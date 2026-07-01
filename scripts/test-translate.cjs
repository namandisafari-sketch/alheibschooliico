const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'contexts', 'translations.ts');
const src = fs.readFileSync(file, 'utf8');

// Parse enToAr object roughly
const start = src.indexOf('export const enToAr');
const objText = src.slice(start);
const braceStart = objText.indexOf('{');
const braceEnd = objText.indexOf('\n};', braceStart);
const block = objText.slice(braceStart, braceEnd + 2);
const re = /"([^\"]+)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
const enToAr = {};
let m;
while ((m = re.exec(block))) {
  enToAr[m[1]] = m[2].replace(/\\"/g, '"');
}

function toArabicDigits(input){
  const arDigits = "٠١٢٣٤٥٦٧٨٩";
  return input.replace(/[0-9]/g, (d)=>arDigits[Number(d)]);
}

function translateTextSim(raw){
  const trimmed = raw.trim();
  if (!trimmed) return raw;
  if (/https?:\/\//.test(raw) || /\[[^\]]+\]\([^\)]+\)/.test(raw) || /^[_A-Za-z0-9\-]+$/.test(trimmed)) return raw;
  const direct = enToAr[trimmed];
  if (direct) return raw.replace(trimmed, toArabicDigits(direct));
  let out = trimmed;
  const entries = Object.entries(enToAr).filter(([en]) => en.length >= 2);
  entries.sort((a,b)=>b[0].length - a[0].length);
  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (const [en, ar] of entries){
    const pattern = new RegExp('(?<![A-Za-z0-9_])'+escapeRegExp(en)+'(?![A-Za-z0-9_])','g');
    if (pattern.test(out)) out = out.replace(pattern, ar);
  }
  return toArabicDigits(raw.replace(trimmed, out));
}

const sample = `صف-page توج![School Logo](http://localhost:3000/icon-512x512.png)

# مدرسة الحبيب المختلطة النهارية والداخلية
School إدارةment System - المنهج الأوغندي الجديد

### For ولي الأمرs
Track your child's attendance, grades, and communicate with معلمون

### For المعلمون
إدارة classes, take attendance, and record learner progress

### For Administration
Full access to manage all school operations and موظفون

## Welcome Back
Sign in to access the school management system

البريد الإلكتروني

Password

Remember me
Sign In**New to the system?**ولي الأمر accounts are created when you register your child at the school office. موظفون accounts are created by administration.`;

const lines = sample.split('\n');
const out = lines.map(l=>translateTextSim(l)).join('\n');
console.log(out);
