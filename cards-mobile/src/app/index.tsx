import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth';
import { colors } from '@/theme';

// "/" is where the app opens. Go to the Calendar tab if a login was saved,
// otherwise Login.
export default function Index() {
  const { token, loading } = useAuth();

  // Still reading secure storage: show a spinner for a moment
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.burgundy} />
      </View>
    );
  }

  return <Redirect href={token ? '/calendar' : '/login'} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.page,
  },
});
