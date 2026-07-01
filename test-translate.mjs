import fs from 'fs';

// Read the enToAr dictionary
const content = fs.readFileSync('./src/contexts/translations.ts', 'utf8');
const match = content.match(/export const enToAr[:\s]*(\{[\s\S]*?\n\};)/);
if (!match) {
  console.error('Could not extract enToAr dictionary');
  process.exit(1);
}

// Parse it
const dictText = match[1];
const entries = [];
const re = /"([^"]+)"\s*:\s*"([^"]+)"/g;
let m;
while ((m = re.exec(dictText))) {
  entries.push([m[1], m[2]]);
}

console.log(`Found ${entries.length} translations\n`);

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function translateText(raw, lang = 'ar') {
  if (lang !== 'ar') return raw;
  const trimmed = raw.trim();
  if (!trimmed) return raw;
  
  // Skip URLs/markdown
  if (/https?:\/\//.test(raw) || /\[[^\]]+\]\([^\)]+\)/.test(raw) || /^[_A-Za-z0-9\-]+$/.test(trimmed)) return raw;
  
  // Handle mixed Arabic/Latin
  if (/[A-Za-z]/.test(raw) && /[\u0600-\u06FF]/.test(raw)) {
    const latinRe = /[A-Za-z][A-Za-z\s'\-]{0,200}/g;
    let outMixed = raw;
    let match;
    while ((match = latinRe.exec(raw))) {
      const seg = match[0].trim();
      if (!seg) continue;
      let segTranslated = seg;
      const directSeg = entries.find(e => e[0] === seg);
      if (directSeg) {
        segTranslated = directSeg[1];
      } else {
        const sortedEntries = [...entries].filter(([en]) => en.length >= 2).sort((a, b) => b[0].length - a[0].length);
        for (const [en, ar] of sortedEntries) {
          const pattern = new RegExp(`(?<![A-Za-z0-9_])${escapeRegExp(en)}(?![A-Za-z0-9_])`, 'g');
          if (pattern.test(segTranslated)) segTranslated = segTranslated.replace(pattern, ar);
        }
      }
      outMixed = outMixed.replace(seg, segTranslated);
    }
    return outMixed;
  }
  
  // Whole-string match
  const direct = entries.find(e => e[0] === trimmed);
  if (direct) return raw.replace(trimmed, direct[1]);
  
  // Word-boundary replacement
  let out = trimmed;
  const sortedEntries = [...entries].filter(([en]) => en.length >= 2).sort((a, b) => b[0].length - a[0].length);
  for (const [en, ar] of sortedEntries) {
    const pattern = new RegExp(`(?<![A-Za-z0-9_])${escapeRegExp(en)}(?![A-Za-z0-9_])`, 'g');
    if (pattern.test(out)) {
      out = out.replace(pattern, ar);
    }
  }
  return raw.replace(trimmed, out);
}

// Test cases from the user's screenshot
const testCases = [
  "Sign In",
  "Password",
  "Email",
  "Remember me",
  "Sign in to access the school management system",
  "For Parents",
  "For Teachers",
  "School Management System - Uganda New Curriculum",
  "Track your child's attendance, grades, and communicate with teachers",
  "Manage classes, take attendance, and record learner progress",
  "Full access to manage all school operations and staff"
];

console.log('Test Results:\n');
testCases.forEach(test => {
  const result = translateText(test, 'ar');
  const status = result.includes('English') ? '❌' : '✓';
  console.log(`${status} "${test}"\n   → "${result}\n`);
});
