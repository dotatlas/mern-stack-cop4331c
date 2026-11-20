import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiRequest } from '@/api';
import { useAuth, type User } from '@/auth';
import { formatDueAt, getSampleReminders, type Reminder } from '@/reminders';
import { colors, fonts } from '@/theme';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [checking, setChecking] = useState(false);

  // The list on screen. Starts with sample data; checking one off only
  // changes this copy in memory (nothing is saved yet).
  const [reminders, setReminders] = useState<Reminder[]>(getSampleReminders);
  const doneCount = reminders.filter((r) => r.completed).length;

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

      <ScrollView contentContainerStyle={styles.content}>
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
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {doneCount} of {reminders.length} done
              </Text>
            </View>
          </View>

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
