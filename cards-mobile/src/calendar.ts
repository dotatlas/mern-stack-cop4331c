// Month-grid math for the Calendar tab. Plain dates only (local time); no events yet.

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Header row, Sunday first like the web (it shows the first 3 letters on small screens)
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export type CalendarDay = {
  key: string; // "2026-11-25", also used to compare days
  day: number; // 1–31, the number shown in the cell
  inMonth: boolean; // false = a leading/trailing day from the month before/after
};

// "YYYY-MM-DD" in local time (not toISOString, which is UTC and can be a day off)
export function dayKey(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// The cells for one month, split into weeks of 7 (Sun–Sat).
// month is 0–11, like Date.getMonth().
export function buildMonthGrid(year: number, month: number): CalendarDay[][] {
  // Weekday the 1st falls on: 0 = Sunday ... 6 = Saturday.
  // That many days from the previous month fill the start of the first week.
  const leading = new Date(year, month, 1).getDay();
  // Day 0 of next month = the last day of this month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Round up to whole weeks; the extra cells at the end come from next month.
  // Months take 4, 5 or 6 rows, like the web's grid.
  const weekCount = Math.ceil((leading + daysInMonth) / 7);

  const weeks: CalendarDay[][] = [];
  for (let w = 0; w < weekCount; w++) {
    const week: CalendarDay[] = [];
    for (let d = 0; d < 7; d++) {
      // Cell 0 is "day 1 minus `leading`" of this month. Date rolls numbers
      // outside 1..daysInMonth into the neighboring month (and year) for us,
      // e.g. new Date(2026, 0, 0) is Dec 31, 2025.
      const date = new Date(year, month, 1 - leading + w * 7 + d);
      week.push({
        key: dayKey(date),
        day: date.getDate(),
        inMonth: date.getMonth() === month,
      });
    }
    weeks.push(week);
  }
  return weeks;
}
