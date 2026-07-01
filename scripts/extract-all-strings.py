#!/usr/bin/env python3
"""Extract clean English UI strings from the app into a JSON file."""

import re
import json
import glob
from pathlib import Path

SRC_DIR = Path(__file__).resolve().parent.parent / "src"
OUTPUT = Path(__file__).resolve().parent.parent / "all_english_strings.json"

all_strings = set()

def is_ui_string(s):
    if len(s) < 2 or len(s) > 300:
        return False
    s_stripped = s.strip()
    if len(s_stripped) < 2:
        return False

    # Contains template literal syntax - likely code fragment
    if ('${' in s or '{' in s or '}' in s):
        return False
    
    # Contains JSX
    if '<' in s and '>' in s:
        return False
    
    # Code patterns
    code_patterns = [
        r'^const\s', r'^let\s', r'^var\s', r'^import\s', r'^export\s',
        r'^function\s', r'^return\s', r'^if\s*\(', r'^else\b',
        r'^for\s*\(', r'^while\s*\(', r'^switch\s*\(',
        r'^try\s*{', r'^catch\s*\(', r'^throw\s',
        r'^async\s', r'^await\s', r'^typeof\s', r'^instanceof\s',
        r'^new\s', r'^delete\s', r'^void\s',
        r'^console\.', r'^JSON\.', r'^Math\.', r'^Promise\.',
        r'^Array\.', r'^Object\.', r'^String\.', r'^Number\.',
        r'^Date\.', r'^window\.', r'^document\.', r'^localStorage\.',
        r'^sessionStorage\.', r'^fetch\s*\(',
        r'^require\s*\(', r'^import\s*\(',
        r'^\.\.\/', r'^\.\/', r'^/\w',
        r'^process\.', r'^module\.', r'^exports\.',
        r'^React\.', r'^useState', r'^useEffect', r'^useRef',
        r'^useMemo', r'^useCallback', r'^useContext',
        r'^createContext', r'^createRef', r'^forwardRef',
        r'^\s*//', r'^\s*/\*', r'^\s*\*',
        r'^[\s\t]*\)', r'^[\s\t]*\]',
    ]
    for pat in code_patterns:
        if re.match(pat, s_stripped):
            return False

    # Numbers, percentages, coordinates
    if re.match(r'^[\d\s.,%\-−/]+$', s_stripped):
        return False
    
    # Hex colors, rgba, etc.
    if re.match(r'^#[0-9a-fA-F]{3,8}$', s_stripped):
        return False
    if s_stripped.startswith('rgba') or s_stripped.startswith('rgb('):
        return False
    
    # Emails
    if re.match(r'^[\w\-.]+@[\w\-.]+\.\w+$', s_stripped):
        return False
    
    # URLs
    if s_stripped.startswith('http') or s_stripped.startswith('//'):
        return False
    
    # File paths
    if s_stripped.startswith('/') or s_stripped.startswith('./') or s_stripped.startswith('../'):
        return False
    
    # File extensions
    if re.match(r'^[\w\-]+\.(png|jpg|jpeg|gif|svg|ico|css|js|ts|tsx|jsx|json|html|woff2?)$', s_stripped, re.I):
        return False
    
    # CSS selectors
    if s_stripped.startswith('.') or s_stripped.startswith('#'):
        return False
    
    # CSS values
    if re.match(r'^[\d.]+(px|rem|em|vh|vw|%|s|ms|deg)$', s_stripped):
        return False
    
    # CSS variables
    if s_stripped.startswith('--') or s_stripped.startswith('var('):
        return False

    # Arrow functions
    if '=>' in s_stripped:
        return False
    
    # SQL
    if re.match(r'^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|FROM|WHERE|SET|INTO|VALUES)\b', s_stripped, re.I):
        return False
    
    # Tailwind-like classes (multiple colons, dashes)
    if re.match(r'^[a-z][a-z0-9]*[:-][a-z0-9][\w:-]*$', s_stripped) and len(s_stripped) > 8:
        return False

    # Contains operators as main content
    if re.match(r'^[\s+\-*/%=<>!&|^~?:;,.\'\"\[\](){}@#$`\\]+$', s_stripped):
        return False

    return True


