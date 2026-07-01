import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { enToAr, translateText, toArabicDigits, fetchTranslations, translationCache } from "./translations";

type Language = "en" | "ar";

// Legacy keyed translations kept for explicit t("key") calls scattered through the app.
const keyedTranslations: Record<string, { en: string; ar: string }> = {
  // Common
  dashboard: { en: "Dashboard", ar: "لوحة التحكم" },
  students: { en: "Students", ar: "الطلاب" },
  teachers: { en: "Teachers", ar: "المعلمون" },
  staff: { en: "Staff", ar: "الموظفون" },
  classes: { en: "Classes", ar: "الفصول" },
  attendance: { en: "Attendance", ar: "الحضور" },
  reports: { en: "Reports", ar: "التقارير" },
  notifications: { en: "Notifications", ar: "الإشعارات" },
  settings: { en: "Settings", ar: "الإعدادات" },
  salary: { en: "Salary Management", ar: "إدارة الرواتب" },
  idCards: { en: "ID Cards", ar: "البطاقات الشخصية" },
  feeManagement: { en: "Fee Management", ar: "إدارة الرسوم" },
  gatePasses: { en: "Gate Passes", ar: "تصاريح البوابة" },
  inventory: { en: "Inventory & Stock", ar: "المخزون" },
  assets: { en: "Assets Tracking", ar: "تتبع الأصول" },
  madrasa: { en: "Madrasa & Deen", ar: "المدرسة والدين" },
  hostel: { en: "Hostel & Welfare", ar: "السكن والرفاهية" },
  budget: { en: "Budget & Finance", ar: "الميزانية والمالية" },
  homework: { en: "Digital Homework", ar: "الواجبات الرقمية" },
  finance: { en: "Financial Accounts", ar: "الحسابات المالية" },
  procurement: { en: "Procurement & Store", ar: "المشتريات والمخزن" },
  pettyCash: { en: "Petty Cash", ar: "النثرية" },
  payroll: { en: "Payroll & HR", ar: "الرواتب والموارد البشرية" },
  auditLog: { en: "Audit Log", ar: "سجل التدقيق" },
  accountantDashboard: { en: "Accountant Dashboard", ar: "لوحة تحكم المحاسب" },

  // Departments
  "Administration Dept.": { en: "Administration Dept.", ar: "قسم الإدارة" },
  "Academic Dept.": { en: "Academic Dept.", ar: "قسم الشؤون الأكاديمية" },
  "Human Resources (HR)": { en: "Human Resources (HR)", ar: "الموارد البشرية" },
  "School Operations & Security": { en: "School Operations & Security", ar: "عمليات المدرسة والأمن" },
  "Finance Dept.": { en: "Finance Dept.", ar: "القسم المالي" },

  add: { en: "Add", ar: "إضافة" },
  edit: { en: "Edit", ar: "تعديل" },
  delete: { en: "Delete", ar: "حذف" },
  save: { en: "Save", ar: "حفظ" },
  cancel: { en: "Cancel", ar: "إلغاء" },
  search: { en: "Search", ar: "بحث" },
  filter: { en: "Filter", ar: "تصفية" },
  print: { en: "Print", ar: "طباعة" },
  download: { en: "Download", ar: "تحميل" },
  generate: { en: "Generate", ar: "توليد" },

  basicSalary: { en: "Basic Salary", ar: "الراتب الأساسي" },
  allowances: { en: "Allowances", ar: "البدلات" },
  deductions: { en: "Deductions", ar: "الخصومات" },
  netSalary: { en: "Net Salary", ar: "صافي الراتب" },
  paymentHistory: { en: "Payment History", ar: "سجل المدفوعات" },
  paymentDate: { en: "Payment Date", ar: "تاريخ الدفع" },
  paymentMethod: { en: "Payment Method", ar: "طريقة الدفع" },
  bankTransfer: { en: "Bank Transfer", ar: "تحويل بنكي" },
  cash: { en: "Cash", ar: "نقدي" },
  cheque: { en: "Cheque", ar: "شيك" },
  mobilePayment: { en: "Mobile Payment", ar: "دفع عبر الهاتف" },

  studentId: { en: "Student ID", ar: "رقم الطالب" },
  staffId: { en: "Staff ID", ar: "رقم الموظف" },
  bloodGroup: { en: "Blood Group", ar: "فصيلة الدم" },
  emergencyContact: { en: "Emergency Contact", ar: "جهة اتصال الطوارئ" },
  validUntil: { en: "Valid Until", ar: "صالح حتى" },
  issuedOn: { en: "Issued On", ar: "تاريخ الإصدار" },

  reportCard: { en: "Report Card", ar: "بطاقة التقرير" },
  academicYear: { en: "Academic Year", ar: "العام الدراسي" },
  term: { en: "Term", ar: "الفصل الدراسي" },
  term1: { en: "Term 1", ar: "الفصل الأول" },
  term2: { en: "Term 2", ar: "الفصل الثاني" },
  term3: { en: "Term 3", ar: "الفصل الثالث" },
  subject: { en: "Subject", ar: "المادة" },
  score: { en: "Score", ar: "الدرجة" },
  competency: { en: "Competency", ar: "الكفاءة" },
  exceeding: { en: "Exceeding Expectations", ar: "يتجاوز التوقعات" },
  meeting: { en: "Meeting Expectations", ar: "يلبي التوقعات" },
  approaching: { en: "Approaching Expectations", ar: "يقترب من التوقعات" },
  beginning: { en: "Beginning", ar: "مبتدئ" },
  teacherRemarks: { en: "Teacher's Remarks", ar: "ملاحظات المعلم" },
  headTeacherRemarks: { en: "Head Teacher's Remarks", ar: "ملاحظات المدير" },

  name: { en: "Name", ar: "الاسم" },
  fullName: { en: "Full Name", ar: "الاسم الكامل" },
  email: { en: "Email", ar: "البريد الإلكتروني" },
  phone: { en: "Phone", ar: "الهاتف" },
  address: { en: "Address", ar: "العنوان" },
  role: { en: "Role", ar: "الدور" },
  class: { en: "Class", ar: "الفصل" },
  gender: { en: "Gender", ar: "الجنس" },
  male: { en: "Male", ar: "ذكر" },
  female: { en: "Female", ar: "أنثى" },
  dateOfBirth: { en: "Date of Birth", ar: "تاريخ الميلاد" },
  admissionNumber: { en: "Admission Number", ar: "رقم القبول" },
  guardian: { en: "Guardian", ar: "ولي الأمر" },

  active: { en: "Active", ar: "نشط" },
  inactive: { en: "Inactive", ar: "غير نشط" },
  pending: { en: "Pending", ar: "معلق" },
  completed: { en: "Completed", ar: "مكتمل" },

  loading: { en: "Loading...", ar: "جاري التحميل..." },
  noData: { en: "No data found", ar: "لا توجد بيانات" },
  success: { en: "Success", ar: "تم بنجاح" },
  error: { en: "Error", ar: "خطأ" },

  learners: { en: "Learners", ar: "المتعلمون" },
  staffWorkers: { en: "Staff & Workers", ar: "الموظفون والعمال" },
  marksEntry: { en: "Marks Entry", ar: "إدخال الدرجات" },
  schedule: { en: "Schedule", ar: "الجدول" },
  userManagement: { en: "User Management", ar: "إدارة المستخدمين" },
  systemSettings: { en: "System Settings", ar: "إعدادات النظام" },
  logout: { en: "Logout", ar: "تسجيل الخروج" },
  staffAssignments: { en: "Staff Assignments", ar: "تعيينات الموظفين" },
  administrator: { en: "Administrator", ar: "مدير النظام" },
  parent: { en: "Parent", ar: "ولي الأمر" },
  teacher: { en: "Teacher", ar: "معلم" },
  primarySchool: { en: "Primary School", ar: "مدرسة ابتدائية" },

  staffIdCards: { en: "Staff ID Cards", ar: "بطاقات هوية الموظفين" },
  studentIdCards: { en: "Student ID Cards", ar: "بطاقات هوية الطلاب" },
  selectStaffMember: { en: "Select staff member", ar: "اختر موظفًا" },
  selectStudent: { en: "Select student", ar: "اختر طالبًا" },
  exportPng: { en: "Export PNG", ar: "تصدير PNG" },
  frontSideOnly: { en: "Front side only", ar: "الوجه الأمامي فقط" },
  backSideOnly: { en: "Back side only", ar: "الوجه الخلفي فقط" },
  bothSides: { en: "Both sides", ar: "كلا الوجهين" },
  frontSide: { en: "Front Side", ar: "الوجه الأمامي" },
  backSide: { en: "Back Side", ar: "الوجه الخلفي" },
  selectToPreview: { en: "Select someone to preview", ar: "اختر شخصًا للمعاينة" },
  generateIdSubtitle: {
    en: "Generate ID cards for staff and students",
    ar: "إنشاء بطاقات الهوية للموظفين والطلاب",
  },
  batchExport: { en: "Batch Export", ar: "تصدير دفعة" },
  exportWholeSchool: { en: "Export whole school", ar: "تصدير المدرسة بأكملها" },
  exportByClass: { en: "Export by class", ar: "تصدير حسب الفصل" },
  selectClass: { en: "Select class", ar: "اختر الفصل" },
  allClasses: { en: "All classes", ar: "جميع الفصول" },
  generatingZip: { en: "Generating ZIP...", ar: "جاري إنشاء الملف..." },
  downloadZip: { en: "Download ZIP", ar: "تنزيل الملف المضغوط" },
  exported: { en: "Exported", ar: "تم التصدير" },
  exportFailed: { en: "Export failed", ar: "فشل التصدير" },
  cardDownloaded: { en: "ID card downloaded", ar: "تم تنزيل البطاقة" },

  admNo: { en: "Adm. No", ar: "رقم القبول" },
  staffIdShort: { en: "Staff ID", ar: "رقم الوظيفي" },
  qualification: { en: "Qualification", ar: "المؤهل" },
  emergency: { en: "Emergency", ar: "طوارئ" },
  director: { en: "Director", ar: "المدير" },
  headTeacher: { en: "Head Teacher", ar: "ناظر المدرسة" },
  studentIdentityCard: { en: "Student Identity Card", ar: "بطاقة هوية الطالب" },
  staffIdentityCard: { en: "Staff Identity Card", ar: "بطاقة هوية الموظف" },
  cardInformation: { en: "Card Information", ar: "معلومات البطاقة" },
  issued: { en: "Issued", ar: "تاريخ الإصدار" },
  district: { en: "District", ar: "المنطقة" },
  religion: { en: "Religion", ar: "الديانة" },
  enrolled: { en: "Enrolled", ar: "تاريخ التسجيل" },

  idCardSignaturesBranding: { en: "ID Card Signatures & Branding", ar: "توقيعات وعلامة بطاقة الهوية" },
  idCardSettingsDesc: {
    en: "Upload Director and Head Teacher signatures — they will appear on every generated ID card.",
    ar: "قم بتحميل توقيعات المدير وناظر المدرسة — ستظهر على كل بطاقة هوية يتم إنشاؤها.",
  },
  directorName: { en: "Director Name", ar: "اسم المدير" },
  directorSignature: { en: "Director Signature", ar: "توقيع المدير" },
  headTeacherName: { en: "Head Teacher Name", ar: "اسم ناظر المدرسة" },
  headTeacherSignature: { en: "Head Teacher Signature", ar: "توقيع ناظر المدرسة" },
  schoolLogoUrl: { en: "School Logo URL (optional)", ar: "رابط شعار المدرسة (اختياري)" },
  backPolicyEn: { en: "Back-side Policy (English)", ar: "سياسة الوجه الخلفي (الإنجليزية)" },
  backPolicyAr: { en: "Back-side Policy (Arabic)", ar: "سياسة الوجه الخلفي (العربية)" },
  saveSettings: { en: "Save Settings", ar: "حفظ الإعدادات" },
  upload: { en: "Upload", ar: "رفع" },
  noSignature: { en: "No signature", ar: "لا يوجد توقيع" },
  saved: { en: "Saved", ar: "تم الحفظ" },
  settingsUpdated: { en: "Settings updated", ar: "تم تحديث الإعدادات" },

  academic: { en: "Academic", ar: "أكاديمي" },
  islamic: { en: "Islamic", ar: "إسلامي" },
  copyPreviousTerm: { en: "Copy previous term", ar: "نسخ الفصل السابق" },
  saveAll: { en: "Save all", ar: "حفظ الكل" },
  unsavedChanges: { en: "unsaved changes", ar: "تغييرات غير محفوظة" },
  autoSaved: { en: "auto-saved", ar: "حفظ تلقائي" },
  total: { en: "Total", ar: "المجموع" },
  average: { en: "Average", ar: "المعدل" },
  position: { en: "Position", ar: "الترتيب" },
  publish: { en: "Publish", ar: "نشر" },
  publishAndLock: { en: "Publish & Lock", ar: "نشر وقفل" },
  publishWholeClass: { en: "Publish whole class", ar: "نشر الفصل بأكمله" },
  unlock: { en: "Unlock", ar: "فتح القفل" },
  preview: { en: "Preview", ar: "معاينة" },
  draft: { en: "Draft", ar: "مسودة" },
  published: { en: "Published", ar: "منشور" },
  locked: { en: "Locked", ar: "مقفل" },
  selectAll: { en: "Select all", ar: "تحديد الكل" },
  clear: { en: "Clear", ar: "مسح" },
  daysPresent: { en: "Days Present", ar: "أيام الحضور" },
  daysAbsent: { en: "Days Absent", ar: "أيام الغياب" },
  discipline: { en: "Discipline", ar: "الانضباط" },
  participation: { en: "Participation", ar: "المشاركة" },
  cleanliness: { en: "Cleanliness", ar: "النظافة" },
  juzCompleted: { en: "Juz Completed", ar: "الجزء المكتمل" },
  qualityExcellent: { en: "Excellent", ar: "ممتاز" },
  qualityGood: { en: "Good", ar: "جيد" },
  qualityFair: { en: "Fair", ar: "مقبول" },
  qualityNeedsWork: { en: "Needs Work", ar: "يحتاج تحسين" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tr: (text: string | number) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// Global DOM auto-translator: walks visible text nodes and substitutes any
// English token found in the dictionary with its Arabic equivalent. Also
// converts Western digits to Arabic-Indic digits. Runs only when lang=ar.
// ─────────────────────────────────────────────────────────────────────────────
const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "CODE", "PRE",
  "SVG", "PATH", "CANVAS", "IMG", "VIDEO", "AUDIO",
]);

