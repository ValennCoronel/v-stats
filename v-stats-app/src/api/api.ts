import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEV_BASE_URLS = {
  web: 'http://localhost:3000',
  android: 'http://10.0.2.2:3000',
  ios: 'http://localhost:3000',
  default: 'http://192.168.1.6:3000', // Podés cambiarla por la IP de tu red local actual (ej. 192.168.0.100)
} as const;

function getBaseUrl() {
  if (Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_API_URL_WEB
      || process.env.EXPO_PUBLIC_API_URL
      || DEV_BASE_URLS.web;
  }

  if (__DEV__) {
    if (Platform.OS === 'android') {
      return process.env.EXPO_PUBLIC_API_URL_ANDROID
        || process.env.EXPO_PUBLIC_API_URL
        || DEV_BASE_URLS.android;
    }

    if (Platform.OS === 'ios') {
      return process.env.EXPO_PUBLIC_API_URL_IOS
        || process.env.EXPO_PUBLIC_API_URL
        || DEV_BASE_URLS.ios;
    }

    return process.env.EXPO_PUBLIC_API_URL || DEV_BASE_URLS.default;
  }

  return process.env.EXPO_PUBLIC_API_URL || 'https://your-app.vercel.app';
}

const BASE_URL = getBaseUrl();
const TOKEN_KEY = 'vstats-auth-token';

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
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
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
      error: err.message || 'Error de conexion',
      status: 0,
    };
  }
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: any) => request<T>('POST', path, body),
  put: <T>(path: string, body?: any) => request<T>('PUT', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
  getBaseUrl: () => BASE_URL,
};
