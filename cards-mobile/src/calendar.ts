// Month-grid math and event helpers for the Calendar tab. All dates are local time.

// GET /api/events?from=<ISO>&to=<ISO> (login required). Both are required.
// Replies 200 { events: [...] } (wrapped, unlike /reminders), sorted by start,
// with every event that overlaps the range: start < to AND end > from.
export const EVENTS_PATH = '/events';

// An event as the backend sends it (cards-backend/models/Event.js).
// Dates are ISO strings. Server-only fields (userId) are left out.
export type CalendarEvent = {
  _id: string;
  title: string;
  start: string;
  end: string; // never before start
  allDay: boolean;
  location: string;
  notes?: string;
  color: string; // "#RRGGBB", backend default "#007AFF"
  category: string; // default "General"
};

export type EventsResponse = { events: CalendarEvent[] };

// POST /api/events (login required). title, start and end are required; end
// can't be before start. Replies 201 { message, event } (wrapped).
export type NewEvent = {
  title: string;
  start: string; // ISO
  end: string; // ISO
  allDay: boolean;
  location: string;
  notes: string;
  color: string;
  category: string;
};
export type CreateEventResponse = { message: string; event: CalendarEvent };

// The web's "Accent Color" swatches, in its order (Dark Blue is its default)
export const EVENT_COLORS = [
  { label: 'Dark Blue', value: '#2C3E55' },
  { label: 'Warm Pink', value: '#A85368' },
  { label: 'Dark Green', value: '#355E48' },
  { label: 'Muted Purple', value: '#5E4068' },
] as const;

// The web's "Category" choices, in its order (Personal is its default)
export const EVENT_CATEGORIES = ['Personal', 'School', 'Work', 'Family/Friends', 'General'] as const;

// Reads a typed time: "2:00 PM", "2pm", "2:30p", "14:30", "9:05 am".
// A bare number like "2" is rejected (AM or PM?). Returns null if unreadable.
export function parseTime(text: string): { hours: number; minutes: number } | null {
  const t = text.trim().toLowerCase().replace(/\./g, '');
  // With AM/PM: hour 1–12, minutes optional
  let m = t.match(/^(\d{1,2})(?::(\d{2}))?\s*([ap])m?$/);
  if (m) {
    const h = Number(m[1]);
    const min = m[2] ? Number(m[2]) : 0;
    if (h < 1 || h > 12 || min > 59) return null;
    const pm = m[3] === 'p';
    return { hours: (h % 12) + (pm ? 12 : 0), minutes: min }; // 12 AM = 0, 12 PM = 12
  }
  // 24-hour: "14:30"
  m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (m) {
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h > 23 || min > 59) return null;
    return { hours: h, minutes: min };
  }
  return null;
}

// The web dashboard's four event colors. It shows any other color (including
// the backend's default #007AFF) as blue, so mobile does the same.
// main = left bar, text = label text, tint = label background (main at 12%).
const ACCENTS: Record<string, { main: string; text: string }> = {
  '#2C3E55': { main: '#2C3E55', text: '#1E2E40' }, // blue
  '#A85368': { main: '#A85368', text: '#632736' }, // pink
  '#355E48': { main: '#355E48', text: '#1E3E2D' }, // green
  '#5E4068': { main: '#5E4068', text: '#3E2546' }, // purple
};

export function eventAccent(color: string) {
  const accent = ACCENTS[color?.toUpperCase()] ?? ACCENTS['#2C3E55'];
  return { ...accent, tint: `${accent.main}1F` }; // 1F hex = 12% opacity
}

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

// "2026-11-25" back to a local Date at midnight
export function dateFromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Day panel title: "Wednesday, Nov 25" (the year is added if it isn't this year)
export function formatDayTitle(key: string): string {
  const date = dateFromKey(key);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

const time = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const shortDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// The time line on an event card:
//   all day:       "All day"            (or "All day · Nov 29 – Dec 1" if it spans days)
//   one day:       "9:00 AM – 10:00 AM" (or just "9:00 AM" if start = end)
//   several days:  "Nov 29, 9:00 AM – Dec 1, 5:00 PM"
export function formatEventTime(event: CalendarEvent): string {
  const start = new Date(event.start);
  const end = new Date(event.end);
  // Same rule as eventsByDay: ending exactly at midnight doesn't count the new day
  const endsAtMidnight =
    end > start && end.getHours() === 0 && end.getMinutes() === 0 &&
    end.getSeconds() === 0 && end.getMilliseconds() === 0;
  const lastDay = endsAtMidnight ? new Date(end.getTime() - 1) : end;
  const oneDay = dayKey(start) === dayKey(lastDay);

  if (event.allDay) {
    return oneDay ? 'All day' : `All day · ${shortDate(start)} – ${shortDate(lastDay)}`;
  }
  if (oneDay) {
    return start.getTime() === end.getTime() ? time(start) : `${time(start)} – ${time(end)}`;
  }
  return `${shortDate(start)}, ${time(start)} – ${shortDate(end)}, ${time(end)}`;
}

// The time span the grid shows, dimmed neighbor days included:
// from = midnight starting the first cell, to = midnight after the last cell.
export function monthGridRange(year: number, month: number): { from: Date; to: Date } {
  const leading = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cellCount = Math.ceil((leading + daysInMonth) / 7) * 7;
  return {
    from: new Date(year, month, 1 - leading),
    to: new Date(year, month, 1 - leading + cellCount),
  };
}

// Groups events by the days they cover, as { "YYYY-MM-DD": [events] }.
// A multi-day event is added to every day from its start day to its end day.
// An end of exactly midnight doesn't count that new day (e.g. 10 PM–12 AM
// is one day). Only days inside `range` are filled, so a very long event
// can't make this loop run for years.
export function eventsByDay(
  events: CalendarEvent[],
  range: { from: Date; to: Date },
): Record<string, CalendarEvent[]> {
  const byDay: Record<string, CalendarEvent[]> = {};
  for (const event of events) {
    const start = new Date(event.start);
    const end = new Date(event.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;

    // Last moment the event actually covers
    const endsAtMidnight =
      end > start && end.getHours() === 0 && end.getMinutes() === 0 &&
      end.getSeconds() === 0 && end.getMilliseconds() === 0;
    const last = endsAtMidnight ? new Date(end.getTime() - 1) : end;

    // Walk day by day, starting at midnight of the start day (or the grid's first day)
    let day = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    if (day < range.from) day = new Date(range.from);
    while (day <= last && day < range.to) {
      const key = dayKey(day);
      (byDay[key] ??= []).push(event);
      day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
    }
  }
  return byDay;
}
