import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiRequest } from '@/api';
import { useAuth, type User } from '@/auth';
import { colors, fonts } from '@/theme';

// What POST /auth/login sends back on success
type LoginResponse = {
  token: string;
  user: User;
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { login } = useAuth();
  const passwordRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  // Register sends us back here with ?registered=1&email=... after it
  // creates an account. When those arrive, show the green message and
  // fill in the new email so the user only has to type their password.
  const params = useLocalSearchParams<{ registered?: string; email?: string }>();
  useEffect(() => {
    if (params.registered !== '1') return;
    setEmail(params.email ?? '');
    setPassword('');
    setError(null);
    setSuccess('Account created! Please log in.');
  }, [params.registered, params.email]);

  async function handleLogin() {
    if (loading) return; // ignore extra taps / Enter presses while waiting

    if (!email.trim() || !password) {
      setSuccess(null);
      setError('Please enter your email and password');
      return;
    }

    setSuccess(null);
    setError(null);
    setLoading(true);
    try {
      const data = await apiRequest<LoginResponse>('/auth/login', 'POST', {
        email: email.trim(),
        password,
      });
      await login(data.token, data.user); // saves to secure storage
      // replace (not push) swaps Login out for Home, so Back can't return here
      router.replace('/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand header */}
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>C</Text>
            </View>
            <Text style={styles.brandTitle}>Calendar</Text>
          </View>

          {/* Login card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back</Text>

            {success && <Text style={styles.success}>{success}</Text>}

            <View style={styles.field}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, focused === 'email' && styles.inputFocused]}
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                placeholderTextColor={colors.stone500}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                ref={passwordRef}
                style={[styles.input, focused === 'password' && styles.inputFocused]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={handleLogin}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
              />
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonText}>Log In</Text>
              )}
            </Pressable>

            <View style={styles.footer}>
              <Pressable onPress={() => router.push('/register')} hitSlop={8}>
                {({ pressed }) => (
                  <Text style={[styles.link, pressed && styles.linkPressed]}>
                    Need an account? Register here
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.page,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    marginBottom: 24,
  },

  // Inputs
  field: {
    marginBottom: 16,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.stone500,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  input: {
    fontFamily: fonts.body,
    fontSize: 16, // 16+ stops iOS from feeling cramped; web uses 14
    color: colors.stone800,
    backgroundColor: colors.stone50,
    borderWidth: 1,
    borderColor: colors.stone200,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputFocused: {
    borderColor: colors.burgundy,
  },

  // Button
  button: {
    backgroundColor: colors.burgundy,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  buttonPressed: {
    backgroundColor: colors.burgundyPressed,
  },
  buttonDisabled: {
    opacity: 0.7,
  },

  // Error message under the inputs
  error: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 8,
  },
  // Green message after registering
  success: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.success,
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: colors.white,
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
  },

  // Footer link
  footer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.stone100,
    alignItems: 'center',
  },
  link: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.stone500,
  },
  linkPressed: {
    color: colors.stone800,
  },
});
