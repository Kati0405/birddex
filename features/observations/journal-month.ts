export interface MonthKey {
  year: number;
  month: number; // 1-12
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export function monthKeyToString({ year, month }: MonthKey): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function parseMonthKey(value: string | undefined | null): MonthKey | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

export function currentMonthKey(): MonthKey {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/** Clamps a requested month to the current month if it lies in the future. */
export function clampToCurrentMonth(key: MonthKey): MonthKey {
  const current = currentMonthKey();
  if (key.year > current.year || (key.year === current.year && key.month > current.month)) {
    return current;
  }
  return key;
}
