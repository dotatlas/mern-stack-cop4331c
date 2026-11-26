import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiRequest } from '@/api';
import { useAuth, type User } from '@/auth';
import {
  DUE_CHOICES,
  formatDueAt,
  makeNewReminder,
  REMINDERS_PATH,
  type DueChoice,
  type Reminder,
} from '@/reminders';
import { colors, fonts } from '@/theme';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [checking, setChecking] = useState(false);

  // The list on screen, loaded from the server. Adding saves to the server;
  // checking off still only changes this copy in memory (not saved yet).
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const doneCount = reminders.filter((r) => r.completed).length;
  const [loading, setLoading] = useState(true); // first load: big spinner
  const [refreshing, setRefreshing] = useState(false); // pull-to-refresh spinner
  const [loadError, setLoadError] = useState<string | null>(null);
  // Counts loads so only the newest answer is used if two overlap
  const loadId = useRef(0);

  // Ask the server for my reminders. apiRequest sends the login token, and
  // logs out by itself if the server says the token is no longer valid.
  async function loadReminders() {
    const id = ++loadId.current;
    setLoadError(null);
    try {
      const data = await apiRequest<Reminder[]>(REMINDERS_PATH);
      if (id === loadId.current) setReminders(data);
    } catch (e) {
      // Keep whatever list was already showing and explain what went wrong
      if (id === loadId.current) setLoadError(e instanceof Error ? e.message : String(e));
    } finally {
      if (id === loadId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }

  // Load once when Home opens
  useEffect(() => {
    loadReminders();
  }, []);

  // Pull down on the screen to reload
  function handleRefresh() {
    setRefreshing(true);
    loadReminders();
  }

  // The Add reminder form
  const [newTitle, setNewTitle] = useState('');
  const [newDue, setNewDue] = useState<DueChoice>('No date');
  const [addError, setAddError] = useState<string | null>(null);
  const [titleFocused, setTitleFocused] = useState(false);
  const [adding, setAdding] = useState(false); // spinner on the Add button

  // Save the new reminder on the server, then show the copy it sends back
  async function handleAddReminder() {
    if (adding) return; // ignore extra taps / Enter presses while waiting

    const title = newTitle.trim();
    if (!title) {
      setAddError('Please enter a title');
      return;
    }

    setAddError(null);
    setAdding(true);
    try {
      const saved = await apiRequest<Reminder>(
        REMINDERS_PATH,
        'POST',
        makeNewReminder(title, newDue),
      );
      // New ones go on top, like the web dashboard. The server's copy has the real _id.
      setReminders((previous) => [saved, ...previous]);
      setNewTitle('');
      setNewDue('No date');
    } catch (e) {
      // Leave the title and due date as typed so the user can just tap Add again
      setAddError(e instanceof Error ? e.message : String(e));
    } finally {
      setAdding(false);
    }
  }

  // Flip one reminder between done and not done
  function toggleReminder(id: string) {
    setReminders((previous) =>
      previous.map((r) => (r._id === id ? { ...r, completed: !r.completed } : r)),
    );
  }

  // Asks the server for my account. Only works if the token is sent along.
  async function handleCheckAccount() {
    if (!user || checking) return;
    setChecking(true);
    try {
      const account = await apiRequest<User>(`/users/${user._id}`);
      Alert.alert('Your account', `${account.firstName} ${account.lastName}\n${account.email}`);
    } catch (e) {
      Alert.alert('Could not check account', e instanceof Error ? e.message : String(e));
    } finally {
      setChecking(false);
    }
  }

  async function handleLogout() {
    await logout(); // deletes the saved token and user
    // replace (not push) swaps Home out for Login, so Back can't return here
    router.replace('/login');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top bar: Log Out on the right, like the web dashboard header */}
      <View style={styles.topBar}>
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
          accessibilityRole="button"
        >
          {({ pressed }) => (
            <Text style={[styles.logoutText, pressed && styles.logoutTextPressed]}>Log Out</Text>
          )}
        </Pressable>
      </View>

      {/* handled: tapping Add / a chip works on the first tap even with the keyboard open.
          automaticallyAdjustKeyboardInsets: on iPhone, lets you scroll the form above the keyboard. */}
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.burgundy} // iOS spinner color
            colors={[colors.burgundy]} // Android spinner color
          />
        }
      >
        {/* Brand header (same as the login screen) */}
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>C</Text>
          </View>
          <Text style={styles.brandTitle}>Calendar</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Welcome, {user?.firstName} {user?.lastName}
          </Text>

          <Pressable
            onPress={handleCheckAccount}
            disabled={checking}
            style={({ pressed }) => [
              styles.checkButton,
              pressed && styles.checkButtonPressed,
              checking && styles.checkButtonDisabled,
            ]}
            accessibilityRole="button"
          >
            {checking ? (
              <ActivityIndicator color={colors.burgundy} />
            ) : (
              <Text style={styles.checkButtonText}>Check my account</Text>
            )}
          </Pressable>
        </View>

        {/* Reminders panel, styled like the web dashboard's */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <View style={styles.panelTitleRow}>
              <Text style={styles.panelTitle}>Reminders</Text>
              <View style={styles.titleDot} />
            </View>
            {!loading && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>
                  {doneCount} of {reminders.length} done
                </Text>
              </View>
            )}
          </View>

          {/* Add reminder form */}
          <View style={styles.addForm}>
            <TextInput
              style={[styles.addInput, titleFocused && styles.addInputFocused]}
              value={newTitle}
              onChangeText={(text) => {
                setNewTitle(text);
                if (addError) setAddError(null);
              }}
              placeholder="Add a reminder..."
              placeholderTextColor={colors.doneText}
              returnKeyType="done"
              onSubmitEditing={handleAddReminder}
              onFocus={() => setTitleFocused(true)}
              onBlur={() => setTitleFocused(false)}
            />

            {/* Due date: tap one choice */}
            <View style={styles.chips}>
              {DUE_CHOICES.map((c) => {
                const selected = newDue === c.label;
                return (
                  <Pressable
                    key={c.label}
                    onPress={() => setNewDue(c.label)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {c.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {addError && <Text style={styles.addError}>{addError}</Text>}

            <Pressable
              onPress={handleAddReminder}
              disabled={adding}
              accessibilityRole="button"
              accessibilityState={{ busy: adding, disabled: adding }}
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.addButtonPressed,
                adding && styles.addButtonDisabled,
              ]}
            >
              {adding ? (
                <ActivityIndicator size="small" color={colors.cream} />
              ) : (
                <Text style={styles.addButtonText}>Add</Text>
              )}
            </Pressable>
          </View>

          {loadError && <Text style={styles.loadError}>{loadError}</Text>}

          {loading ? (
            <ActivityIndicator style={styles.listSpinner} size="large" color={colors.green} />
          ) : reminders.length === 0 && !loadError ? (
            <Text style={styles.empty}>No reminders yet. Add one above!</Text>
          ) : null}

          <View style={styles.list}>
            {reminders.map((r) => {
              const due = formatDueAt(r.dueAt);
              // Web: green while pending, pink once checked off
              const accent = r.completed ? colors.pink : colors.green;
              return (
                <Pressable
                  key={r._id}
                  onPress={() => toggleReminder(r._id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: r.completed }}
                  style={({ pressed }) => [
                    styles.reminder,
                    r.completed && styles.reminderDone,
                    pressed && styles.reminderPressed,
                  ]}
                >
                  {/* Checkbox: empty outline, or filled with a checkmark */}
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
                    <Text style={[styles.reminderTitle, r.completed && styles.reminderTitleDone]}>
                      {r.title}
                    </Text>
                    {due && (
                      <View style={styles.dueRow}>
                        <View style={[styles.dueDot, { backgroundColor: accent }]} />
                        <Text style={styles.dueText}>{due}</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.page,
  },

  // Top bar + Log Out (matches the web's rounded-full cream button)
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  logoutButton: {
    backgroundColor: colors.cream,
    borderWidth: 2,
    borderColor: colors.tan,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
    boxShadow: '0 1px rgba(0, 0, 0, 0.05)',
  },
  logoutButtonPressed: {
    borderColor: colors.tanDark,
    transform: [{ scale: 0.95 }],
  },
  logoutText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.brown,
  },
  logoutTextPressed: {
    color: colors.brownDark,
  },

  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 32,
  },

  // Brand header
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.burgundy,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  logoText: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontSize: 18,
  },
  brandTitle: {
    fontFamily: fonts.heading,
    fontSize: 30,
    letterSpacing: -0.75,
    color: colors.stone900,
  },

  // Card
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.white,
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.stone100,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  cardTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.stone800,
    textAlign: 'center',
  },

  // "Check my account": outlined version of the burgundy button
  checkButton: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.burgundy,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  checkButtonPressed: {
    backgroundColor: colors.stone50,
  },
  checkButtonDisabled: {
    opacity: 0.7,
  },
  checkButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.burgundy,
  },

  // Reminders panel (web: bg-[#FAF5EE] rounded-3xl border-2 border-[#DFD3C3] p-7)
  panel: {
    width: '100%',
    maxWidth: 420,
    marginTop: 16,
    backgroundColor: colors.cream,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.panelBorder,
    padding: 20,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  panelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  panelTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.brownDark,
  },
  titleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  countBadge: {
    backgroundColor: colors.greenSoft,
    borderWidth: 1,
    borderColor: colors.greenBorder,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  countText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.greenDark,
  },

  // Add reminder form (web inputs: white, border-2 tan, rounded; green Save button)
  addForm: {
    gap: 10,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.panelBorder,
  },
  addInput: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.brownDark,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.tan,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addInputFocused: {
    borderColor: colors.green,
  },
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
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  chipText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.brown,
  },
  chipTextSelected: {
    color: colors.cream,
  },
  addError: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.error,
  },
  addButton: {
    alignSelf: 'flex-end',
    backgroundColor: colors.green,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  addButtonPressed: {
    backgroundColor: '#284936', // web hover:bg-[#284936]
  },
  addButtonDisabled: {
    opacity: 0.7,
  },
  addButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.cream,
  },

  // Loading / empty / error states above the list
  listSpinner: {
    marginVertical: 24,
  },
  empty: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.tanDark,
    textAlign: 'center',
    marginVertical: 24,
  },
  loadError: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 12,
  },

  // One reminder row
  list: {
    gap: 12,
  },
  reminder: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.panelBorder,
    backgroundColor: colors.white,
  },
  reminderDone: {
    backgroundColor: colors.doneBg,
    borderColor: colors.doneBorder,
    opacity: 0.6,
  },
  reminderPressed: {
    borderColor: colors.tan,
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
  reminderTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.brownDark,
  },
  reminderTitleDone: {
    color: colors.doneText,
    textDecorationLine: 'line-through',
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  dueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dueText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.tanDark,
  },
});