def extract_jsx_text(text):
    """Extract clean text content between JSX tags."""
    found = set()
    # Match text between closing > and opening < - capture multi-line
    parts = re.findall(r'>([^<]{2,300})<', text)
    for t in parts:
        t = t.strip()
        if not t:
            continue
        # Split on template expressions
        segments = re.split(r'\{[^}]*\}', t)
        for seg in segments:
            seg = seg.strip()
            if not seg:
                continue
            # Collapse whitespace
            seg = re.sub(r'\s+', ' ', seg)
            if is_ui_string(seg):
                found.add(seg)
    return found


def extract_attrs(text):
    """Extract attribute values that are UI strings."""
    found = set()
    pat = re.compile(
        r'(?:placeholder|title|aria-label|label|helperText|alt|description|tooltip|confirmText|cancelText|submitText|emptyText|loadingText|errorText|successText|warningText|infoText|prompt|heading|subheading)\s*=\s*\{?\s*'
        r'"((?:[^"\\]|\\.){2,200})"'
        r'|'
        r'\'((?:[^\'\\]|\\.){2,200})\''
        r'|'
        r'`((?:[^`\\]|\\.){2,200})`',
        re.I
    )
    for m in pat.finditer(text):
        val = m.group(1) or m.group(2) or m.group(3)
        if val and is_ui_string(val):
            found.add(val.strip())
    return found


def extract_tag_content(text):
    """Extract UI text from specific HTML/JSX tags."""
    found = set()
    tag_pat = re.compile(
        r'<(h[1-6]|button|label|th|legend|option|caption|summary|figcaption|blockquote|cite|dt)'
        r'(?:\s[^>]*)?>'
        r'([^<]{2,200})'
        r'</\1>',
        re.I | re.S
    )
    for m in tag_pat.finditer(text):
        val = m.group(2).strip()
        if not val:
            continue
        val = re.sub(r'\s+', ' ', val)
        if is_ui_string(val):
            found.add(val)
    return found


# 1. Read existing enToAr keys (baseline)
ts_path = SRC_DIR / "contexts" / "translations.ts"
baseline = set()
if ts_path.exists():
    content = ts_path.read_text()
    pairs = re.findall(r'"((?:[^"\\]|\\.)*)"\s*:\s*"(?:[^"\\]|\\.)*"', content)
    for p in pairs:
        p = p.strip()
        if p and is_ui_string(p):
            baseline.add(p)

# 2. Read keyedTranslations
lc_path = SRC_DIR / "contexts" / "LanguageContext.tsx"
if lc_path.exists():
    content = lc_path.read_text()
    en_strings = re.findall(r'en:\s*"((?:[^"\\]|\\.)*)"', content)
    for s in en_strings:
        s = s.strip()
        if s and is_ui_string(s):
            baseline.add(s)

print(f"Baseline from dictionaries: {len(baseline)} strings")
all_strings.update(baseline)

# 3. Walk all source files
for ext in ('*.tsx', '*.ts', '*.jsx', '*.js'):
    for fpath in sorted(glob.glob(str(SRC_DIR / '**' / ext), recursive=True)):
        fpath = Path(fpath)
        if any(p in str(fpath) for p in ['node_modules', 'dist']):
            continue
        try:
            text = fpath.read_text(encoding='utf-8', errors='ignore')
            all_strings.update(extract_jsx_text(text))
            all_strings.update(extract_attrs(text))
            all_strings.update(extract_tag_content(text))
        except:
            pass

# Sort - clean strings first (real UI text), then everything else
def sort_key(s):
    # Prioritize strings that start with uppercase (real UI text)
    if s[0].isupper():
        return (0, s.lower())
    return (1, s.lower())

sorted_strings = sorted(all_strings, key=sort_key)

# Separate "clean" UI strings vs. "other" for reference
clean_strings = [s for s in sorted_strings if s[0].isupper()]

with open(OUTPUT, 'w', encoding='utf-8') as f:
    json.dump(sorted_strings, f, ensure_ascii=False, indent=2)

print(f"Total unique strings: {len(sorted_strings)}")
print(f"Clean UI strings (uppercase start): {len(clean_strings)}")
print(f"Saved to: {OUTPUT}")
print(f"\n=== First 80 clean UI strings ===")
for s in clean_strings[:80]:
    print(f"  {s}")
