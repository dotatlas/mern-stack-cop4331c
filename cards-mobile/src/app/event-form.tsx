import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiRequest } from '@/api';
import {
  dateFromKey,
  dayKey,
  EVENT_CATEGORIES,
  EVENT_COLORS,
  EVENTS_PATH,
  formatDayTitle,
  formatTimeInput,
  parseTime,
  spansDays,
  type CalendarEvent,
  type CreateEventResponse,
  type EventResponse,
  type EventUpdate,
  type NewEvent,
} from '@/calendar';
import { colors, fonts } from '@/theme';

type Field = 'title' | 'start' | 'end' | 'location' | 'notes';

// The event form, for both adding and editing. The Calendar tab opens it with
//   ?date=YYYY-MM-DD  -> "New Event" on that day
//   ?id=<event id>    -> "Edit Event", filled with that event (loaded fresh)
// Fields and wording follow the web dashboard's event form, plus the all-day
// switch, end time and location asked for on mobile.
export default function EventFormScreen() {
  const params = useLocalSearchParams<{ date?: string; id?: string }>();
  const editId = params.id || null;
  const isEdit = editId !== null;

  // The day the event is on. Add: from ?date (or today if missing/malformed).
  // Edit: the event's start day, set once it loads.
  const [dateKey, setDateKey] = useState(
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : dayKey(new Date()),
  );

  const [title, setTitle] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [startText, setStartText] = useState('');
  const [endText, setEndText] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState<string>(EVENT_COLORS[0].value);
  const [category, setCategory] = useState<string>(EVENT_CATEGORIES[0]);

  // Edit only: the event as loaded, to see what changed
  const [original, setOriginal] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(isEdit);

  const [focused, setFocused] = useState<Field | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false); // spinner on Delete event
  const busy = saving || deleting;
  const [error, setError] = useState<string | null>(null);

  const endRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  // Edit: load the event and fill the form with it
  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      try {
        const { event } = await apiRequest<EventResponse>(`${EVENTS_PATH}/${editId}`);
        if (cancelled) return;
        const start = new Date(event.start);
        const end = new Date(event.end);
        setOriginal(event);
        setDateKey(dayKey(start));
        setTitle(event.title);
        setAllDay(event.allDay);
        setStartText(event.allDay ? '' : formatTimeInput(start));
        setEndText(event.allDay ? '' : formatTimeInput(end));
        setLocation(event.location ?? '');
        setNotes(event.notes ?? '');
        setColor(event.color);
        setCategory(event.category);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  // Category chips: the web's list, plus the event's own category if it's a
  // different one (e.g. set by another client), so editing doesn't lose it
  const categoryChoices: string[] = [...EVENT_CATEGORIES];
  if (original && !categoryChoices.includes(original.category)) {
    categoryChoices.push(original.category);
  }
  // Swatch to highlight. A color that isn't one of the four shows (like on the
  // calendar) as Dark Blue; it's only changed if the user taps a swatch.
  const shownColor =
    EVENT_COLORS.find((c) => c.value === color.toUpperCase())?.value ?? EVENT_COLORS[0].value;

  // Edit: did the user touch the all-day switch or either time?
  const timesChanged =
    !original ||
    allDay !== original.allDay ||
    startText !== (original.allDay ? '' : formatTimeInput(new Date(original.start))) ||
    endText !== (original.allDay ? '' : formatTimeInput(new Date(original.end)));
  const multiDay = original !== null && spansDays(original);

  // Shared props for the focus highlight
  const focusProps = (field: Field) => ({
    onFocus: () => setFocused(field),
    onBlur: () => setFocused(null),
  });

  // Works out start/end from the form, or returns the message to show in red
  function buildTimes(): { start: Date; end: Date } | string {
    const day = dateFromKey(dateKey);
    if (allDay) {
      // Same as the web: midnight to 23:59:59.999 on that day
      const end = new Date(day);
      end.setHours(23, 59, 59, 999);
      return { start: day, end };
    }

    const startTime = parseTime(startText);
    if (!startText.trim()) return 'Please enter a start time, or turn on All day';
    if (!startTime) return 'Please enter the start time like 2:00 PM';
    const start = new Date(day);
    start.setHours(startTime.hours, startTime.minutes, 0, 0);

    // No end time: one hour long, like the web
    if (!endText.trim()) {
      return { start, end: new Date(start.getTime() + 60 * 60 * 1000) };
    }
    const endTime = parseTime(endText);
    if (!endTime) return 'Please enter the end time like 3:00 PM';
    const end = new Date(day);
    end.setHours(endTime.hours, endTime.minutes, 0, 0);
    if (end < start) return "End time can't be before the start time";
    return { start, end };
  }

  async function handleSave() {
    if (busy || loading) return; // ignore extra taps while waiting

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    // Edit with untouched times: keep the event's own start/end (they may span
    // several days, which this one-day form can't show)
    const times = timesChanged ? buildTimes() : null;
    if (typeof times === 'string') {
      setError(times);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      if (original) {
        // Send only what the form manages; color/category only if changed,
        // start/end/allDay only if the times were touched
        const update: EventUpdate = {
          title: title.trim(),
          location: location.trim(),
          notes: notes.trim(),
        };
        if (color !== original.color) update.color = color;
        if (category !== original.category) update.category = category;
        if (times) {
          update.start = times.start.toISOString();
          update.end = times.end.toISOString();
          update.allDay = allDay;
        }
        await apiRequest<CreateEventResponse>(`${EVENTS_PATH}/${original._id}`, 'PUT', update);
      } else {
        const t = times ?? buildTimes();
        if (typeof t === 'string') throw new Error(t); // can't happen: checked above
        const body: NewEvent = {
          title: title.trim(),
          start: t.start.toISOString(),
          end: t.end.toISOString(),
          allDay,
          location: location.trim(),
          notes: notes.trim(),
          color,
          category,
        };
        await apiRequest<CreateEventResponse>(EVENTS_PATH, 'POST', body);
      }
      // Back to the Calendar tab, which reloads when it comes into view,
      // so the new or updated event shows on the grid and in the day panel
      goBack();
    } catch (e) {
      // Keep everything as typed so the user can fix it and try again
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  // "Delete event": ask first, like the web's "Delete this event?"
  function confirmDelete() {
    if (!original || busy) return;
    // Alert buttons do nothing in a browser, so use the browser's own popup there
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this event?')) handleDelete();
      return;
    }
    Alert.alert('Delete this event?', original.title, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: handleDelete },
    ]);
  }

  async function handleDelete() {
    if (!original || busy) return;
    setError(null);
    setDeleting(true);
    try {
      // Replies 200 { message }; 404 if it's already gone
      await apiRequest(`${EVENTS_PATH}/${original._id}`, 'DELETE');
      // The Calendar tab reloads as it comes back into view, so it's gone there too
      goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setDeleting(false);
    }
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/calendar');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top bar: Cancel on the left */}
        <View style={styles.topBar}>
          <Pressable onPress={goBack} disabled={busy} hitSlop={8} accessibilityRole="button">
            {({ pressed }) => (
              <Text style={[styles.cancelText, pressed && styles.cancelTextPressed]}>Cancel</Text>
            )}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.panel}>
            <Text style={styles.heading} accessibilityRole="header">
              {isEdit ? 'Edit Event' : 'New Event'}
            </Text>
            {!loading && <Text style={styles.subheading}>{formatDayTitle(dateKey)}</Text>}

            {loading ? (
              <ActivityIndicator style={styles.loading} size="large" color={colors.espresso} />
            ) : isEdit && !original ? (
              // Couldn't load the event (deleted, no connection...): just the error
              <Text style={[styles.error, styles.loadError]}>{error}</Text>
            ) : (
              <>
                {/* Title (web: "Event Title") */}
                <View style={styles.field}>
                  <Text style={styles.label}>Event Title</Text>
                  <TextInput
                    style={[styles.input, focused === 'title' && styles.inputFocused]}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. COP4331 Presentation or Midterm"
                    placeholderTextColor={colors.placeholder}
                    maxLength={200}
                    returnKeyType="next"
                    {...focusProps('title')}
                  />
                </View>

                {/* All day */}
                <View style={styles.switchRow}>
                  <Text style={styles.label}>All Day</Text>
                  <Switch
                    value={allDay}
                    onValueChange={setAllDay}
                    trackColor={{ false: colors.tan, true: colors.espresso }}
                    thumbColor={colors.white}
                    ios_backgroundColor={colors.tan}
                    accessibilityLabel="All day"
                  />
                </View>

                {/* Start / end time (hidden when all day) */}
                {!allDay && (
                  <View style={styles.row}>
                    <View style={[styles.field, styles.half]}>
                      <Text style={styles.label}>Start Time</Text>
                      <TextInput
                        style={[styles.input, focused === 'start' && styles.inputFocused]}
                        value={startText}
                        onChangeText={setStartText}
                        placeholder="e.g. 2:00 PM"
                        placeholderTextColor={colors.placeholder}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="next"
                        onSubmitEditing={() => endRef.current?.focus()}
                        {...focusProps('start')}
                      />
                    </View>
                    <View style={[styles.field, styles.half]}>
                      <Text style={styles.label}>End (Optional)</Text>
                      <TextInput
                        ref={endRef}
                        style={[styles.input, focused === 'end' && styles.inputFocused]}
                        value={endText}
                        onChangeText={setEndText}
                        placeholder="1 hour later"
                        placeholderTextColor={colors.placeholder}
                        autoCapitalize="none"
                        autoCorrect={false}
                        {...focusProps('end')}
                      />
                    </View>
                  </View>
                )}

                {/* Multi-day events can't be shown in this one-day form */}
                {multiDay && (
                  <Text style={styles.hint}>
                    {timesChanged
                      ? `This will become a one-day event on ${formatDayTitle(dateKey)}.`
                      : 'This event spans several days. Leave the times as they are to keep its dates.'}
                  </Text>
                )}

                {/* Location */}
                <View style={styles.field}>
                  <Text style={styles.label}>Location (Optional)</Text>
                  <TextInput
                    style={[styles.input, focused === 'location' && styles.inputFocused]}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="e.g. HEC 101"
                    placeholderTextColor={colors.placeholder}
                    maxLength={200}
                    {...focusProps('location')}
                  />
                </View>

                {/* Category (web: a dropdown; chips on mobile) */}
                <View style={styles.field}>
                  <Text style={styles.label}>Category</Text>
                  <View style={styles.chips}>
                    {categoryChoices.map((c) => {
                      const selected = category === c;
                      return (
                        <Pressable
                          key={c}
                          onPress={() => setCategory(c)}
                          accessibilityRole="radio"
                          accessibilityState={{ selected }}
                          style={[styles.chip, selected && styles.chipSelected]}
                        >
                          <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                            {c}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Accent Color (web: 4 swatches; the chosen one gets a dark border) */}
                <View style={styles.field}>
                  <Text style={styles.label}>Accent Color</Text>
                  <View style={styles.swatches}>
                    {EVENT_COLORS.map((c) => {
                      const selected = shownColor === c.value;
                      return (
                        <Pressable
                          key={c.value}
                          onPress={() => setColor(c.value)}
                          accessibilityRole="radio"
                          accessibilityLabel={c.label}
                          accessibilityState={{ selected }}
                          style={[
                            styles.swatch,
                            { backgroundColor: c.value },
                            selected ? styles.swatchSelected : styles.swatchIdle,
                          ]}
                        />
                      );
                    })}
                  </View>
                </View>

                {/* Notes */}
                <View style={styles.field}>
                  <Text style={styles.label}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.notes, focused === 'notes' && styles.inputFocused]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Agenda or details..."
                    placeholderTextColor={colors.placeholder}
                    multiline
                    maxLength={2000}
                    textAlignVertical="top"
                    {...focusProps('notes')}
                  />
                </View>

                {error && <Text style={styles.error}>{error}</Text>}

                {/* Web: "Create Event" / "Save Changes", dark espresso button */}
                <Pressable
                  onPress={handleSave}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityState={{ busy: saving, disabled: busy }}
                  style={({ pressed }) => [
                    styles.saveButton,
                    pressed && styles.saveButtonPressed,
                    busy && styles.saveButtonDisabled,
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator color={colors.cream} />
                  ) : (
                    <Text style={styles.saveText}>{isEdit ? 'Save Changes' : 'Create Event'}</Text>
                  )}
                </Pressable>

                {/* Edit only. Web: pink-tinted pill, solid pink with white text on hover. */}
                {isEdit && (
                  <Pressable
                    onPress={confirmDelete}
                    disabled={busy}
                    accessibilityRole="button"
                    accessibilityState={{ busy: deleting, disabled: busy }}
                    style={({ pressed }) => [
                      styles.deleteButton,
                      pressed && styles.deleteButtonPressed,
                      busy && styles.saveButtonDisabled,
                    ]}
                  >
                    {({ pressed }) =>
                      deleting ? (
                        <ActivityIndicator color={colors.pinkDark} />
                      ) : (
                        <Text style={[styles.deleteText, pressed && styles.deleteTextPressed]}>
                          Delete event
                        </Text>
                      )
                    }
                  </Pressable>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Styles follow the web's event form (see the comments in theme.ts for colors)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.page,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cancelText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.brown,
  },
  cancelTextPressed: {
    color: colors.brownDark,
  },
  content: {
    padding: 16,
    paddingTop: 0,
    alignItems: 'center',
  },

  panel: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.cream,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.panelBorder,
    padding: 20,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  heading: {
    fontFamily: fonts.headingBold,
    fontSize: 24,
    color: colors.brownDark,
  },
  subheading: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.tanDark,
    marginTop: 4,
    marginBottom: 20,
  },
  loading: {
    marginVertical: 32,
  },
  loadError: {
    marginTop: 16,
  },

  // Fields (web: label text-xs font-bold uppercase text-[#6C5B4F];
  // input white border-2 border-[#CFBEAA] rounded-2xl p-3, focus border-[#4E2E1E])
  field: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.brown,
    marginBottom: 6,
  },
  input: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.brownDark,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.tan,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputFocused: {
    borderColor: colors.espresso,
  },
  notes: {
    minHeight: 72,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  // Note under the times for multi-day events
  hint: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.tanDark,
    marginTop: -6,
    marginBottom: 16,
  },

  // Category chips (same shape as the Reminders tab's due-date chips)
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 2,
    borderColor: colors.tan,
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipSelected: {
    backgroundColor: colors.espresso,
    borderColor: colors.espresso,
  },
  chipText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.brown,
  },
  chipTextSelected: {
    color: colors.cream,
  },

  // Color swatches (web: h-9 rounded-xl border-2; chosen: border-[#2C211B]
  // scale-105, others opacity-65)
  swatches: {
    flexDirection: 'row',
    gap: 8,
  },
  swatch: {
    flex: 1,
    height: 36,
    borderRadius: 12,
    borderWidth: 2,
  },
  swatchSelected: {
    borderColor: colors.brownDark,
    transform: [{ scale: 1.05 }],
  },
  swatchIdle: {
    borderColor: 'transparent',
    opacity: 0.65,
  },

  error: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 12,
  },

  // Web: w-full bg-[#4E2E1E] hover:bg-[#3D2214] text-[#FAF5EE] py-3.5 rounded-2xl uppercase
  saveButton: {
    backgroundColor: colors.espresso,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonPressed: {
    backgroundColor: colors.espressoPressed,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.cream,
  },

  // Web: bg-[#A85368]/15 border-2 border-[#A85368]/30 text-[#632736] rounded-full
  // uppercase; hover:bg-[#A85368] hover:text-white
  deleteButton: {
    marginTop: 12,
    backgroundColor: colors.pinkTint,
    borderWidth: 2,
    borderColor: colors.pinkBorder,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteButtonPressed: {
    backgroundColor: colors.pink,
  },
  deleteText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.pinkDark,
  },
  deleteTextPressed: {
    color: colors.white,
  },
});
