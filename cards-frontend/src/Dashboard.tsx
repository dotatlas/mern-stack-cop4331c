import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from './api';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  category: string;
  notes?: string;
  accent: 'blue' | 'pink' | 'green' | 'purple';
}

interface Reminder {
  id: number;
  text: string;
  date?: string;
  completed: boolean;
  accent: 'blue' | 'pink' | 'green' | 'purple';
}

const accentColors = {
  blue: '#2C3E55',
  pink: '#A85368',
  green: '#355E48',
  purple: '#5E4068',
};

function toCalendarEvent(event: any): CalendarEvent {
  const start = new Date(event.start);

  const colorToAccent: Record<string, CalendarEvent['accent']> = {
    '#2C3E55': 'blue',
    '#A85368': 'pink',
    '#355E48': 'green',
    '#5E4068': 'purple',
  };

  const date = [
    start.getFullYear(),
    String(start.getMonth() + 1).padStart(2, '0'),
    String(start.getDate()).padStart(2, '0'),
  ].join('-');

  return {
    id: event._id,
    title: event.title,
    date,
    time: event.allDay
      ? undefined
      : start.toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
        }),
    category: event.category || 'General',
    notes: event.notes || '',
    accent: colorToAccent[event.color] || 'blue',
  };
}

export default function Dashboard() {
  const navigate = useNavigate();

  // User State
  const [userName, setUserName] = useState('Natasha');
  const [userInitials, setUserInitials] = useState('N');

// Real-time dynamic date detection
  const now = new Date();
  const TODAY_YEAR = now.getFullYear();
  const TODAY_MONTH = now.getMonth(); // 0-indexed: 0 = Jan, 10 = Nov, etc.
  const TODAY_DAY = now.getDate();

  // Calendar view state defaults to the current month & year
  const [currentDate, setCurrentDate] = useState(new Date(TODAY_YEAR, TODAY_MONTH, 1));

    // Load user from localStorage
  useEffect(() => {
    const loadEvents = async () => {
      if (!localStorage.getItem('token')) {
        navigate('/');
        return;
      }

      try {
        const from = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        ).toISOString();

        const to = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0,
          23, 59, 59, 999
        ).toISOString();

        const data = await apiRequest(
          `/api/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
        );

        setEvents(data.events.map(toCalendarEvent));
      } catch (err) {
        console.error('Could not load events:', err);
      }
    };

    loadEvents();
  }, [navigate, currentDate]);

  // Events State - Muted cozy accents: dark blue, warm pink, dark green, muted purple
  /*const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: 1,
      title: "Jamie's Birthday Dinner",
      date: '2026-11-06',
      time: '7:00 PM',
      category: 'Celebration',
      notes: 'Table reserved downtown at Osteria',
      accent: 'pink',
    },
    {
      id: 2,
      title: 'Pilates Studio Session',
      date: '2026-11-07',
      time: '9:30 AM',
      category: 'Wellness',
      notes: 'Morning reformer session with warm tea',
      accent: 'green',
    },
    {
      id: 3,
      title: 'Design Critique & Review',
      date: '2026-11-09',
      time: '2:00 PM',
      category: 'Project',
      notes: 'Midterm sprint review and interface presentation',
      accent: 'blue',
    },
    {
      id: 4,
      title: 'Portfolio Submission Due',
      date: '2026-11-12',
      time: '11:59 PM',
      category: 'Project',
      notes: 'Submit portfolio case studies and prototype slides',
      accent: 'purple',
    },
    {
      id: 5,
      title: 'Evening Film & Book Club',
      date: '2026-11-20',
      time: '6:30 PM',
      category: 'Personal',
      notes: 'Discussion on classic cinema and design history',
      accent: 'blue',
    },
  ]);*/  //  mock <data value="
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  // Reminders State
  const [reminders, setReminders] = useState<Reminder[]>([
    { id: 1, text: "Buy gift for Jamie", date: 'Completed', completed: true, accent: 'pink' },
    { id: 2, text: 'Review presentation slides', date: 'Today', completed: false, accent: 'blue' },
    { id: 3, text: 'Submit Portfolio PDF to portal', date: 'Nov 12', completed: false, accent: 'purple' },
    { id: 4, text: 'Book Saturday Pilates reformer', date: 'Nov 14', completed: false, accent: 'green' },
    { id: 5, text: 'Pick up coffee beans & oat milk', date: 'Pending', completed: false, accent: 'pink' },
  ]);

  // Active form view: 'event' or 'reminder'
  const [panelTab, setPanelTab] = useState<'event' | 'reminder'>('event');

  // Form Inputs - Event
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventCategory, setEventCategory] = useState('Personal');
  const [eventNotes, setEventNotes] = useState('');
  const [eventAccent, setEventAccent] = useState<'blue' | 'pink' | 'green' | 'purple'>('blue');

  // Form Inputs - Reminder
  const [reminderText, setReminderText] = useState('');
  const [reminderDate, setReminderDate] = useState('');

  // Modal State
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Month Math
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventTitle.trim() || !eventDate) return;

    const start = eventTime.trim()
      ? new Date(`${eventDate} ${eventTime}`)
      : new Date(`${eventDate}T00:00:00`);

    if (Number.isNaN(start.getTime())) {
      alert('Please enter a valid event time.');
      return;
    }

    const allDay = !eventTime.trim();

    const end = new Date(start);

    if (allDay) {
      end.setHours(23, 59, 59, 999);
    } else {
      end.setHours(end.getHours() + 1);
    }

    const color = accentColors[eventAccent];

    try {
      const savedEvent = await apiRequest('/api/events', 'POST', {
        title: eventTitle.trim(),
        start: start.toISOString(),
        end: end.toISOString(),
        allDay,
        location: '',
        notes: eventNotes,
        category: eventCategory,
        color,
      });

      setEvents((previous) => [
        ...previous,
        toCalendarEvent(savedEvent.event),
      ]);

      setEventTitle('');
      setEventDate('');
      setEventTime('');
      setEventNotes('');
    } catch (err: any) {
      alert(err.message || 'Could not save the event.');
    }
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderText.trim()) return;
    setReminders([
      ...reminders,
      {
        id: Date.now(),
        text: reminderText.trim(),
        date: reminderDate || 'Pending',
        completed: false,
        accent: 'green',
      },
    ]);
    setReminderText('');
    setReminderDate('');
  };

  const toggleReminder = (id: number) => {
    setReminders(
      reminders.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const jumpToToday = () => setCurrentDate(new Date(TODAY_YEAR, TODAY_MONTH, 1));

  const getEventsForDay = (dayNum: number) => {
    const formatted = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
    return events.filter((e) => e.date === formatted);
  };

  // Color tokens tailored for a beige aesthetic:
  // - Dark Blue: Slate Indigo (#2C3E55)
  // - Warm Pink: Dusty Muted Rose (#A85368)
  // - Dark Green: Forest Moss (#355E48)
  // - Purple: Muted Plum / Eggplant (#5E4068)
  const getAccentStyles = (accent: string) => {
    switch (accent) {
      case 'blue':
        return {
          chip: 'bg-[#2C3E55]/12 border-l-[4px] border-[#2C3E55] text-[#1E2E40] hover:bg-[#2C3E55]/20',
          dot: 'bg-[#2C3E55]',
          badge: 'bg-[#2C3E55]/15 text-[#1E2E40] border border-[#2C3E55]/30',
          checkbox: 'text-[#2C3E55] border-[#2C3E55]/50 focus:ring-[#2C3E55]',
          swatch: 'bg-[#2C3E55]',
        };
      case 'pink':
        return {
          chip: 'bg-[#A85368]/12 border-l-[4px] border-[#A85368] text-[#632736] hover:bg-[#A85368]/20',
          dot: 'bg-[#A85368]',
          badge: 'bg-[#A85368]/15 text-[#632736] border border-[#A85368]/30',
          checkbox: 'text-[#A85368] border-[#A85368]/50 focus:ring-[#A85368]',
          swatch: 'bg-[#A85368]',
        };
      case 'purple':
        return {
          chip: 'bg-[#5E4068]/12 border-l-[4px] border-[#5E4068] text-[#3E2546] hover:bg-[#5E4068]/20',
          dot: 'bg-[#5E4068]',
          badge: 'bg-[#5E4068]/15 text-[#3E2546] border border-[#5E4068]/30',
          checkbox: 'text-[#5E4068] border-[#5E4068]/50 focus:ring-[#5E4068]',
          swatch: 'bg-[#5E4068]',
        };
      case 'green':
      default:
        return {
          chip: 'bg-[#355E48]/12 border-l-[4px] border-[#355E48] text-[#1E3E2D] hover:bg-[#355E48]/20',
          dot: 'bg-[#355E48]',
          badge: 'bg-[#355E48]/15 text-[#1E3E2D] border border-[#355E48]/30',
          checkbox: 'text-[#355E48] border-[#355E48]/50 focus:ring-[#355E48]',
          swatch: 'bg-[#355E48]',
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#F4EDE4] text-[#2C211B] flex flex-col font-sans antialiased selection:bg-[#355E48]/20 selection:text-[#2C211B]">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION / PROFILE BAR
         ───────────────────────────────────────────────────────────── */}
      <header className="bg-[#FAF5EE] border-b-2 border-[#DFD3C3] px-8 py-5 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#4E2E1E] text-[#FAF5EE] rounded-2xl flex items-center justify-center font-serif font-black text-2xl shadow-sm ring-4 ring-[#4E2E1E]/10">
            C
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-serif font-black tracking-tight text-[#2C211B] leading-none">
                Calendar
              </span>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#355E48]"></span>
            </div>
            <span className="text-xs font-sans font-bold uppercase tracking-widest text-[#7B6A5E] mt-1 block">
              Workspace & Schedule
            </span>
          </div>
        </div>

        {/* User / Profile Section - Bolder & Pushed to Far Right */}
        <div className="flex items-center gap-6 ml-auto">
          <div className="text-right">
            <div className="text-base sm:text-lg font-sans font-semibold text-[#6C5B4F] leading-tight">
              Welcome back,{' '}
              <span className="font-serif font-black text-[#4E2E1E] text-xl sm:text-2xl tracking-tight">
                {userName}
              </span>
            </div>
            <div className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#355E48] flex items-center justify-end gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-[#355E48]"></span>
              Active Account
            </div>
          </div>

          {/* User Avatar Badge */}
          <div className="w-12 h-12 rounded-2xl bg-[#ECE1D2] border-2 border-[#CFBEAA] text-[#4E2E1E] flex items-center justify-center font-serif font-black text-lg shadow-2xs">
            {userInitials}
          </div>

          {/* Log Out Button */}
          <button
            onClick={handleLogout}
            className="text-xs font-sans font-bold uppercase tracking-wider text-[#6C5B4F] hover:text-[#2C211B] border-2 border-[#CFBEAA] hover:border-[#7B6A5E] rounded-full px-5 py-2.5 bg-[#FAF5EE] transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN TWO-COLUMN DASHBOARD LAYOUT
         ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-[1600px] mx-auto w-full">
        {/* ─── LEFT COLUMN: Panels for Adding Events & Reminders (4 cols) ─── */}
        <aside className="lg:col-span-4 space-y-7">
          {/* Action Card: Tabbed Creation Panel */}
          <div className="bg-[#FAF5EE] rounded-3xl border-2 border-[#DFD3C3] p-7 shadow-sm">
            {/* Tab Selector */}
            <div className="flex border-b-2 border-[#DFD3C3] mb-6">
              <button
                type="button"
                onClick={() => setPanelTab('event')}
                className={`flex-1 pb-3.5 text-sm font-sans font-extrabold uppercase tracking-wider border-b-[3px] transition-all cursor-pointer ${
                  panelTab === 'event'
                    ? 'border-[#4E2E1E] text-[#4E2E1E]'
                    : 'border-transparent text-[#9C8A7C] hover:text-[#4E2E1E]'
                }`}
              >
                + New Event
              </button>
              <button
                type="button"
                onClick={() => setPanelTab('reminder')}
                className={`flex-1 pb-3.5 text-sm font-sans font-extrabold uppercase tracking-wider border-b-[3px] transition-all cursor-pointer ${
                  panelTab === 'reminder'
                    ? 'border-[#355E48] text-[#355E48]'
                    : 'border-transparent text-[#9C8A7C] hover:text-[#355E48]'
                }`}
              >
                + Reminder
              </button>
            </div>

            {/* Sub-form: Add Event */}
            {panelTab === 'event' && (
              <form onSubmit={handleAddEvent} className="space-y-4">
                <div>
                  <label className="block text-xs font-sans font-bold uppercase tracking-wider text-[#6C5B4F] mb-1.5">
                    Event Title
                  </label>
                  <input
                    type="text"
                    className="w-full bg-[#FFFFFF] border-2 border-[#CFBEAA] rounded-2xl p-3 text-sm font-semibold text-[#2C211B] placeholder-[#AFA193] focus:border-[#4E2E1E] focus:ring-0 outline-none transition"
                    placeholder="e.g. Design Critique or Pilates Studio"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-sans font-bold uppercase tracking-wider text-[#6C5B4F] mb-1.5">
                      Date
                    </label>
                    <input
                      type="date"
                      className="w-full bg-[#FFFFFF] border-2 border-[#CFBEAA] rounded-2xl p-3 text-sm font-semibold text-[#2C211B] focus:border-[#4E2E1E] focus:ring-0 outline-none transition"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-sans font-bold uppercase tracking-wider text-[#6C5B4F] mb-1.5">
                      Time (Optional)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-[#FFFFFF] border-2 border-[#CFBEAA] rounded-2xl p-3 text-sm font-semibold text-[#2C211B] placeholder-[#AFA193] focus:border-[#4E2E1E] focus:ring-0 outline-none transition"
                      placeholder="e.g. 2:00 PM"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-sans font-bold uppercase tracking-wider text-[#6C5B4F] mb-1.5">
                      Category
                    </label>
                    <select
                      className="w-full bg-[#FFFFFF] border-2 border-[#CFBEAA] rounded-2xl p-3 text-sm font-bold text-[#2C211B] focus:border-[#4E2E1E] focus:ring-0 outline-none transition"
                      value={eventCategory}
                      onChange={(e) => setEventCategory(e.target.value)}
                    >
                      <option value="Personal">Personal</option>
                      <option value="Wellness">Wellness</option>
                      <option value="Celebration">Celebration</option>
                      <option value="Project">Project</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-sans font-bold uppercase tracking-wider text-[#6C5B4F] mb-1.5">
                      Accent Color
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {[
                        { key: 'blue', label: 'Dark Blue', color: 'bg-[#2C3E55]' },
                        { key: 'pink', label: 'Warm Pink', color: 'bg-[#A85368]' },
                        { key: 'green', label: 'Dark Green', color: 'bg-[#355E48]' },
                        { key: 'purple', label: 'Muted Purple', color: 'bg-[#5E4068]' },
                      ].map((th) => (
                        <button
                          key={th.key}
                          type="button"
                          onClick={() => setEventAccent(th.key as any)}
                          className={`h-9 rounded-xl flex items-center justify-center border-2 transition ${
                            eventAccent === th.key
                              ? 'border-[#2C211B] scale-105 shadow-sm'
                              : 'border-transparent opacity-65 hover:opacity-100'
                          } ${th.color}`}
                          title={th.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-sans font-bold uppercase tracking-wider text-[#6C5B4F] mb-1.5">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    className="w-full bg-[#FFFFFF] border-2 border-[#CFBEAA] rounded-2xl p-3 text-sm font-medium text-[#2C211B] placeholder-[#AFA193] focus:border-[#4E2E1E] focus:ring-0 outline-none transition resize-none"
                    placeholder="Location, agenda, or details..."
                    value={eventNotes}
                    onChange={(e) => setEventNotes(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#4E2E1E] hover:bg-[#3D2214] text-[#FAF5EE] font-sans font-bold py-3.5 rounded-2xl text-sm uppercase tracking-wider shadow-sm transition active:scale-[0.98] cursor-pointer"
                >
                  Create Event
                </button>
              </form>
            )}

            {/* Sub-form: Add Reminder */}
            {panelTab === 'reminder' && (
              <form onSubmit={handleAddReminder} className="space-y-4">
                <div>
                  <label className="block text-xs font-sans font-bold uppercase tracking-wider text-[#6C5B4F] mb-1.5">
                    Reminder Note
                  </label>
                  <input
                    type="text"
                    className="w-full bg-[#FFFFFF] border-2 border-[#CFBEAA] rounded-2xl p-3 text-sm font-semibold text-[#2C211B] placeholder-[#AFA193] focus:border-[#355E48] focus:ring-0 outline-none transition"
                    placeholder="e.g. Submit Portfolio PDF or Pick up supplies"
                    value={reminderText}
                    onChange={(e) => setReminderText(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans font-bold uppercase tracking-wider text-[#6C5B4F] mb-1.5">
                    Due Tag / Date
                  </label>
                  <input
                    type="text"
                    className="w-full bg-[#FFFFFF] border-2 border-[#CFBEAA] rounded-2xl p-3 text-sm font-semibold text-[#2C211B] placeholder-[#AFA193] focus:border-[#355E48] focus:ring-0 outline-none transition"
                    placeholder="e.g. Today, Nov 12, or Friday"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#355E48] hover:bg-[#284936] text-[#FAF5EE] font-sans font-bold py-3.5 rounded-full text-sm uppercase tracking-wider shadow-sm transition active:scale-[0.98] cursor-pointer"
                >
                  Save Reminder
                </button>
              </form>
            )}
          </div>

          {/* Reminders / To-Do Checklist Panel */}
          <div className="bg-[#FAF5EE] rounded-3xl border-2 border-[#DFD3C3] p-7 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl font-serif font-bold text-[#2C211B]">Reminders</h3>
                <span className="w-2 h-2 rounded-full bg-[#355E48]"></span>
              </div>
              <span className="text-xs bg-[#355E48]/15 text-[#1E3E2D] border border-[#355E48]/30 px-3 py-1 rounded-full font-sans font-bold uppercase tracking-wider">
                {reminders.filter((r) => !r.completed).length} pending
              </span>
            </div>

            <div className="space-y-3">
              {reminders.map((r) => {
                const styles = getAccentStyles(r.accent);
                return (
                  <div
                    key={r.id}
                    onClick={() => toggleReminder(r.id)}
                    className={`flex items-start gap-3.5 p-3.5 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                      r.completed
                        ? 'bg-[#ECE1D2]/50 border-[#CFBEAA]/60 opacity-60'
                        : 'bg-[#FFFFFF] border-[#DFD3C3] hover:border-[#CFBEAA] shadow-2xs'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={r.completed}
                      onChange={() => {}}
                      className={`mt-1 h-4 w-4 rounded border-2 bg-transparent cursor-pointer ${styles.checkbox}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm font-sans font-bold ${
                          r.completed ? 'line-through text-[#9C8A7C]' : 'text-[#2C211B]'
                        }`}
                      >
                        {r.text}
                      </div>
                      {r.date && (
                        <div className="text-xs font-sans font-semibold text-[#7B6A5E] mt-0.5 flex items-center gap-1.5">
                          <span className={`inline-block w-2 h-2 rounded-full ${styles.dot}`}></span>
                          {r.date}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ─── RIGHT COLUMN: The Calendar Grid (8 cols) - Elevated with Border & Depth ─── */}
        <section className="lg:col-span-8 bg-[#FAF5EE] rounded-3xl border-2 border-[#D5C6B3] shadow-md overflow-hidden flex flex-col">
          {/* Calendar Header with Controls */}
          <div className="p-7 border-b-2 border-[#D5C6B3] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#F2E8DC]">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-[#2C211B]">
                  {monthNames[currentMonth]} {currentYear}
                </h2>
                <span className="px-3 py-1 rounded-full text-[11px] font-sans font-black uppercase tracking-wider bg-[#355E48]/15 text-[#1E3E2D] border border-[#355E48]/30">
                  Monthly Schedule
                </span>
              </div>
              <p className="text-xs font-sans font-bold uppercase tracking-wider text-[#7B6A5E] mt-1.5">
                {events.length} events scheduled
              </p>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-[#FFFFFF] border-2 border-[#CFBEAA] rounded-full p-1 shadow-xs">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="w-8 h-8 flex items-center justify-center hover:bg-[#ECE1D2] text-[#6C5B4F] hover:text-[#2C211B] font-black text-base rounded-full transition cursor-pointer"
                  title="Previous Month"
                >
                  &larr;
                </button>
                <button
                  type="button"
                  onClick={jumpToToday}
                  className="px-4 py-1 text-xs font-sans font-black uppercase tracking-wider text-[#2C211B] hover:bg-[#4E2E1E] hover:text-[#FAF5EE] rounded-full transition cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="w-8 h-8 flex items-center justify-center hover:bg-[#ECE1D2] text-[#6C5B4F] hover:text-[#2C211B] font-black text-base rounded-full transition cursor-pointer"
                  title="Next Month"
                >
                  &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b-2 border-[#D5C6B3] bg-[#EAE0D1] text-center">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
              <div key={day} className="py-3 text-[11px] font-sans font-black text-[#5C4A3E] uppercase tracking-wider">
                <span className="hidden md:inline">{day}</span>
                <span className="md:hidden">{day.slice(0, 3)}</span>
              </div>
            ))}
          </div>

          {/* The Calendar Grid with Stronger 2px Grid Lines */}
          <div className="grid grid-cols-7 bg-[#D5C6B3] gap-[2px]">
            {/* Start padding days */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-pre-${i}`} className="bg-[#FAF5EE]/60 min-h-[145px] p-2.5 opacity-40" />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              // November 9, 2026 is Today
              const isToday = currentYear === TODAY_YEAR && currentMonth === TODAY_MONTH && day === TODAY_DAY;

              return (
                <div
                  key={day}
                  className={`bg-[#FFFFFF] min-h-[145px] p-2.5 flex flex-col justify-between transition hover:bg-[#FAF5EE] ${
                    isToday ? 'bg-[#FDF9F2] ring-2 ring-[#4E2E1E]/40 shadow-inner' : ''
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    {isToday ? (
                      <span className="text-[10px] font-sans font-black uppercase tracking-wider text-[#4E2E1E] bg-[#4E2E1E]/10 px-1.5 py-0.5 rounded-md">
                        Today
                      </span>
                    ) : (
                      <span></span>
                    )}
                    <span
                      className={`text-xs font-sans font-black w-7 h-7 flex items-center justify-center rounded-full transition ${
                        isToday
                          ? 'bg-[#4E2E1E] text-[#FAF5EE] shadow-sm ring-2 ring-[#4E2E1E]/20'
                          : 'text-[#6C5B4F]'
                      }`}
                    >
                      {day}
                    </span>
                  </div>

                  {/* Events list within day cell */}
                  <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[95px]">
                    {dayEvents.map((ev) => {
                      const styles = getAccentStyles(ev.accent);
                      return (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => setSelectedEvent(ev)}
                          className={`w-full text-left p-2 rounded-xl text-xs font-sans font-bold truncate block shadow-xs transition cursor-pointer ${styles.chip}`}
                        >
                          {ev.time && (
                            <span className="font-semibold opacity-75 mr-1.5">{ev.time}</span>
                          )}
                          {ev.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* End padding days */}
            {Array.from({ length: (7 - ((firstDayOfMonth + daysInMonth) % 7)) % 7 }).map((_, i) => (
              <div key={`empty-post-${i}`} className="bg-[#FAF5EE]/60 min-h-[145px] p-2.5 opacity-40" />
            ))}
          </div>
        </section>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          3. EVENT DETAILS MODAL
         ───────────────────────────────────────────────────────────── */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-[#2C211B]/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-[#FAF5EE] rounded-3xl shadow-2xl max-w-lg w-full border-2 border-[#CFBEAA] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b-2 border-[#DFD3C3] bg-[#F2E8DC] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-3 h-3 rounded-full ${getAccentStyles(selectedEvent.accent).dot}`}
                ></span>
                <h4 className="text-xl font-serif font-black text-[#2C211B]">Event Details</h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="text-[#7B6A5E] hover:text-[#2C211B] w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#ECE1D2] text-xl font-black transition cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="p-7 space-y-5">
              <div>
                <span className="text-xs uppercase font-sans font-black tracking-wider text-[#9C8A7C] block mb-1">Title</span>
                <div className="text-2xl font-serif font-black text-[#2C211B]">{selectedEvent.title}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs uppercase font-sans font-black tracking-wider text-[#9C8A7C] block mb-1">Date & Time</span>
                  <div className="text-sm font-sans font-black text-[#4E2E1E]">
                    {selectedEvent.date} {selectedEvent.time ? `• ${selectedEvent.time}` : ''}
                  </div>
                </div>
                <div>
                  <span className="text-xs uppercase font-sans font-black tracking-wider text-[#9C8A7C] block mb-1">Category</span>
                  <span
                    className={`inline-block px-3.5 py-1 rounded-full text-xs font-sans font-black uppercase tracking-wider ${
                      getAccentStyles(selectedEvent.accent).badge
                    }`}
                  >
                    {selectedEvent.category}
                  </span>
                </div>
              </div>
              {selectedEvent.notes && (
                <div>
                  <span className="text-xs uppercase font-sans font-black tracking-wider text-[#9C8A7C] block mb-1">Notes</span>
                  <div className="p-4 bg-[#FFFFFF] rounded-2xl text-sm font-sans font-medium text-[#46382F] border-2 border-[#DFD3C3] whitespace-pre-wrap leading-relaxed">
                    {selectedEvent.notes}
                  </div>
                </div>
              )}
            </div>
            <div className="p-5 border-t-2 border-[#DFD3C3] bg-[#F2E8DC] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-6 py-2 bg-[#FAF5EE] border-2 border-[#CFBEAA] hover:bg-[#ECE1D2] text-[#4E2E1E] font-sans font-black text-xs uppercase tracking-wider rounded-full transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}