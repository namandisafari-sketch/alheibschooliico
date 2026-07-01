import { useRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Scan } from "lucide-react";
import { cn } from "@/lib/utils";
import { parsePDF417Barcode } from "@/lib/studentScan";

export interface BarcodeScanData {
  raw: string;
  nin?: string;
  name?: string;
  type: "national_id" | "student_id" | "pdf417_student" | "unknown";
  pdf417?: {
    surname: string;
    givenNames: string;
    dob: string;
    studentId: string;
    admissionNumber: string;
  };
}

interface BarcodeScannerInputProps {
  onScan: (data: BarcodeScanData) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  label?: string;
}

export function BarcodeScannerInput({
  onScan,
  placeholder = "Scan barcode with scanner...",
  className,
  autoFocus = true,
  label,
}: BarcodeScannerInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const parseBarcode = (text: string): BarcodeScanData => {
    const trimmed = text.trim();

    // School ID PDF417 barcode — semicolon-delimited base64 format
    // Format: SURNAME_B64;GIVEN_NAMES_B64;;DOB;ISSUE;EXPIRY;UUID;ADM_NO;HASH
    const pdf417 = parsePDF417Barcode(trimmed);
    if (pdf417) {
      const fullName = [pdf417.surname, pdf417.givenNames].filter(Boolean).join(" ").trim();
      return {
        raw: trimmed,
        nin: pdf417.studentId,
        name: fullName || undefined,
        type: "pdf417_student",
        pdf417: {
          surname: pdf417.surname,
          givenNames: pdf417.givenNames,
          dob: pdf417.dob,
          studentId: pdf417.studentId,
          admissionNumber: pdf417.admissionNumber,
        },
      };
    }

    // Student badge format: ALHEIB:FEE:ID or simple student ID
    if (/^ALHEIB:/i.test(trimmed) || /^STU-/i.test(trimmed)) {
      const parts = trimmed.split(":");
      const id = parts[parts.length - 1] || trimmed;
      return { raw: trimmed, nin: id, name: id, type: "student_id" };
    }

    // Uganda National ID PDF417 — pipe-delimited fields
    // Format: NIN|SURNAME|OTHER_NAMES|DOB|SEX|...
    if (trimmed.includes("|")) {
      const parts = trimmed.split("|");
      const ninMatch = trimmed.match(/[A-Z0-9]{14}/);
      const surname = parts[1] || "";
      const givenNames = parts[2] || "";
      const name = [surname, givenNames].filter(Boolean).join(" ").trim() || trimmed;
      return {
        raw: trimmed,
        nin: ninMatch ? ninMatch[0] : parts[0] || undefined,
        name: name || undefined,
        type: "national_id",
      };
    }

    // Just a plain NIN (14 alphanumeric chars)
    const ninMatch = trimmed.match(/^[A-Z0-9]{14}$/);
    if (ninMatch) {
      return { raw: trimmed, nin: ninMatch[0], type: "national_id" };
    }

    // Single field — treat as student ID
    return { raw: trimmed, nin: trimmed, name: trimmed, type: "student_id" };
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim()) {
      e.preventDefault();
      const parsed = parseBarcode(value);
      onScan(parsed);
      setValue("");
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <Scan className="h-4 w-4 text-primary animate-pulse" />
      </div>
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="pl-9 h-12 text-base font-mono tracking-wider rounded-xl border-2 focus-visible:ring-primary"
        autoComplete="off"
        spellCheck={false}
      />
      {label && (
        <p className="text-[10px] text-muted-foreground mt-1 px-1">{label}</p>
      )}
    </div>
  );
}
