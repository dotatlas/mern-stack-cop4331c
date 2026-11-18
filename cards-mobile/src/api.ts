import { API_BASE_URL } from '@/config';

// How long to wait for the server before giving up.
const TIMEOUT_MS = 10000;

// The saved login token. The auth context (src/auth.tsx) keeps this up to date
// so every request can send it without each screen passing it in.
let authToken: string | null = null;

// What to do when the server rejects the token. The auth context sets this
// to "log out and go to the Login screen".
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

// Sends a JSON request to the backend and returns the parsed JSON reply.
// Adds "Authorization: Bearer <token>" when the user is logged in.
// Throws an Error with a readable message when anything goes wrong:
//   - the server answered with an error  -> the server's { error } text
//   - the saved token was rejected (401) -> logs out, "Your session expired..."
//   - no answer within 10 seconds        -> "Request timed out"
//   - no network / server unreachable    -> "Could not reach the server..."
//
// Example: await apiRequest('/auth/login', 'POST', { email, password })
export async function apiRequest<T = unknown>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const sentToken = authToken;
  if (sentToken) {
    headers.Authorization = `Bearer ${sentToken}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
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

  // 401 on a request that carried a token = the token is expired or invalid.
  // (A 401 without a token, like a wrong password at login, is just an error.)
  if (response.status === 401 && sentToken) {
    onUnauthorized?.();
    throw new Error('Your session expired. Please log in again.');
  }

  if (!response.ok) {
    throw new Error(data?.error ?? `Server responded with ${response.status}`);
  }

  return data as T;
}
