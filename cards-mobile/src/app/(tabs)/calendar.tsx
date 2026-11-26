import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiRequest } from '@/api';
import {
  buildMonthGrid,
  dayKey,
  eventAccent,
  eventsByDay,
  EVENTS_PATH,
  formatDayTitle,
  formatEventTime,
  monthGridRange,
  MONTH_NAMES,
  WEEKDAYS,
  type CalendarEvent,
  type EventsResponse,
} from '@/calendar';
import { formatDueTime, REMINDERS_PATH, type Reminder } from '@/reminders';
import { colors, fonts } from '@/theme';

// How many event labels fit in one day box; the rest become "+N"
const MAX_LABELS = 2;

// The Calendar tab: a month grid styled like the web dashboard's, showing the
// user's events (read-only). Like the web, reminders aren't drawn on the grid,
// but the panel under it lists the tapped day's events and reminders.
export default function CalendarScreen() {
  const now = new Date();
  const todayKey = dayKey(now);

  // Which month is on screen (month is 0–11). Starts on this month.
  const [shown, setShown] = useState({ year: now.getFullYear(), month: now.getMonth() });
  // The tapped day, as "YYYY-MM-DD". Starts on today.
  const [selectedKey, setSelectedKey] = useState(todayKey);

  const weeks = buildMonthGrid(shown.year, shown.month);
  const range = monthGridRange(shown.year, shown.month);

  // Events and reminders for the visible grid, loaded from the server
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false); // small spinner by the month title
  const [refreshing, setRefreshing] = useState(false); // pull-to-refresh spinner
  const [loadError, setLoadError] = useState<string | null>(null);
  // Counts loads so only the newest answer is used (e.g. tapping › quickly)
  const loadId = useRef(0);

  const byDay = eventsByDay(events, range);

  // The selected day's events (earliest first) and reminders, for the panel
  const dayEvents = [...(byDay[selectedKey] ?? [])].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );
  const dayReminders = reminders.filter(
    (r) => r.dueAt !== null && dayKey(new Date(r.dueAt)) === selectedKey,
  );

  // Ask the server for every event and reminder in the visible grid, dimmed
  // neighbor days included. apiRequest sends the login token.
  const loadEvents = useCallback(async (year: number, month: number) => {
    const id = ++loadId.current;
    const { from, to } = monthGridRange(year, month);
    setLoading(true);
    setLoadError(null);
    try {
      const query = `?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`;
      // Both at once. /reminders takes the same from/to (due dates in that
      // span) and, unlike /events, replies with a plain array.
      const [eventData, reminderData] = await Promise.all([
        apiRequest<EventsResponse>(EVENTS_PATH + query),
        apiRequest<Reminder[]>(REMINDERS_PATH + query),
      ]);
      if (id === loadId.current) {
        setEvents(eventData.events);
        setReminders(reminderData);
      }
    } catch (e) {
      // Keep the events already showing and explain what went wrong
      if (id === loadId.current) setLoadError(e instanceof Error ? e.message : String(e));
    } finally {
      if (id === loadId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Runs when the tab comes into view (so changes made in the Reminders tab or
  // on the website show up), and again whenever the shown month changes.
  useFocusEffect(
    useCallback(() => {
      loadEvents(shown.year, shown.month);
    }, [loadEvents, shown.year, shown.month]),
  );

  // Pull down on the screen to reload
  function handleRefresh() {
    setRefreshing(true);
    loadEvents(shown.year, shown.month);
  }

  // Show a month and select a day in it, so the panel always has data:
  // today if it's this month, otherwise the 1st.
  function showMonth(year: number, month: number) {
    const today = new Date();
    const isThisMonth = year === today.getFullYear() && month === today.getMonth();
    setShown({ year, month });
    setSelectedKey(dayKey(isThisMonth ? today : new Date(year, month, 1)));
  }

  // Move by -1 / +1 month. new Date() handles going past January or December.
  function changeMonth(by: number) {
    const d = new Date(shown.year, shown.month + by, 1);
    showMonth(d.getFullYear(), d.getMonth());
  }

  function goToToday() {
    const d = new Date();
    showMonth(d.getFullYear(), d.getMonth());
  }

  return (
    // No bottom edge: the tab bar already keeps clear of the home indicator
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.espresso} // iOS spinner color
            colors={[colors.espresso]} // Android spinner color
          />
        }
      >
        <View style={styles.panel}>
          {/* Month title + ‹ Today › (web: the bar above the grid) */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.monthTitle} accessibilityRole="header">
                {MONTH_NAMES[shown.month]} {shown.year}
              </Text>
              {/* Small spinner while events load (hidden during pull-to-refresh,
                  which shows its own) */}
              {loading && !refreshing && (
                <ActivityIndicator size="small" color={colors.brown} style={styles.titleSpinner} />
              )}
            </View>

            <View style={styles.navPill}>
              <Pressable
                onPress={() => changeMonth(-1)}
                accessibilityRole="button"
                accessibilityLabel="Previous month"
                style={({ pressed }) => [styles.arrowButton, pressed && styles.arrowButtonPressed]}
              >
                {({ pressed }) => (
                  <Text style={[styles.arrowText, pressed && styles.arrowTextPressed]}>‹</Text>
                )}
              </Pressable>
              <Pressable
                onPress={goToToday}
                accessibilityRole="button"
                style={({ pressed }) => [styles.todayButton, pressed && styles.todayButtonPressed]}
              >
                {({ pressed }) => (
                  <Text style={[styles.todayText, pressed && styles.todayTextPressed]}>Today</Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => changeMonth(1)}
                accessibilityRole="button"
                accessibilityLabel="Next month"
                style={({ pressed }) => [styles.arrowButton, pressed && styles.arrowButtonPressed]}
              >
                {({ pressed }) => (
                  <Text style={[styles.arrowText, pressed && styles.arrowTextPressed]}>›</Text>
                )}
              </Pressable>
            </View>

            {loadError && <Text style={styles.error}>{loadError}</Text>}
          </View>

          {/* Sun–Sat */}
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((name) => (
              <Text key={name} style={styles.weekday}>
                {name}
              </Text>
            ))}
          </View>

          {/* The grid. The tan background shows through the 2px gaps as lines. */}
          <View style={styles.grid}>
            {weeks.map((week) => (
              <View key={week[0].key} style={styles.week}>
                {week.map((cell) => {
                  const isToday = cell.key === todayKey;
                  const isSelected = cell.key === selectedKey;
                  const cellEvents = byDay[cell.key] ?? [];
                  const extra = cellEvents.length - MAX_LABELS;
                  return (
                    <Pressable
                      key={cell.key}
                      onPress={() => setSelectedKey(cell.key)}
                      accessibilityRole="button"
                      accessibilityLabel={
                        cellEvents.length
                          ? `${cell.key}, ${cellEvents.length} event${cellEvents.length === 1 ? '' : 's'}: ${cellEvents.map((ev) => ev.title).join(', ')}`
                          : cell.key
                      }
                      accessibilityState={{ selected: isSelected }}
                      style={({ pressed }) => [
                        styles.cell,
                        !cell.inMonth && styles.cellOutside,
                        isToday && styles.cellToday,
                        pressed && styles.cellPressed,
                        isSelected && styles.cellSelected,
                      ]}
                    >
                      <View style={[styles.dayNumber, isToday && styles.dayNumberToday]}>
                        <Text
                          style={[
                            styles.dayText,
                            isToday && styles.dayTextToday,
                            !cell.inMonth && styles.dayTextOutside,
                          ]}
                        >
                          {cell.day}
                        </Text>
                      </View>

                      {/* Short labels in each event's color, like the web's chips
                          (light tint, colored bar on the left) */}
                      {cellEvents.length > 0 && (
                        <View style={[styles.labels, !cell.inMonth && styles.labelsOutside]}>
                          {cellEvents.slice(0, MAX_LABELS).map((ev) => {
                            const accent = eventAccent(ev.color);
                            return (
                              <View
                                key={ev._id}
                                style={[
                                  styles.label,
                                  { backgroundColor: accent.tint, borderLeftColor: accent.main },
                                ]}
                              >
                                <Text
                                  style={[styles.labelText, { color: accent.text }]}
                                  numberOfLines={1}
                                >
                                  {ev.title}
                                </Text>
                              </View>
                            );
                          })}
                          {extra > 0 && <Text style={styles.moreText}>+{extra}</Text>}
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* The selected day's details, styled like the Reminders panel */}
        <View style={styles.dayPanel}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayTitle} accessibilityRole="header">
              {formatDayTitle(selectedKey)}
            </Text>
            {/* Opens the event form for this day. Coming back here reloads
                the calendar, so the new event shows up. */}
            <Pressable
              onPress={() => router.push({ pathname: '/event-form', params: { date: selectedKey } })}
              accessibilityRole="button"
              accessibilityLabel={`Add event on ${formatDayTitle(selectedKey)}`}
              style={({ pressed }) => [styles.addEventButton, pressed && styles.addEventButtonPressed]}
            >
              <Text style={styles.addEventText}>+ Add event</Text>
            </Pressable>
          </View>

          {/* Events: white cards with the event's color bar, like the grid labels */}
          <Text style={styles.sectionLabel}>Events</Text>
          {dayEvents.length === 0 ? (
            <Text style={styles.empty}>No events this day</Text>
          ) : (
            <View style={styles.cards}>
              {dayEvents.map((ev) => {
                const accent = eventAccent(ev.color);
                return (
                  // Tap to edit. Coming back here reloads, so changes show up.
                  <Pressable
                    key={ev._id}
                    onPress={() => router.push({ pathname: '/event-form', params: { id: ev._id } })}
                    accessibilityRole="button"
                    accessibilityLabel={`${ev.title}, ${formatEventTime(ev)}${ev.location ? `, ${ev.location}` : ''}. Edit`}
                    style={({ pressed }) => [
                      styles.eventCard,
                      { borderLeftColor: accent.main },
                      pressed && styles.eventCardPressed,
                    ]}
                  >
                    <Text style={[styles.eventTime, { color: accent.text }]}>
                      {formatEventTime(ev)}
                    </Text>
                    <Text style={styles.cardTitle}>{ev.title}</Text>
                    {ev.location.trim() !== '' && (
                      <Text style={styles.eventLocation}>{ev.location}</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Reminders due this day (section hidden when there are none).
              Read-only here; check off in the Reminders tab. */}
          {dayReminders.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Reminders</Text>
              <View style={styles.cards}>
                {dayReminders.map((r) => {
                  // Same colors as the Reminders tab: green while pending, pink once done
                  const accent = r.completed ? colors.pink : colors.green;
                  const dueTime = formatDueTime(r.dueAt);
                  return (
                    <View
                      key={r._id}
                      style={[styles.reminderCard, r.completed && styles.reminderCardDone]}
                      accessible
                      accessibilityLabel={`${r.title}${dueTime ? `, ${dueTime}` : ''}, ${r.completed ? 'done' : 'not done'}`}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          { borderColor: accent },
                          r.completed && { backgroundColor: accent },
                        ]}
                      >
                        {r.completed && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <View style={styles.reminderBody}>
                        <Text style={[styles.cardTitle, r.completed && styles.cardTitleDone]}>
                          {r.title}
                        </Text>
                        {dueTime && <Text style={styles.reminderTime}>{dueTime}</Text>}
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Colors follow the web dashboard's calendar (see the comments in theme.ts)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.page,
  },
  content: {
    padding: 16,
    alignItems: 'center',
  },

  // Panel (web: bg-[#FAF5EE] rounded-3xl border-2 border-[#D5C6B3] overflow-hidden)
  panel: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.cream,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.calBorder,
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },

  // Header bar (web: p-7 bg-[#F2E8DC] border-b-2; stacks on small screens)
  header: {
    alignItems: 'center',
    gap: 12,
    padding: 20,
    backgroundColor: colors.calHeader,
    borderBottomWidth: 2,
    borderBottomColor: colors.calBorder,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Absolutely placed so the title stays centered whether or not it shows
  titleSpinner: {
    position: 'absolute',
    right: -28,
  },
  error: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
  },
  monthTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 26,
    letterSpacing: -0.5,
    color: colors.brownDark,
  },
  // ‹ Today › (web: white rounded-full border-2 border-[#CFBEAA] p-1)
  navPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.tan,
    borderRadius: 999,
    padding: 4,
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowButtonPressed: {
    backgroundColor: colors.sand,
  },
  arrowText: {
    fontFamily: fonts.bodyBold,
    fontSize: 22,
    lineHeight: 26,
    color: colors.brown,
  },
  arrowTextPressed: {
    color: colors.brownDark,
  },
  todayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  todayButtonPressed: {
    backgroundColor: colors.espresso,
  },
  todayText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.brownDark,
  },
  todayTextPressed: {
    color: colors.cream,
  },

  // Sun–Sat (web: bg-[#EAE0D1] border-b-2 py-3 text-[11px] font-black uppercase)
  weekdayRow: {
    flexDirection: 'row',
    backgroundColor: colors.weekdayBg,
    borderBottomWidth: 2,
    borderBottomColor: colors.calBorder,
  },
  weekday: {
    flex: 1,
    paddingVertical: 12,
    textAlign: 'center',
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.weekdayText,
  },

  // Grid (web: bg-[#D5C6B3] gap-[2px])
  grid: {
    gap: 2,
    backgroundColor: colors.calBorder,
  },
  week: {
    flexDirection: 'row',
    gap: 2,
  },
  // One day (web: white, number in the top-right corner)
  cell: {
    flex: 1,
    minHeight: 60,
    padding: 3,
    alignItems: 'flex-end',
    backgroundColor: colors.white,
    // Always 2px so today/selected outlines don't shift the number
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cellOutside: {
    backgroundColor: colors.outsideBg,
  },
  cellToday: {
    backgroundColor: colors.todayBg,
    borderColor: colors.espressoRing,
  },
  cellPressed: {
    backgroundColor: colors.cream, // web hover:bg-[#FAF5EE]
  },
  cellSelected: {
    borderColor: colors.green,
  },
  // Number circle (web: w-7 h-7 rounded-full text-xs font-black)
  dayNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberToday: {
    backgroundColor: colors.espresso,
  },
  dayText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.brown,
  },
  dayTextToday: {
    color: colors.cream,
  },
  dayTextOutside: {
    opacity: 0.4, // web: opacity-40 on the cells outside the month
  },

  // Event labels (web chip: bg-[accent]/12 border-l-[4px] border-[accent]
  // rounded-xl text-xs font-bold, shrunk to fit a phone-width day box)
  labels: {
    alignSelf: 'stretch', // full box width (the cell lines its number up on the right)
    gap: 2,
    marginTop: 2,
  },
  labelsOutside: {
    opacity: 0.4,
  },
  label: {
    borderLeftWidth: 3,
    borderRadius: 4,
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
  labelText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
  },
  moreText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: colors.tanDark,
    paddingLeft: 2,
  },

  // Day panel (same look as the Reminders tab's panel)
  dayPanel: {
    width: '100%',
    maxWidth: 520,
    marginTop: 16,
    backgroundColor: colors.cream,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.panelBorder,
    padding: 20,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  dayTitle: {
    flexShrink: 1,
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.brownDark,
  },
  // "+ Add event" (the web's espresso Create Event button, as a small pill)
  addEventButton: {
    backgroundColor: colors.espresso,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addEventButtonPressed: {
    backgroundColor: colors.espressoPressed,
  },
  addEventText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.cream,
  },
  sectionLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.brown,
    marginBottom: 8,
  },
  sectionLabelSpaced: {
    marginTop: 16,
  },
  empty: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.tanDark,
  },
  cards: {
    gap: 10,
  },
  cardTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.brownDark,
  },
  cardTitleDone: {
    color: colors.doneText,
    textDecorationLine: 'line-through',
  },

  // One event: white card with a 4px colored bar (web chip: border-l-[4px])
  eventCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.panelBorder,
    borderLeftWidth: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 2,
  },
  eventCardPressed: {
    borderColor: colors.tan, // left bar keeps its color (set inline)
  },
  eventTime: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
  eventLocation: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.tanDark,
  },

  // One reminder (same look as a Reminders tab row, but not tappable)
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.panelBorder,
    backgroundColor: colors.white,
  },
  reminderCardDone: {
    backgroundColor: colors.doneBg,
    borderColor: colors.doneBorder,
    opacity: 0.6,
  },
  checkbox: {
    width: 20,
    height: 20,
    marginTop: 1,
    borderRadius: 5,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    lineHeight: 15,
  },
  reminderBody: {
    flex: 1,
  },
  reminderTime: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.tanDark,
    marginTop: 2,
  },
});
