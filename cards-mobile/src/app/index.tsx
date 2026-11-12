import { Redirect } from 'expo-router';

// "/" is where the app opens. Send it straight to the login screen.
export default function Index() {
  return <Redirect href="/login" />;
}
