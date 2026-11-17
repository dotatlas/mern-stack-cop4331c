import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts } from '@/theme';

export default function HomeScreen() {
  // The login screen passes the name along when it navigates here
  const { firstName, lastName } = useLocalSearchParams<{
    firstName: string;
    lastName: string;
  }>();

  return (
    <SafeAreaView style={styles.safeArea}>
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
            Welcome, {firstName} {lastName}
          </Text>
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
});
