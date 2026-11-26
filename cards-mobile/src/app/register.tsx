import { useRef, useState } from 'react';
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
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiRequest, REGISTER_PATH } from '@/api';
import { colors, fonts } from '@/theme';

type Field = 'firstName' | 'lastName' | 'email' | 'password';

// Same minimum the server enforces
const MIN_PASSWORD_LENGTH = 8;

// What POST /auth/register sends back on success (201). No token: the user
// has to verify their email before logging in.
type RegisterResponse = {
  message: string;
  emailSent: boolean;
};

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState<Field | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set after a successful sign-up; switches to the "Check your email" screen
  const [sentTo, setSentTo] = useState<string | null>(null);

  // Let "next" on the keyboard jump to the following box
  const lastNameRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const emailRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const passwordRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  async function handleRegister() {
    if (loading) return; // ignore extra taps / Enter presses while waiting

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const data = await apiRequest<RegisterResponse>(REGISTER_PATH, 'POST', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      });
      if (data.emailSent === false) {
        // Account exists but no email went out: show the server's message
        setError(data.message);
        return;
      }
      setSentTo(email.trim());
    } catch (e) {
      // 400 (missing field, bad email, short password), 409 (email taken) and
      // 503 (account created but the email failed) all arrive here with the
      // server's message, which is shown in red under the inputs.
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  // From the "Check your email" screen: close Register and return to the
  // Login screen underneath it with the email filled in. dismissTo removes
  // Register from the stack, so swiping back from Login can't reopen it.
  function backToLoginWithEmail() {
    router.dismissTo({ pathname: '/login', params: { email: sentTo ?? '' } });
  }

  function goToLogin() {
    // Login opened us with push, so going back returns to it.
    // If Register was opened some other way, swap to Login instead.
    if (router.canGoBack()) router.back();
    else router.replace('/login');
  }

  // Shared props for the focus highlight
  const focusProps = (field: Field) => ({
    onFocus: () => setFocused(field),
    onBlur: () => setFocused(null),
  });

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

          {sentTo !== null ? (
            /* Shown after a successful sign-up */
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Check your email</Text>
              <Text style={styles.message}>
                We sent a verification link to{' '}
                <Text style={styles.messageEmail}>{sentTo}</Text>. Click it, then come
                back and log in.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                onPress={backToLoginWithEmail}
              >
                <Text style={styles.buttonText}>Back to Log In</Text>
              </Pressable>
            </View>
          ) : (
          /* Register card */
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create an Account</Text>

            {/* First and last name side by side, like the web */}
            <View style={styles.nameRow}>
              <View style={[styles.field, styles.nameField]}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={[styles.input, focused === 'firstName' && styles.inputFocused]}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  autoComplete="given-name"
                  textContentType="givenName"
                  returnKeyType="next"
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                  {...focusProps('firstName')}
                />
              </View>

              <View style={[styles.field, styles.nameField]}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  ref={lastNameRef}
                  style={[styles.input, focused === 'lastName' && styles.inputFocused]}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  autoComplete="family-name"
                  textContentType="familyName"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  {...focusProps('lastName')}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                ref={emailRef}
                style={[styles.input, focused === 'email' && styles.inputFocused]}
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                placeholderTextColor={colors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                {...focusProps('email')}
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
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="go"
                onSubmitEditing={handleRegister}
                {...focusProps('password')}
              />
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.cream} />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </Pressable>

            <View style={styles.footer}>
              <Pressable onPress={goToLogin} hitSlop={8}>
                {({ pressed }) => (
                  <Text style={[styles.link, pressed && styles.linkPressed]}>
                    Already have an account? Log In
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Same look as login.tsx, plus nameRow / nameField for the two name boxes
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

  // Inputs
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameField: {
    flex: 1,
  },
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

  // Error message under the inputs
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
  // "Check your email" text
  message: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    lineHeight: 22,
    color: colors.tanDark,
    textAlign: 'center',
    marginBottom: 16,
  },
  messageEmail: {
    fontFamily: fonts.bodyBold,
    color: colors.brownDark,
  },
  buttonText: {
    color: colors.cream,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
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
    fontSize: 14,
    color: colors.brown,
  },
  linkPressed: {
    color: colors.brownDark,
  },
});
