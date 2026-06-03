const UGANDA_TIMEZONE = "Africa/Kampala";

type UgandaDateParts = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
};

const getUgandaDateParts = (date: Date): UgandaDateParts => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: UGANDA_TIMEZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const mapped = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;

  return {
    year: mapped.year,
    month: mapped.month,
    day: mapped.day,
    hour: mapped.hour,
    minute: mapped.minute,
    second: mapped.second,
  };
};

export const getUgandaNow = (): Date => {
  const { year, month, day, hour, minute, second } = getUgandaDateParts(new Date());
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+03:00`);
};

export const getUgandaDateString = (date: Date = getUgandaNow()): string => {
  return date.toISOString().slice(0, 10);
};

export const getUgandaToday = (): string => {
  return getUgandaDateString(getUgandaNow());
};

export const getUgandaDateDaysAgo = (days: number): string => {
  const now = getUgandaNow();
  return getUgandaDateString(new Date(now.getTime() - days * 86400000));
};

export const getUgandaISOString = (date: Date = getUgandaNow()): string => {
  return date.toISOString();
};

export const formatUgandaDate = (value: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-UG", {
    timeZone: UGANDA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...options,
  }).format(date);
};

export const formatUgandaDateTime = (value: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-UG", {
    timeZone: UGANDA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    ...options,
  }).format(date);
};

export const parseUgandaDateOnly = (value: string): Date => {
  return new Date(`${value}T00:00:00+03:00`);
};
