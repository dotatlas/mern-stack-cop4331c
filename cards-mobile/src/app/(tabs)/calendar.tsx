import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buildMonthGrid, dayKey, MONTH_NAMES, WEEKDAYS } from '@/calendar';
import { colors, fonts } from '@/theme';

// The Calendar tab: a month grid styled like the web dashboard's. No events yet.
export default function CalendarScreen() {
  const now = new Date();
  const todayKey = dayKey(now);

  // Which month is on screen (month is 0–11). Starts on this month.
  const [shown, setShown] = useState({ year: now.getFullYear(), month: now.getMonth() });
  // The tapped day, as "YYYY-MM-DD", or null before any tap
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const weeks = buildMonthGrid(shown.year, shown.month);

  // Move by -1 / +1 month. new Date() handles going past January or December.
  function changeMonth(by: number) {
    setShown(({ year, month }) => {
      const d = new Date(year, month + by, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function goToToday() {
    const d = new Date();
    setShown({ year: d.getFullYear(), month: d.getMonth() });
  }

  return (
    // No bottom edge: the tab bar already keeps clear of the home indicator
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.panel}>
          {/* Month title + ‹ Today › (web: the bar above the grid) */}
          <View style={styles.header}>
            <Text style={styles.monthTitle} accessibilityRole="header">
              {MONTH_NAMES[shown.month]} {shown.year}
            </Text>

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
                  return (
                    <Pressable
                      key={cell.key}
                      onPress={() => setSelectedKey(cell.key)}
                      accessibilityRole="button"
                      accessibilityLabel={cell.key}
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
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
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
});
