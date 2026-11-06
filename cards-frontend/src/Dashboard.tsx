import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  category: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: 1, title: 'Team Meeting', date: '2026-11-06', category: 'Work' },
    { id: 2, title: 'COP 4331 Demo', date: '2026-11-07', category: 'School' },
  ]);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('General');
  const [sortAsc, setSortAsc] = useState(true);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;
    const newEvent: CalendarEvent = {
      id: Date.now(),
      title,
      date,
      category,
    };
    setEvents([...events, newEvent]);
    setTitle('');
    setDate('');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const sortedEvents = [...events].sort((a, b) => {
    return sortAsc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
  });

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <h2>Calendar Dashboard</h2>
        <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
          Log Out
        </button>
      </div>

      <div className="row g-4">
        <div className="col-md-4">
          <div className="card p-3 shadow-sm">
            <h5>Add New Event</h5>
            <form onSubmit={handleAddEvent}>
              <div className="mb-2">
                <label className="form-label small">Event Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="mb-2">
                <label className="form-label small">Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label small">Category</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="General">General</option>
                  <option value="School">School</option>
                  <option value="Work">Work</option>
                </select>
              </div>
              <button type="submit" className="btn btn-success w-100">
                Add Event
              </button>
            </form>
          </div>
        </div>

        <div className="col-md-8">
          <div className="card p-3 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Upcoming Schedule</h5>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => setSortAsc(!sortAsc)}
              >
                Sort by Date ({sortAsc ? 'Ascending' : 'Descending'})
              </button>
            </div>

            <table className="table table-striped align-middle">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {sortedEvents.map((ev) => (
                  <tr key={ev.id}>
                    <td>{ev.title}</td>
                    <td>{ev.date}</td>
                    <td>
                      <span className="badge bg-secondary">{ev.category}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}