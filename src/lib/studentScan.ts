export interface StudentScanPayload {
  raw: string;
  studentId?: string;
  admissionNumber?: string;
}

export interface PDF417DecodedData {
  surname: string;
  givenNames: string;
  dob: string;
  issueDate: string;
  expiryDate: string;
  studentId: string;
  admissionNumber: string;
  securityHash: string;
}

const decodeBase64 = (str: string): string => {
  try {
    return atob(str);
  } catch {
    return str;
  }
};

const isPDF417Format = (input: string): boolean => {
  const parts = input.split(";");
  if (parts.length < 7) return false;
  const hasSemicolons = input.includes(";");
  const [first, second] = parts;
  if (!hasSemicolons || !first || !second) return false;
  try {
    const decoded1 = decodeBase64(first);
    const decoded2 = decodeBase64(second);
    return /^[A-Za-z\s-]+$/.test(decoded1) && /^[A-Za-z\s-]+$/.test(decoded2);
  } catch {
    return false;
  }
};

export const parsePDF417Barcode = (input: string): PDF417DecodedData | null => {
  const raw = (input || "").trim();
  if (!raw) return null;
  const parts = raw.split(";");
  if (parts.length < 7) return null;
  try {
    const surname = decodeBase64(parts[0]);
    const givenNames = decodeBase64(parts[1]);
    return {
      surname,
      givenNames,
      dob: parts[3] || "",
      issueDate: parts[4] || "",
      expiryDate: parts[5] || "",
      studentId: parts[6] || "",
      admissionNumber: parts[7] || "",
      securityHash: parts[8] || "",
    };
  } catch {
    return null;
  }
};

export const parseStudentScanPayload = (input: string): StudentScanPayload => {
  const raw = (input || "").trim();
  if (!raw) return { raw };

  const pdf417 = parsePDF417Barcode(raw);
  if (pdf417) {
    return {
      raw,
      studentId: pdf417.studentId,
      admissionNumber: pdf417.admissionNumber,
    };
  }

  const normalized = raw.replace(/\s+/g, "");
  const qrMatch = normalized.match(/^ALHEIB:(?:FEE|STU|STUDENT)?:(.+)$/i);
  if (qrMatch && qrMatch[1]) {
    return { raw, studentId: qrMatch[1].trim() };
  }

  const altMatch = normalized.match(/^ALHEIB:(.+)$/i);
  if (altMatch && altMatch[1]) {
    return { raw, studentId: altMatch[1].trim() };
  }

  if (/^ADM[\d\/]*/i.test(normalized) || /^[A-Z0-9\-\/]+$/.test(normalized)) {
    return { raw, admissionNumber: normalized };
  }

  return { raw, admissionNumber: normalized };
};
