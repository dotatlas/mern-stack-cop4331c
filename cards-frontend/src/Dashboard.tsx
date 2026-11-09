import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  category: string;
  notes?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Date State
  const [currentDate, setCurrentDate] = useState(new Date(2026, 10, 1)); // Nov 2026
  
  // Events State
  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: 1, title: 'Team Meeting', date: '2026-11-06', category: 'Work', notes: 'Discuss Q4 roadmap' },
    { id: 2, title: 'COP 4331 Demo', date: '2026-11-07', category: 'School', notes: 'Present MERN stack deployment' },
  ]);

  // Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('General');
  const [notes, setNotes] = useState('');

  // Modal State
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Derived Date Info
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 (Sun) to 6 (Sat)
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Handlers
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;
    
    // Ensure the event date is parsed correctly relative to timezone
    const [year, month, day] = date.split('-');
    const newDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    setEvents([...events, { id: Date.now(), title, date: newDateStr, category, notes }]);
    setTitle('');
    setDate('');
    setNotes('');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const getEventsForDay = (dayNum: number) => {
    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  return (
    <div className="min-h-screen bg-[#f7f5f0] p-4 lg:p-8 font-sans text-stone-800">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-stone-200 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#8b3d4b] rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
            C
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Calendar</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white rounded-md shadow-sm border border-stone-200 p-1">
            <button onClick={prevMonth} className="px-3 py-1 hover:bg-stone-100 rounded text-stone-600 transition-colors">
              &larr;
            </button>
            <h2 className="text-lg font-medium text-stone-800 px-4 min-w-[160px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <button onClick={nextMonth} className="px-3 py-1 hover:bg-stone-100 rounded text-stone-600 transition-colors">
              &rarr;
            </button>
          </div>
          
          <button 
            onClick={handleLogout}
            className="text-sm font-medium text-stone-500 hover:text-stone-800 transition-colors px-4 py-2 border border-stone-200 rounded-md bg-white hover:bg-stone-50"
          >
            Log Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* Left Sidebar (Add Event) */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100 sticky top-8">
            <h3 className="text-lg font-semibold mb-5 text-stone-800">Add Event</h3>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Event Title</label>
                <input
                  type="text"
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:border-[#8b3d4b] focus:ring-1 focus:ring-[#8b3d4b] outline-none transition-all"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Project Review"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Date</label>
                <input
                  type="date"
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:border-[#8b3d4b] focus:ring-1 focus:ring-[#8b3d4b] outline-none transition-all"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Category</label>
                <select
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:border-[#8b3d4b] focus:ring-1 focus:ring-[#8b3d4b] outline-none transition-all"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="General">General</option>
                  <option value="School">School</option>
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Notes (Optional)</label>
                <textarea
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:border-[#8b3d4b] focus:ring-1 focus:ring-[#8b3d4b] outline-none transition-all resize-none h-20"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add details..."
                />
              </div>
              
              <button type="submit" className="w-full bg-[#8b3d4b] hover:bg-[#72323e] text-white font-medium py-3 px-4 rounded-lg transition-colors mt-2 shadow-sm">
                Create Event
              </button>
            </form>
          </div>
        </div>

        {/* Right Main Area (Calendar Grid) */}
        <div className="xl:col-span-3 bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
          
          {/* Calendar Grid Header */}
          <div className="grid grid-cols-7 border-b border-stone-100 bg-stone-50/50">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
              <div key={d} className="p-3 text-center text-xs font-semibold text-stone-500">
                <span className="hidden sm:inline">{d}</span>
                <span className="sm:hidden">{d.substring(0,3)}</span>
              </div>
            ))}
          </div>

          {/* Calendar Grid Body */}
          <div className="grid grid-cols-7 bg-stone-200 gap-px">
            {/* Empty padding days for the start of the month */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-start-${i}`} className="bg-stone-50/30 min-h-[140px] p-2"></div>
            ))}

            {/* Actual days of the month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              // Simple check for "today" - you'd normally compare to new Date()
              const isToday = currentYear === 2026 && currentMonth === 10 && day === 6; 
              
              return (
                <div key={day} className={`bg-white min-h-[140px] p-2 transition-colors group hover:bg-stone-50 ${isToday ? 'bg-orange-50/30' : ''}`}>
                  <div className="flex justify-end mb-2">
                    <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-[#8b3d4b] text-white shadow-sm' : 'text-stone-600 group-hover:text-stone-900'}`}>
                      {day}
                    </span>
                  </div>
                  <div className="space-y-1.5 flex flex-col gap-1">
                    {dayEvents.map(ev => (
                      <button 
                        key={ev.id} 
                        onClick={() => setSelectedEvent(ev)}
                        className="text-left w-full text-xs p-2 bg-stone-100 hover:bg-stone-200 border-l-[3px] border-[#8b3d4b] rounded-r text-stone-800 font-medium truncate transition-colors focus:outline-none focus:ring-1 focus:ring-[#8b3d4b]"
                      >
                        {ev.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {/* Empty padding days for the end of the month to complete the grid */}
            {Array.from({ length: (7 - ((firstDayOfMonth + daysInMonth) % 7)) % 7 }).map((_, i) => (
              <div key={`empty-end-${i}`} className="bg-stone-50/30 min-h-[140px] p-2"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Event Details Modal Overlay */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="border-b border-stone-100 p-5 flex justify-between items-center bg-stone-50">
              <h3 className="text-xl font-semibold text-stone-800">Event Details</h3>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="text-stone-400 hover:text-stone-700 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-200"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Title</div>
                <div className="text-lg text-stone-900 font-medium">{selectedEvent.title}</div>
              </div>
              
              <div className="flex gap-8">
                <div>
                  <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Date</div>
                  <div className="text-stone-800">{selectedEvent.date}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Category</div>
                  <div className="inline-block px-2.5 py-1 bg-stone-100 text-stone-700 text-xs font-medium rounded-md">
                    {selectedEvent.category}
                  </div>
                </div>
              </div>

              {selectedEvent.notes && (
                <div>
                  <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Notes</div>
                  <div className="text-stone-800 bg-stone-50 p-3 rounded-lg border border-stone-100 text-sm whitespace-pre-wrap">
                    {selectedEvent.notes}
                  </div>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-stone-100 bg-stone-50 flex justify-end">
              <button 
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-white border border-stone-200 text-stone-700 font-medium rounded-lg hover:bg-stone-50 transition-colors"
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