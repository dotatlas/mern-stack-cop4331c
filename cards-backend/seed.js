// Creates the demo account, or resets it: deletes the demo user and their
// events and reminders, then creates them again with fresh sample data.
// Run inside the container: docker compose exec api npm run seed
const mongoose = require('mongoose');
require('dotenv').config();
const { User, Event, Reminder } = require('./models');

const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/CalendarDB';

const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'Demo123!';

// A date `days` from today at hour:minute, so the demo data is always current
function at(days, hour = 0, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function seedDB() {
  try {
    await mongoose.connect(url);

    const old = await User.findOne({ email: DEMO_EMAIL });
    if (old) {
      await Event.deleteMany({ userId: old._id });
      await Reminder.deleteMany({ userId: old._id });
      await old.deleteOne();
    }

    const user = new User({ firstName: 'Demo', lastName: 'User', email: DEMO_EMAIL, isVerified: true });
    await user.setPassword(DEMO_PASSWORD);
    await user.save();
    const userId = user._id;

    // Created one by one (not insertMany) so the encryption setters always run
    const events = await Event.create([
      { userId, title: 'COP4331 Lecture', start: at(0, 10, 30), end: at(0, 11, 45), location: 'HEC 101', color: '#007AFF' },
      { userId, title: 'Team 6 standup', start: at(1, 18), end: at(1, 18, 30), location: 'Discord', notes: 'Bring API progress', color: '#34C759' },
      { userId, title: 'Dentist', start: at(2, 9), end: at(2, 10), location: 'Main St Dental', color: '#FF9500' },
      { userId, title: 'Gym', start: at(3, 7), end: at(3, 8), color: '#FF2D55' },
      { userId, title: 'Family dinner', start: at(5, 19), end: at(5, 21), notes: 'Pick up dessert', color: '#AF52DE' },
      { userId, title: 'Spring break', start: at(14), end: at(18), allDay: true, color: '#5AC8FA' }
    ]);

    const reminders = await Reminder.create([
      { userId, title: 'Submit MERN slides', notes: 'Every member submits', dueAt: at(4, 23, 59) },
      { userId, title: 'Pay rent', dueAt: at(6, 12) },
      { userId, title: 'Email professor', notes: 'Ask about presentation slot', dueAt: at(1, 9) },
      { userId, title: 'Buy groceries', notes: 'Milk, eggs, coffee' },
      { userId, title: 'Read chapter 5', completed: true }
    ]);

    console.log(`Demo account ${DEMO_EMAIL} / ${DEMO_PASSWORD}: ${events.length} events, ${reminders.length} reminders`);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedDB();
