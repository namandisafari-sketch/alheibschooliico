#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const candPath = path.join(__dirname, '..', 'translation_candidates.txt');
const srcPath = path.join(__dirname, '..', 'src', 'contexts', 'translations.ts');
const outPath = path.join(__dirname, 'generated_translations.json');

const raw = fs.readFileSync(candPath, 'utf8');
const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
function isGood(line){
  if (line.length > 80) return false;
  if (/^[\-\._\/\\]/.test(line)) return false;
  if (/\.(js|ts|jsx|tsx|css|json)$/.test(line)) return false;
  if (/^[0-9]+$/.test(line)) return false;
  if (/^\/.+\/$/.test(line)) return false;
  if (/^[#\*\*\-]+$/.test(line)) return false;
  // exclude many code-like lines
  if (/=|\(|\)|=>|\{|\}|;|\[|\]|\$/.test(line)) return false;
  if (!/[A-Za-z\u0600-\u06FF]/.test(line)) return false;
  return true;
}

// Simple token map
const dict = {
  'Attendance': 'الحضور',
  'Schedule': 'الجدول',
  'Dashboard': 'لوحة التحكم',
  'Email': 'البريد الإلكتروني',
  'Password': 'كلمة المرور',
  'Sign In': 'تسجيل الدخول',
  'Sign out': 'تسجيل الخروج',
  'Remember me': 'تذكّرني',
  'Welcome Back': 'مرحبًا بعودتك',
  'Welcome': 'مرحبًا',
  'Learner': 'متعلم',
  'Learners': 'المتعلمون',
  'Teacher': 'معلم',
  'Teachers': 'المعلمون',
  'Parents': 'أولياء الأمور',
  'Profile': 'الملف الشخصي',
  'Classes': 'الفصول',
  'Class': 'الفصل',
  'Schedule': 'الجدول',
  'Attendance Rate': 'نسبة الحضور',
  'View': 'عرض',
  'View All': 'عرض الكل',
  'Details': 'التفاصيل',
  'Reports': 'التقارير',
  'Search': 'بحث',
  'Submit': 'إرسال',
  'Cancel': 'إلغاء',
  'Save': 'حفظ',
  'Edit': 'تعديل',
  'Delete': 'حذف',
  'Add': 'إضافة',
  'Remove': 'إزالة',
  'Create': 'إنشاء',
  'Update': 'تحديث',
  'Close': 'إغلاق',
  'Home': 'الرئيسية',
  'Settings': 'الإعدادات',
  'Profile': 'الملف الشخصي',
  'Notifications': 'الإشعارات',
  'Search results': 'نتائج البحث',
  'No data': 'لا توجد بيانات',
  'Loading': 'جارٍ التحميل',
  'Error': 'خطأ',
  'Success': 'نجاح',
  'Students': 'الطلاب',
  'Student': 'طالب',
  'Parents Portal': 'بوابة أولياء الأمور',
  'Parent Portal': 'بوابة ولي الأمر'
};

const {keys: existingKeys} = (()=>{
  const src = fs.readFileSync(srcPath,'utf8');
  const re = /^\s*"([^"]+)"\s*:/gm;
  const keys = new Set(); let m;
  while ((m=re.exec(src))) keys.add(m[1]);
  return {keys, src};
})();

const seen = new Set();
const out = {};
for (const line of lines){
  if (!isGood(line)) continue;
  if (existingKeys.has(line)) continue;
  if (seen.has(line)) continue;
  // Attempt token-based translation
  const tokens = line.split(/(\s+|\/|\-|:|,)/);
  let translatedTokens = tokens.map(tok=>{
    if (dict[tok]) return dict[tok];
    // try case-insensitive
    const low = tok.toLowerCase();
    for (const k of Object.keys(dict)){
      if (k.toLowerCase()===low) return dict[k];
    }
    return null;
  });
  // if any token translated, build translation
  if (translatedTokens.some(t=>t!==null)){
    const built = translatedTokens.map((t,i)=> t===null? tokens[i] : t).join('');
    // simple cleanup: if built contains Arabic letters, accept
    if (/[\u0600-\u06FF]/.test(built)){
      out[line]=built;
      seen.add(line);
    }
  }
  if (Object.keys(out).length>=200) break;
}
fs.writeFileSync(outPath, JSON.stringify(out,null,2),'utf8');
console.log('Generated', Object.keys(out).length, 'translations to', outPath);
