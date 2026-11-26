import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts } from '@/theme';

// The Calendar tab. A placeholder for now.
export default function CalendarScreen() {
  return (
    // No bottom edge: the tab bar already keeps clear of the home indicator
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        {/* Brand header (same as the other screens) */}
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>C</Text>
          </View>
          <Text style={styles.brandTitle}>Calendar</Text>
        </View>

        {/* Panel styled like the Reminders panel */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Calendar coming soon</Text>
          <Text style={styles.panelText}>Your events will show up here.</Text>
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

  // Panel (same look as the Reminders panel)
  panel: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.cream,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.panelBorder,
    padding: 32,
    alignItems: 'center',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  panelTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.brownDark,
    textAlign: 'center',
  },
  panelText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.tanDark,
    textAlign: 'center',
    marginTop: 8,
  },
});
