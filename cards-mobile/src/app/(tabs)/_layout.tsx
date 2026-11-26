import { Tabs } from 'expo-router/js-tabs';

import { colors, fonts } from '@/theme';

// Bottom tabs shown after login. The "(tabs)" folder is a group: its name
// isn't part of the URL, so the tabs live at /calendar and /reminders.
// Each file in this folder is one tab; the Tabs.Screen order below is the
// order in the bar, and Calendar (first) is where the app lands.
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // each screen draws its own header
        tabBarActiveTintColor: colors.burgundy,
        tabBarInactiveTintColor: colors.brown,
        tabBarStyle: {
          backgroundColor: colors.cream,
          borderTopColor: colors.panelBorder,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.bodySemiBold,
          fontSize: 14,
        },
        // No icon library yet, so the tabs are text only. Without this, each
        // tab would show a placeholder "⏷" where the icon goes.
        tabBarIconStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
      <Tabs.Screen name="reminders" options={{ title: 'Reminders' }} />
    </Tabs>
  );
}
