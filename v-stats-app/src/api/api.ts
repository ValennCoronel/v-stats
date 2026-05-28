import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const BASE_URL = __DEV__
  ? Platform.OS === 'web'
    ? 'http://localhost:3000'
    : 'http://192.168.0.100:3000' // ← Change this to your local network IP for testing on phone
  : 'https://your-app.vercel.app';

const TOKEN_KEY = 'vstats-auth-token';

// ── Token Management ─────────────────────────────────────────────────────

export async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEY, token);
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.warn('Error setting token', error);
  }
}

export async function removeToken(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.warn('Error removing token', error);
  }
}

// ── API Client ───────────────────────────────────────────────────────────

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: any,
): Promise<ApiResponse<T>> {
  const token = await getToken();
  const url = `${BASE_URL}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      // If 401, token might be expired
      if (response.status === 401) {
        await removeToken();
      }
      return {
        data: null,
        error: json.error || `Error ${response.status}`,
        status: response.status,
      };
    }

    return { data: json as T, error: null, status: response.status };
  } catch (err: any) {
    return {
      data: null,
      error: err.message || 'Error de conexión',
      status: 0,
    };
  }
}

// ── Convenience Methods ──────────────────────────────────────────────────

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: any) => request<T>('POST', path, body),
  put: <T>(path: string, body?: any) => request<T>('PUT', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
  
  // Base URL getter for debugging
  getBaseUrl: () => BASE_URL,
};
