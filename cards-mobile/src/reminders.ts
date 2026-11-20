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

// An ISO date `daysFromToday` days from now at hour:minute (local time).
// Keeps the sample dates near today instead of going stale.
function dueIn(daysFromToday: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// Local sample data until the live server has /reminders.
// Later this gets replaced by: await apiRequest<Reminder[]>('/reminders')
export function getSampleReminders(): Reminder[] {
  return [
    {
      _id: 'sample-1',
      title: 'Submit COP4331 project milestone',
      notes: 'Upload the mobile build and the API docs',
      dueAt: dueIn(1, 23, 59),
      priority: 'high',
      completed: false,
    },
    {
      _id: 'sample-2',
      title: 'Team meeting prep',
      notes: 'Bring the register screen demo',
      dueAt: dueIn(0, 15, 30),
      priority: 'medium',
      completed: true,
    },
    {
      _id: 'sample-3',
      title: 'Pick up groceries',
      dueAt: dueIn(2, 12), // noon = "no time picked", so only the date shows
      priority: 'low',
      completed: false,
    },
    {
      _id: 'sample-4',
      title: 'Renew library books',
      dueAt: dueIn(4, 10),
      priority: 'medium',
      completed: false,
    },
    {
      _id: 'sample-5',
      title: 'Call the dentist',
      notes: 'Reschedule the cleaning',
      dueAt: null,
      priority: 'low',
      completed: true,
    },
  ];
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

// Builds a new, not-yet-done reminder from the form.
// The due time is noon, which the web treats as "no time picked", so only
// the date shows. The _id is temporary; the server will make real ones later.
export function makeReminder(title: string, choice: DueChoice): Reminder {
  const days = DUE_CHOICES.find((c) => c.label === choice)?.days ?? null;
  return {
    _id: `local-${Date.now()}`,
    title,
    dueAt: days === null ? null : dueIn(days, 12),
    priority: 'medium', // the backend's default
    completed: false,
  };
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
