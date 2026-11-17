import { API_BASE_URL } from '@/config';

// How long to wait for the server before giving up.
const TIMEOUT_MS = 10000;

// Sends a JSON request to the backend and returns the parsed JSON reply.
// Throws an Error with a readable message when anything goes wrong:
//   - the server answered with an error  -> the server's { error } text
//   - no answer within 10 seconds        -> "Request timed out"
//   - no network / server unreachable    -> "Could not reach the server..."
//
// Example: await apiRequest('/auth/login', 'POST', { email, password })
export async function apiRequest<T = unknown>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: unknown,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw new Error('Could not reach the server. Check your internet connection.');
  } finally {
    clearTimeout(timer);
  }

  // Every backend reply is JSON, but don't crash if one isn't.
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error ?? `Server responded with ${response.status}`);
  }

  return data as T;
}
