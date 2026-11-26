import { useState } from 'react';
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
import { colors, fonts } from '@/theme';

// What POST /auth/forgot-password sends back (200). The server says the same
// thing whether or not the account exists, so nobody can probe for emails.
type ForgotPasswordResponse = {
  message: string;
};

export default function ForgotPasswordScreen() {
  // Login opens us with ?email=... so the box starts with what was typed there
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The server's reply after a successful send; switches to the green message
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  async function handleSend() {
    if (loading) return; // ignore extra taps / Enter presses while waiting

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const data = await apiRequest<ForgotPasswordResponse>(
        '/auth/forgot-password',
        'POST',
        { email: email.trim() },
      );
      setSentMessage(data.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  // Close this screen and return to Login with the email filled in.
  // dismissTo removes this screen from the stack, so Back can't reopen it.
  function backToLogin() {
    router.dismissTo({ pathname: '/login', params: { email: email.trim() } });
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

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Forgot Password</Text>

            {sentMessage !== null ? (
              /* Shown after the server accepts the request */
              <>
                <Text style={styles.success}>{sentMessage}</Text>
                <Pressable
                  style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                  onPress={backToLogin}
                >
                  <Text style={styles.buttonText}>Back to Log In</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.message}>
                  Enter your email and we'll send you a link to reset your password.
                </Text>

                <View style={styles.field}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={[styles.input, focused && styles.inputFocused]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="name@example.com"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="send"
                    onSubmitEditing={handleSend}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                  />
                </View>

                {error && <Text style={styles.error}>{error}</Text>}

                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    pressed && styles.buttonPressed,
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleSend}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.cream} />
                  ) : (
                    <Text style={styles.buttonText}>Send reset link</Text>
                  )}
                </Pressable>

                <View style={styles.footer}>
                  <Pressable onPress={backToLogin} hitSlop={8}>
                    {({ pressed }) => (
                      <Text style={[styles.link, pressed && styles.linkPressed]}>
                        Remembered it? Back to Log In
                      </Text>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Same look as login.tsx
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
    backgroundColor: colors.espresso,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  logoText: {
    color: colors.cream,
    fontFamily: fonts.headingBold,
    fontSize: 18,
  },
  brandTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 30,
    letterSpacing: -0.75,
    color: colors.brownDark,
  },

  // Card
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.cream,
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.calBorder,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  cardTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 20,
    color: colors.brownDark,
    textAlign: 'center',
    marginBottom: 24,
  },
  // Short explanation above the email box
  message: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    lineHeight: 22,
    color: colors.tanDark,
    textAlign: 'center',
    marginBottom: 16,
  },

  // Input
  field: {
    marginBottom: 16,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.brown,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  input: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.brownDark,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.tan,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputFocused: {
    borderColor: colors.espresso,
  },

  // Button
  button: {
    backgroundColor: colors.espresso,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  buttonPressed: {
    backgroundColor: colors.espressoPressed,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.cream,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // Red error under the input
  error: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.error,
    backgroundColor: colors.errorBg,
    borderWidth: 2,
    borderColor: colors.errorBorder,
    borderRadius: 16,
    padding: 12,
    overflow: 'hidden',
    textAlign: 'center',
    marginBottom: 8,
  },
  // Green message after the link is sent
  success: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    lineHeight: 22,
    color: colors.success,
    backgroundColor: colors.successBg,
    borderWidth: 2,
    borderColor: colors.successBorder,
    borderRadius: 16,
    padding: 12,
    overflow: 'hidden',
    textAlign: 'center',
    marginBottom: 16,
  },

  // Footer link
  footer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.panelBorder,
    alignItems: 'center',
  },
  link: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.brown,
  },
  linkPressed: {
    color: colors.brownDark,
  },
});
