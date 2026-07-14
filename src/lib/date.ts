export function parseLocalDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;

  const iso = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
      return date;
    }
    return null;
  }

  const dmy = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    let year = Number(dmy[3]);
    if (year < 100) year += 2000;
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
      return date;
    }
  }

  return null;
}

export function getLocalYear(dateStr: string | null | undefined) {
  return parseLocalDate(dateStr)?.getFullYear() ?? null;
}

export function getLocalMonthIndex(dateStr: string | null | undefined) {
  return parseLocalDate(dateStr)?.getMonth() ?? null;
}

export function dateIsInRange(
  dateStr: string | null | undefined,
  startStr: string | null | undefined,
  endStr: string | null | undefined,
) {
  const date = parseLocalDate(dateStr);
  if (!date) return false;
  const start = parseLocalDate(startStr);
  const end = parseLocalDate(endStr);
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

export function monthOverlapsRange(
  year: number,
  monthIndex: number,
  startStr: string | null | undefined,
  endStr: string | null | undefined,
) {
  const start = parseLocalDate(startStr);
  const end = parseLocalDate(endStr);
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 0);
  if (start && monthEnd < start) return false;
  if (end && monthStart > end) return false;
  return true;
}