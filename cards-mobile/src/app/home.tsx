import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiRequest } from '@/api';
import { useAuth, type User } from '@/auth';
import { colors, fonts } from '@/theme';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [checking, setChecking] = useState(false);

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

      <View style={styles.content}>
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
      </View>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
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
});