const translateNode = (node: Node) => {
  if (node.nodeType === Node.TEXT_NODE) {
    const original = node.nodeValue;
    if (!original || !original.trim()) return;
    // Don't re-translate already-Arabic text
    if (/[\u0600-\u06FF]/.test(original) && !/[A-Za-z]/.test(original)) {
      // still convert digits
      const digitsOnly = toArabicDigits(original);
      if (digitsOnly !== original) node.nodeValue = digitsOnly;
      return;
    }
    const next = translateText(original, "ar");
    if (next !== original) node.nodeValue = next;
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const el = node as Element;
  if (SKIP_TAGS.has(el.tagName)) return;
  // Skip elements explicitly opted out (e.g. brand strings, code identifiers)
  if (el.hasAttribute("data-no-translate")) return;
  // Translate placeholder & title attributes too
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const ph = el.getAttribute("placeholder");
    if (ph) {
      const next = translateText(ph, "ar");
      if (next !== ph) el.setAttribute("placeholder", next);
    }
  }
  const t = el.getAttribute("title");
  if (t) {
    const next = translateText(t, "ar");
    if (next !== t) el.setAttribute("title", next);
  }
  el.childNodes.forEach(translateNode);
};

// ─────────────────────────────────────────────────────────────────────────────
// Async translation pass: after the dictionary-based sync pass, collect ALL
// remaining English text (text nodes, placeholders, titles) and send them to
// Ollama in a single batch for full Arabic translation.
// Results are cached so subsequent renders are instant.
// ─────────────────────────────────────────────────────────────────────────────
const asyncTranslateSweep = async () => {
  const seen = new Set<string>();
  const nodesByText = new Map<string, Text[]>();
  const attrsByText = new Map<string, { el: Element; attr: string }[]>();

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    const text = node.nodeValue?.trim();
    if (!text) continue;
    if (/[\u0600-\u06FF]/.test(text) && !/[A-Za-z]/.test(text)) continue;
    // Check parent skip chain
    let el = node.parentElement;
    let skip = false;
    while (el) {
      if (el.hasAttribute("data-no-translate") || SKIP_TAGS.has(el.tagName)) {
        skip = true;
        break;
      }
      el = el.parentElement;
    }
    if (skip) continue;
    const cached = translationCache.get(text);
    if (cached) {
      if (node.nodeValue !== cached) node.nodeValue = toArabicDigits(cached);
      continue;
    }
    if (!seen.has(text)) {
      seen.add(text);
      nodesByText.set(text, []);
    }
    nodesByText.get(text)!.push(node);
  }

  // Collect placeholder & title attributes too
  document.querySelectorAll("[placeholder], [title]").forEach((el) => {
    if (el.hasAttribute("data-no-translate")) return;
    let p = el.parentElement;
    while (p) { if (p.hasAttribute("data-no-translate")) return; p = p.parentElement; }
    ["placeholder", "title"].forEach((attr) => {
      const val = el.getAttribute(attr);
      if (!val || /[\u0600-\u06FF]/.test(val)) return;
      const cached = translationCache.get(val);
      if (cached) {
        el.setAttribute(attr, cached);
        return;
      }
      if (!seen.has(val)) {
        seen.add(val);
        attrsByText.set(val, []);
      }
      attrsByText.get(val)!.push({ el, attr });
    });
  });

  const allTexts = [...nodesByText.keys(), ...attrsByText.keys()];
  if (allTexts.length === 0) return;

  const results = await fetchTranslations(allTexts);
  if (!results || results.size === 0) return;

  for (const [original, translated] of results) {
    const arText = toArabicDigits(translated);
    const textNodes = nodesByText.get(original);
    if (textNodes) {
      for (const n of textNodes) n.nodeValue = arText;
    }
    const attrNodes = attrsByText.get(original);
    if (attrNodes) {
      for (const { el, attr } of attrNodes) el.setAttribute(attr, arText);
    }
  }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    if (saved) return saved as Language;
    // Auto-detect device/browser language (like WhatsApp)
    // Check navigator.languages (preferred, broader support), then navigator.language
    const langs = typeof navigator.languages !== "undefined" ? navigator.languages : [navigator.language];
    const isArabic = langs.some((l) => l && l.startsWith("ar"));
    return isArabic ? "ar" : "en";
  });

  const isRTL = language === "ar";
  const observerRef = useRef<MutationObserver | null>(null);
  const continuousSweepRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const asyncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = language;

    // Tear down previous observer & timers
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (continuousSweepRef.current) {
      clearInterval(continuousSweepRef.current);
      continuousSweepRef.current = null;
    }
    if (asyncDebounceRef.current) {
      clearTimeout(asyncDebounceRef.current);
      asyncDebounceRef.current = null;
    }

    if (!isRTL) {
      // Reload to restore original English DOM (since we mutated text nodes in-place)
      // Use a soft reload only if we previously translated.
      if (document.documentElement.getAttribute("data-translated") === "ar") {
        document.documentElement.removeAttribute("data-translated");
        // Force React to re-render by triggering a route refresh: reload the page.
        window.location.reload();
      }
      return;
    }

    document.documentElement.setAttribute("data-translated", "ar");

    const doTranslate = () => {
      translateNode(document.body);
      asyncTranslateSweep();
    };

    // Initial sweep — defer to next tick so React has flushed.
    requestAnimationFrame(doTranslate);

    // Repeated sweeps at intervals to catch dynamically rendered content
    const reSweepTimers = [2000, 5000, 10000, 20000].map((ms) =>
      setTimeout(doTranslate, ms)
    );

    // Continuous sweep every 30 seconds to catch any missed text
    continuousSweepRef.current = setInterval(doTranslate, 30000);

    // Sweep on user interaction — common trigger for lazy-loaded content
    const interactionSweep = () => setTimeout(doTranslate, 500);
    document.addEventListener("click", interactionSweep, true);

    // Watch for future DOM updates from React renders.
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach(translateNode);
        if (m.type === "characterData" && m.target.nodeType === Node.TEXT_NODE) {
          translateNode(m.target);
        }
        if (m.type === "attributes" && m.target.nodeType === Node.ELEMENT_NODE) {
          translateNode(m.target);
        }
      }
      // Async fallback after DOM settles
      if (asyncDebounceRef.current) clearTimeout(asyncDebounceRef.current);
      asyncDebounceRef.current = setTimeout(asyncTranslateSweep, 500);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "title", "value"],
    });
    observerRef.current = observer;

    return () => {
      observer.disconnect();
      reSweepTimers.forEach(clearTimeout);
      if (continuousSweepRef.current) clearInterval(continuousSweepRef.current);
      if (asyncDebounceRef.current) clearTimeout(asyncDebounceRef.current);
      document.removeEventListener("click", interactionSweep, true);
    };
  }, [language, isRTL]);

  // React to device/browser language changes in real-time
  useEffect(() => {
    const onLanguageChange = () => {
      const langs = typeof navigator.languages !== "undefined" ? navigator.languages : [navigator.language];
      const isArabic = langs.some((l) => l && l.startsWith("ar"));
      const saved = localStorage.getItem("language");
      // Only auto-switch if user hasn't made an explicit choice
      if (!saved) {
        setLanguage(isArabic ? "ar" : "en");
      } else {
        // If user made a choice, still update if it matches the device language
        const currentLang = saved as Language;
        if (isArabic && currentLang === "en") setLanguage("ar");
        else if (!isArabic && currentLang === "ar") setLanguage("en");
      }
    };
    window.addEventListener("languagechange", onLanguageChange);
    return () => window.removeEventListener("languagechange", onLanguageChange);
  }, []);

  const t = (key: string): string => {
    const entry = keyedTranslations[key];
    if (entry) return entry[language];
    // Fallback: treat the key itself as English text and translate via dictionary.
    return translateText(key, language);
  };

  // Universal translate-any-string helper. Use on dynamic strings to ensure
  // they appear in Arabic when language=ar.
  const tr = (text: string | number): string => {
    const s = String(text);
    return language === "ar" ? translateText(s, "ar") : s;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tr, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export { enToAr };
