import { useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';

import { API_BASE_URL } from '@/config';

export default function HomeScreen() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function testConnection() {
    setLoading(true);
    setResult(null);
    setError(null);

    // Give up after 10 seconds instead of waiting forever.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${API_BASE_URL}/ping`, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      const data: { message: string } = await response.json();
      setResult(data.message);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        setError('Request timed out');
      } else {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calendar App - Mobile</Text>

      <Button title="Test connection" onPress={testConnection} disabled={loading} />

      {loading && <ActivityIndicator style={styles.status} />}
      {result && <Text style={[styles.status, styles.success]}>{result}</Text>}
      {error && <Text style={[styles.status, styles.error]}>Error: {error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
  },
  status: {
    marginTop: 16,
    fontSize: 16,
  },
  success: {
    color: '#1a7f37',
  },
  error: {
    color: '#cf222e',
    textAlign: 'center',
  },
});
