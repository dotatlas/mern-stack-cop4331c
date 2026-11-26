// Reminders, shaped like the backend's Reminder model (cards-backend/models/Reminder.js)
// as it comes back in JSON: _id is a string and dueAt is an ISO date string.
// Server-only fields (userId, eventId, notification*) are left out.
export type Reminder = {
  _id: string;
  title: string;
  notes?: string;
  dueAt: string | null;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
};

// Where the Home screen loads the list from. Needs the login token.
// GET /api/reminders replies 200 with a plain array (not wrapped in an
// object), only this user's reminders, sorted by dueAt (no-date ones first).
export const REMINDERS_PATH = '/reminders';

// An ISO date `daysFromToday` days from now at hour:minute (local time).
function dueIn(daysFromToday: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// Quick due-date choices for the Add reminder form.
// days = how many days from today, or null for no due date.
export const DUE_CHOICES = [
  { label: 'No date', days: null },
  { label: 'Today', days: 0 },
  { label: 'Tomorrow', days: 1 },
  { label: 'Next week', days: 7 },
] as const;

export type DueChoice = (typeof DUE_CHOICES)[number]['label'];

// What the Add reminder form sends to POST /api/reminders.
// title is the only required field. dueAt is an ISO date string, or null for
// no due date. The server fills in the rest (priority "medium", not completed)
// and replies 201 with the saved reminder, including its real _id.
export type NewReminder = {
  title: string;
  dueAt: string | null;
};

// The dueAt a chip stands for: noon on that day, which the web treats as
// "no time picked" (so only the date shows), or null for "No date".
export function dueAtForChoice(choice: DueChoice): string | null {
  const days = DUE_CHOICES.find((c) => c.label === choice)?.days ?? null;
  return days === null ? null : dueIn(days, 12);
}

// Builds the POST request body from the form.
export function makeNewReminder(title: string, choice: DueChoice): NewReminder {
  return { title, dueAt: dueAtForChoice(choice) };
}

// Which chip an existing reminder's due date matches, for filling the form
// when editing. null = none of them (e.g. a date set on the web with a time,
// or "Today" picked on an earlier day).
export function dueChoiceFor(dueAt: string | null): DueChoice | null {
  const match = DUE_CHOICES.find((c) => {
    if (c.days === null) return dueAt === null;
    return dueAt !== null && new Date(dueAt).getTime() === new Date(dueIn(c.days, 12)).getTime();
  });
  return match?.label ?? null;
}

// What the edit form sends to PUT /api/reminders/:id. Only the fields given
// are changed. Leave dueAt out when it didn't change: the server restarts the
// reminder's notifications whenever dueAt is sent, even with the same date.
// Replies 200 with the updated reminder.
export type ReminderUpdate = {
  title: string;
  dueAt?: string | null;
};

// Just the time of a reminder's due date ("3:30 PM"), for lists already grouped
// by day. null when there's no due date or no time was picked (noon, as on the web).
export function formatDueTime(dueAt: string | null): string | null {
  if (!dueAt) return null;
  const d = new Date(dueAt);
  if (d.getHours() === 12 && d.getMinutes() === 0) return null;
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// The date line under a reminder's title, the same way the web dashboard shows it:
// "Nov 21, 2026 • 3:30 PM". Noon means "no time picked" on the web, so it shows
// the date only. Returns null when there is no due date.
export function formatDueAt(dueAt: string | null): string | null {
  if (!dueAt) return null;
  const d = new Date(dueAt);
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const hasTime = d.getHours() !== 12 || d.getMinutes() !== 0;
  if (!hasTime) return date;
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${date} • ${time}`;
}
